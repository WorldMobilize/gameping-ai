/**
 * Admin/cron generator for cached discovery rotations.
 *
 *   POST /api/admin/discovery/generate
 *     {
 *       "type": "hidden_gems" | "games_of_the_week" | "hidden-gems" | "games-of-the-week",
 *       "mode": "preview" | "draft" | "publish" | "inspect",  // default: draft (or publish if legacy publish=true)
 *       "periodOffsetWeeks": 0,                      // 1 = simulate next period
 *       "force": false                               // regenerate even if a rotation already exists
 *     }
 *   GET /api/admin/discovery/generate?type=hidden_gems&mode=publish   (Vercel cron / manual curl)
 *
 * Pipeline: RAWG candidate pool → AI curator (best-effort) → deterministic
 * fallback → validation → save/publish. Reads/writes the discovery_rotations
 * table via the service role — never exposed to the client.
 *
 *   preview = generate + validate, return JSON only (NO DB write); includes a
 *             `debug` block (candidate/AI/validated counts, fallbackUsed, periodKey)
 *   draft   = generate + validate + save as draft (does NOT affect public pages)
 *   publish = generate + validate + save + publish (validation must pass)
 *   inspect = read the currently published rotation items (no generation/write)
 *
 * The `debug` block is admin/cron-only — it is never part of a public page read.
 *
 * If validation fails (or generation fails), we record a failed status and the
 * previously published rotation stays live — reads never break.
 *
 * Auth (either is accepted):
 *   - Admin session: logged-in user whose profiles.plan = 'admin'
 *   - Cron secret:   Authorization: Bearer <CRON_SECRET>  OR  ?secret=<CRON_SECRET>
 *
 * There is NO anonymous/public write path.
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRotationData } from "@/lib/discovery/generate-rotation";
import { validateRotation } from "@/lib/discovery/validate-rotation";
import {
  getAnyRotation,
  getLatestRotation,
  getPublishedRotation,
  periodKeyForOffset,
  publishRotation,
  saveFailedRotation,
  saveRotation,
  type HiddenGemsRotationData,
  type RotationType,
  type WeeklyRotationData,
} from "@/lib/discovery/rotation-store";

export const dynamic = "force-dynamic";

// "inspect" reads the currently published rotation (no generation, no write);
// the rest run the generate → validate → save/publish pipeline.
type GenerationMode = "preview" | "draft" | "publish" | "inspect";
const VALID_MODES: GenerationMode[] = ["preview", "draft", "publish", "inspect"];

/** Accepts hyphen or underscore forms. */
function normalizeType(value: unknown): RotationType | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase().replace(/-/g, "_");
  if (v === "hidden_gems" || v === "games_of_the_week") return v;
  return null;
}

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
}

function parseInteger(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function resolveMode(raw: unknown, legacyPublish: unknown): GenerationMode {
  if (typeof raw === "string" && VALID_MODES.includes(raw as GenerationMode)) {
    return raw as GenerationMode;
  }
  // Back-compat: old callers used { publish: true } with no mode.
  return parseBool(legacyPublish) ? "publish" : "draft";
}

// --- cron secret check (mirrors /api/cron) ---------------------------------

function secretsMatch(expected: string, provided: string): boolean {
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^\s*Bearer\s+(.+)\s*$/i);
  return m?.[1]?.trim() || null;
}

function hasValidCronSecret(req: Request, url: URL): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const querySecret = url.searchParams.get("secret")?.trim() ?? "";
  const bearer = extractBearerToken(req.headers.get("authorization")) ?? "";
  const provided = querySecret || bearer;
  if (!provided) return false;
  return secretsMatch(expected, provided);
}

// --- admin session check (cookie client + profiles.plan) -------------------

async function hasAdminSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();
    return profile?.plan === "admin";
  } catch {
    return false;
  }
}

async function authorize(
  req: Request,
  url: URL
): Promise<{ ok: true; via: "cron" | "admin" } | { ok: false; response: NextResponse }> {
  if (hasValidCronSecret(req, url)) return { ok: true, via: "cron" };
  if (await hasAdminSession()) return { ok: true, via: "admin" };
  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

// --- core ------------------------------------------------------------------

async function runGeneration(params: {
  type: RotationType;
  mode: GenerationMode;
  periodOffsetWeeks: number;
  force: boolean;
  via: "cron" | "admin";
}): Promise<NextResponse> {
  const { type, mode, periodOffsetWeeks, force, via } = params;
  const periodKey = periodKeyForOffset(type, periodOffsetWeeks);

  // Inspect: read the currently published rotation (current period → latest
  // published). No generation, no write. Lets admins eyeball exactly what the
  // public pages are serving. Auth-gated like everything else here.
  if (mode === "inspect") {
    const current = await getPublishedRotation(type, periodKey);
    const rotation = current ?? (await getLatestRotation(type));
    if (!rotation) {
      return NextResponse.json({
        ok: true,
        mode,
        type,
        periodKey,
        published: null,
        message: "No published rotation found — public pages are using the static fallback.",
      });
    }
    return NextResponse.json({
      ok: true,
      mode,
      type,
      requestedPeriodKey: periodKey,
      periodKey: rotation.periodKey,
      stale: rotation.periodKey !== periodKey,
      status: rotation.status,
      generatedAt: rotation.generatedAt,
      publishedAt: rotation.publishedAt,
      itemCount: rotation.items.length,
      sourceSummary: rotation.sourceSummary,
      featured: rotation.featuredItem,
      items: rotation.items,
    });
  }

  // Skip regeneration if a published rotation already exists for this period
  // (unless forced). Preview never writes, so it always regenerates.
  if (mode !== "preview" && !force) {
    const existing = await getAnyRotation(type, periodKey);
    if (existing && existing.status === "published") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        type,
        periodKey,
        status: existing.status,
        message: "A published rotation already exists for this period. Pass force=true to regenerate.",
      });
    }
  }

  const generated = await generateRotationData(type);

  if (!generated.ok) {
    if (mode !== "preview") {
      await saveFailedRotation(type, periodKey, generated.error);
    }
    console.warn("[discovery:generate] failed", { type, periodKey, mode, error: generated.error, debug: generated.debug });
    return NextResponse.json(
      {
        ok: false,
        type,
        periodKey,
        mode,
        status: "failed",
        error: generated.error,
        message: "Generation failed; previous published rotation is unaffected.",
        debug: generated.debug
          ? {
              periodKey,
              candidateCount: generated.debug.candidateCount,
              aiSelectedCount: generated.debug.aiSelectedCount,
              validatedCount: 0,
              fallbackUsed: generated.debug.fallbackUsed,
            }
          : undefined,
      },
      { status: 200 }
    );
  }

  // Validate before any publish/draft write.
  const validation =
    type === "hidden_gems"
      ? validateRotation(type, generated.data as HiddenGemsRotationData)
      : validateRotation(type, generated.data as WeeklyRotationData);

  if (!validation.ok) {
    if (mode !== "preview") {
      await saveFailedRotation(type, periodKey, validation.errors.join("; "));
    }
    console.warn("[discovery:generate] validation failed", { type, periodKey, mode, errors: validation.errors });
    return NextResponse.json(
      {
        ok: false,
        type,
        periodKey,
        mode,
        status: "failed",
        errors: validation.errors,
        message: "Validation failed; previous published rotation is unaffected.",
        debug: {
          periodKey,
          candidateCount: generated.debug.candidateCount,
          aiSelectedCount: generated.debug.aiSelectedCount,
          validatedCount: 0,
          fallbackUsed: generated.debug.fallbackUsed,
        },
      },
      { status: 200 }
    );
  }

  const validData = validation.data;

  // Admin/cron-only debug telemetry (never returned to public page reads).
  const debug = {
    periodKey,
    candidateCount: generated.debug.candidateCount,
    aiSelectedCount: generated.debug.aiSelectedCount,
    validatedCount: validData.picks.length + 1, // incl. featured
    fallbackUsed: generated.debug.fallbackUsed,
    generator: generated.sourceSummary.generator,
  };

  // Preview: return the curated+validated payload, no DB write.
  if (mode === "preview") {
    return NextResponse.json({
      ok: true,
      mode,
      type,
      periodKey,
      via,
      warnings: validation.warnings,
      sourceSummary: generated.sourceSummary,
      itemCount: validData.picks.length,
      featuredCount: 1,
      debug,
      data: validData,
    });
  }

  // Draft / publish: persist the validated payload.
  const saved = await saveRotation(type, periodKey, validData, generated.sourceSummary);
  if (!saved.ok) {
    console.error("[discovery:generate] save failed", { type, periodKey, error: saved.error });
    return NextResponse.json(
      { ok: false, type, periodKey, mode, error: saved.error ?? "save_failed" },
      { status: 500 }
    );
  }

  let status: "draft" | "published" = "draft";
  if (mode === "publish") {
    const published = await publishRotation(type, periodKey);
    if (!published.ok) {
      console.error("[discovery:generate] publish failed", { type, periodKey, error: published.error });
      return NextResponse.json(
        {
          ok: false,
          type,
          periodKey,
          mode,
          status: "draft",
          error: published.error ?? "publish_failed",
          message: "Saved as draft but failed to publish.",
        },
        { status: 500 }
      );
    }
    status = "published";
  }

  console.log("[discovery:generate] ok", { type, mode, status, via, ...debug });

  return NextResponse.json({
    ok: true,
    mode,
    type,
    periodKey,
    status,
    via,
    warnings: validation.warnings,
    itemCount: validData.picks.length,
    featuredCount: 1,
    debug,
    sourceSummary: generated.sourceSummary,
  });
}

// --- handlers --------------------------------------------------------------

function invalidTypeResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "Invalid 'type'. Use 'hidden_gems'/'hidden-gems' or 'games_of_the_week'/'games-of-the-week'.",
    },
    { status: 400 }
  );
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const auth = await authorize(req, url);
  if (!auth.ok) return auth.response;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const type = normalizeType(record.type ?? url.searchParams.get("type"));
  if (!type) return invalidTypeResponse();

  const mode = resolveMode(
    record.mode ?? url.searchParams.get("mode"),
    record.publish ?? url.searchParams.get("publish")
  );
  const periodOffsetWeeks = parseInteger(
    record.periodOffsetWeeks ?? url.searchParams.get("periodOffsetWeeks")
  );
  const force = parseBool(record.force ?? url.searchParams.get("force"));

  return runGeneration({ type, mode, periodOffsetWeeks, force, via: auth.via });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = await authorize(req, url);
  if (!auth.ok) return auth.response;

  const type = normalizeType(url.searchParams.get("type"));
  if (!type) return invalidTypeResponse();

  const mode = resolveMode(url.searchParams.get("mode"), url.searchParams.get("publish"));
  const periodOffsetWeeks = parseInteger(url.searchParams.get("periodOffsetWeeks"));
  const force = parseBool(url.searchParams.get("force"));

  return runGeneration({ type, mode, periodOffsetWeeks, force, via: auth.via });
}
