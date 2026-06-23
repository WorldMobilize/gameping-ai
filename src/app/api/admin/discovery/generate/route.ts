/**
 * Admin/cron generator for cached discovery rotations.
 *
 *   POST /api/admin/discovery/generate   { "type": "hidden_gems" | "games_of_the_week", "publish": true }
 *   GET  /api/admin/discovery/generate?type=hidden_gems&publish=1   (Vercel cron / manual curl)
 *
 * Generates a rotation from the EXISTING RAWG integration, saves it as a draft,
 * and (optionally) publishes it. Reads/writes the discovery_rotations table via
 * the service role — never exposed to the client.
 *
 * Auth (either is accepted):
 *   - Admin session: logged-in user whose profiles.plan = 'admin'
 *   - Cron secret:   Authorization: Bearer <CRON_SECRET>  OR  ?secret=<CRON_SECRET>
 *     (same pattern as /api/cron — used by Vercel cron and manual testing)
 *
 * There is NO anonymous/public write path.
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRotationData } from "@/lib/discovery/generate-rotation";
import {
  currentPeriodKey,
  publishRotation,
  saveFailedRotation,
  saveRotation,
  type RotationType,
} from "@/lib/discovery/rotation-store";

export const dynamic = "force-dynamic";

const VALID_TYPES: RotationType[] = ["hidden_gems", "games_of_the_week"];

function isRotationType(value: unknown): value is RotationType {
  return typeof value === "string" && VALID_TYPES.includes(value as RotationType);
}

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
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
  publish: boolean;
  via: "cron" | "admin";
}): Promise<NextResponse> {
  const { type, publish, via } = params;
  const periodKey = currentPeriodKey(type);

  const generated = await generateRotationData(type);

  if (!generated.ok) {
    // Record the failure so admins can see why; the page keeps showing the last
    // published rotation (or static fallback) — generation never breaks reads.
    await saveFailedRotation(type, periodKey, generated.error);
    console.warn("[discovery:generate] failed", { type, periodKey, error: generated.error });
    return NextResponse.json(
      {
        ok: false,
        type,
        periodKey,
        status: "failed",
        error: generated.error,
        message: "Generation failed; previous published rotation is unaffected.",
      },
      { status: 200 }
    );
  }

  const saved = await saveRotation(
    type,
    periodKey,
    generated.data,
    generated.sourceSummary
  );
  if (!saved.ok) {
    console.error("[discovery:generate] save failed", { type, periodKey, error: saved.error });
    return NextResponse.json(
      { ok: false, type, periodKey, error: saved.error ?? "save_failed" },
      { status: 500 }
    );
  }

  let status: "draft" | "published" = "draft";
  if (publish) {
    const published = await publishRotation(type, periodKey);
    if (!published.ok) {
      console.error("[discovery:generate] publish failed", { type, periodKey, error: published.error });
      return NextResponse.json(
        {
          ok: false,
          type,
          periodKey,
          status: "draft",
          error: published.error ?? "publish_failed",
          message: "Saved as draft but failed to publish.",
        },
        { status: 500 }
      );
    }
    status = "published";
  }

  console.log("[discovery:generate] ok", { type, periodKey, status, via });

  return NextResponse.json({
    ok: true,
    type,
    periodKey,
    status,
    via,
    itemCount: generated.sourceSummary.itemCount,
    featuredCount: generated.sourceSummary.featuredCount,
    sourceSummary: generated.sourceSummary,
  });
}

// --- handlers --------------------------------------------------------------

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

  const type = record.type ?? url.searchParams.get("type");
  if (!isRotationType(type)) {
    return NextResponse.json(
      { error: "Invalid 'type'. Use 'hidden_gems' or 'games_of_the_week'." },
      { status: 400 }
    );
  }

  const publish = parseBool(record.publish ?? url.searchParams.get("publish"));
  return runGeneration({ type, publish, via: auth.via });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = await authorize(req, url);
  if (!auth.ok) return auth.response;

  const type = url.searchParams.get("type");
  if (!isRotationType(type)) {
    return NextResponse.json(
      { error: "Invalid 'type'. Use 'hidden_gems' or 'games_of_the_week'." },
      { status: 400 }
    );
  }

  const publish = parseBool(url.searchParams.get("publish"));
  return runGeneration({ type, publish, via: auth.via });
}
