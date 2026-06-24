/**
 * Admin/cron generator for per-user premium personalization rotations.
 *
 *   POST /api/admin/premium/generate
 *     { "type": "weekly_picks" | "deals_for_you" | "monthly_recap",
 *       "userId": "<uuid>"   (optional — defaults to the calling admin's user id),
 *       "publish": true }
 *   GET  /api/admin/premium/generate?type=weekly_picks&userId=<uuid>&publish=1
 *
 * Builds the user's taste profile, generates a personalized rotation from the
 * EXISTING RAWG + pricing integrations (+ optional OpenAI), saves it as a draft,
 * and optionally publishes it. Reads/writes user_premium_rotations via the
 * service role. There is NO anonymous/public write path.
 *
 * Auth (either is accepted), mirroring /api/admin/discovery/generate:
 *   - Admin session: logged-in user whose profiles.plan = 'admin'
 *   - Cron secret:   Authorization: Bearer <CRON_SECRET>  OR  ?secret=<CRON_SECRET>
 *
 * Manual testing for admins: omit userId to generate for yourself.
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePremiumRotation } from "@/lib/discovery/premium-generators";
import {
  currentPremiumPeriodKey,
  isPremiumRotationType,
  publishUserRotation,
  saveFailedUserRotation,
  saveUserRotation,
  type PremiumRotationType,
} from "@/lib/discovery/user-rotation-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return false;
}

// --- cron secret check (mirrors /api/admin/discovery/generate) -------------

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

async function resolveAdminUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();
    return profile?.plan === "admin" ? user.id : null;
  } catch {
    return null;
  }
}

type Authorized =
  | { ok: true; via: "cron" | "admin"; adminUserId: string | null }
  | { ok: false; response: NextResponse };

async function authorize(req: Request, url: URL): Promise<Authorized> {
  if (hasValidCronSecret(req, url)) return { ok: true, via: "cron", adminUserId: null };
  const adminUserId = await resolveAdminUserId();
  if (adminUserId) return { ok: true, via: "admin", adminUserId };
  return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

// --- core ------------------------------------------------------------------

async function runGeneration(params: {
  type: PremiumRotationType;
  userId: string;
  publish: boolean;
  via: "cron" | "admin";
}): Promise<NextResponse> {
  const { type, userId, publish, via } = params;
  const periodKey = currentPremiumPeriodKey(type);

  const generated = await generatePremiumRotation(type, userId);

  if (!generated.ok) {
    await saveFailedUserRotation(userId, type, periodKey, generated.error);
    console.warn("[premium:generate] failed", { type, userId, periodKey, error: generated.error });
    return NextResponse.json(
      {
        ok: false,
        type,
        userId,
        periodKey,
        status: "failed",
        error: generated.error,
        message: "Generation failed; previous published rotation (if any) is unaffected.",
      },
      { status: 200 }
    );
  }

  const saved = await saveUserRotation(userId, type, periodKey, generated.data);
  if (!saved.ok) {
    console.error("[premium:generate] save failed", { type, userId, periodKey, error: saved.error });
    return NextResponse.json(
      { ok: false, type, userId, periodKey, error: saved.error ?? "save_failed" },
      { status: 500 }
    );
  }

  let status: "draft" | "published" = "draft";
  if (publish) {
    const published = await publishUserRotation(userId, type, periodKey);
    if (!published.ok) {
      console.error("[premium:generate] publish failed", { type, userId, periodKey, error: published.error });
      return NextResponse.json(
        {
          ok: false,
          type,
          userId,
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

  console.log("[premium:generate] ok", { type, userId, periodKey, status, via });

  return NextResponse.json({
    ok: true,
    type,
    userId,
    periodKey,
    status,
    via,
    itemCount: generated.data.sourceSummary.itemCount,
    aiUsed: generated.data.sourceSummary.aiUsed,
    sourceSummary: generated.data.sourceSummary,
  });
}

async function handle(req: Request, body: Record<string, unknown>): Promise<NextResponse> {
  const url = new URL(req.url);
  const auth = await authorize(req, url);
  if (!auth.ok) return auth.response;

  const type = body.type ?? url.searchParams.get("type");
  if (!isPremiumRotationType(type)) {
    return NextResponse.json(
      { error: "Invalid 'type'. Use 'weekly_picks', 'deals_for_you', or 'monthly_recap'." },
      { status: 400 }
    );
  }

  // userId: explicit param, else default to the calling admin (self-test).
  const requestedUserId =
    (typeof body.userId === "string" && body.userId.trim()) ||
    url.searchParams.get("userId")?.trim() ||
    auth.adminUserId;

  if (!requestedUserId) {
    return NextResponse.json(
      { error: "Missing 'userId' (required for cron; admins may omit to target themselves)." },
      { status: 400 }
    );
  }

  const publish = parseBool(body.publish ?? url.searchParams.get("publish"));
  return runGeneration({ type, userId: requestedUserId, publish, via: auth.via });
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  return handle(req, record);
}

export async function GET(req: Request) {
  return handle(req, {});
}
