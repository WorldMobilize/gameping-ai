/**
 * GamePing Companion — account endpoint (public beta).
 *
 *   OPTIONS /api/companion/me   → CORS preflight (204)
 *   GET     /api/companion/me
 *     Auth:    Authorization: Bearer <supabase_access_token>  (NO cookies)
 *     Success: {
 *       user_id, email, display_name?, plan, is_premium,
 *       features: { companion_ask, video_mode, image_mode, music_mode },
 *       limits:   { asks_per_day, recommend_per_day, saved_runs, tracked_games },
 *       usage:    { recommend_today, saved_runs, tracked_games },   // number | null
 *       entitlements: {
 *         price_alerts, weekly_picks, deals_for_you, monthly_recap,
 *         steam_import, taste_dna_ready
 *       }
 *     }
 *     Errors:  { "error": string }  (401 / 500)
 *
 * Reads the caller's plan from `profiles` under their own RLS context. Premium
 * means `profiles.plan === "premium" | "admin"`. `limits` are static plan caps;
 * `usage` are live counts (a field is `null` when its read failed — the desktop
 * should treat null as "unknown", never as zero). `recommend_today` needs the
 * service role (its counter table is RLS-hardened); the tracked/saved counts and
 * taste-DNA flag read under the caller's own RLS. Additive to the previous shape
 * (existing fields unchanged). Stateless read; no writes.
 */
import { authenticateCompanion, companionCorsHeaders, companionCorsJson } from "@/lib/companion/http";
import { hasPremiumDiscoveryAccess } from "@/lib/discovery/premium-access";
import { countUserResourceRows, isPremiumPlan } from "@/lib/plan-enforcement";
import {
  getRecommendDailyLimit,
  getSavedSearchesLimit,
  getTrackedGamesLimit,
} from "@/lib/plan-limits";
import { getRecommendDailyUsed } from "@/lib/recommend-usage";
import { canUseSteamImport } from "@/lib/steam-library/access-flags";
import { getTasteDnaForUser } from "@/lib/steam-library/get-taste-dna";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: companionCorsHeaders(req.headers.get("origin"), METHODS),
  });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");

  const auth = await authenticateCompanion(req);
  if (!auth.ok) {
    return companionCorsJson(origin, { error: auth.error }, auth.status, METHODS);
  }
  const { user, supabase } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const rawPlan = profile?.plan;
  const plan =
    rawPlan === "premium" || rawPlan === "admin" ? rawPlan : "free";
  const isPremium = isPremiumPlan(plan);

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    (meta?.display_name ?? meta?.full_name ?? meta?.name ?? null) as
      | string
      | null;

  // Live signals for the desktop dashboard. Each is best-effort: a failed read
  // resolves to null/false so a broken count never takes down the whole /me
  // response (the desktop shows "unknown" rather than a wrong zero).
  const [trackedCount, savedCount, recommendUsed, tasteReady] = await Promise.all([
    countUserResourceRows(supabase, user.id, "tracked_games").catch(() => null),
    countUserResourceRows(supabase, user.id, "search_profiles").catch(() => null),
    getRecommendDailyUsed(user.id).catch(() => null),
    getTasteDnaForUser({ supabase, userId: user.id })
      .then((dna) => dna != null)
      .catch(() => false),
  ]);

  return companionCorsJson(
    origin,
    {
      user_id: user.id,
      email: user.email ?? null,
      display_name: displayName || null,
      plan,
      is_premium: isPremium,
      features: {
        companion_ask: true,
        video_mode: true,
        image_mode: true,
        music_mode: true,
      },
      limits: {
        // asks_per_day stays informational for the beta (not enforced server-side);
        // the rest are the real plan caps enforced elsewhere in the app.
        asks_per_day: isPremium ? 500 : 50,
        recommend_per_day: getRecommendDailyLimit({ plan, userId: user.id }),
        saved_runs: getSavedSearchesLimit(plan),
        tracked_games: getTrackedGamesLimit(plan),
      },
      usage: {
        recommend_today: recommendUsed,
        saved_runs: savedCount,
        tracked_games: trackedCount,
      },
      entitlements: {
        price_alerts: isPremium,
        weekly_picks: hasPremiumDiscoveryAccess(plan),
        deals_for_you: hasPremiumDiscoveryAccess(plan),
        monthly_recap: hasPremiumDiscoveryAccess(plan),
        steam_import: canUseSteamImport(plan),
        taste_dna_ready: tasteReady,
      },
    },
    200,
    METHODS
  );
}
