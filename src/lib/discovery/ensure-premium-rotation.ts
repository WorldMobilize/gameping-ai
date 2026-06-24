import "server-only";

import { generatePremiumRotation } from "@/lib/discovery/premium-generators";
import {
  currentPremiumPeriodKey,
  getAnyUserRotation,
  publishUserRotation,
  resolveUserRotation,
  saveFailedUserRotation,
  saveUserRotation,
  type PremiumRotationMeta,
  type PremiumRotationType,
  type UserPremiumRotation,
} from "@/lib/discovery/user-rotation-store";

/**
 * Generation orchestrator for the premium pages
 *   /weekly-picks · /deals-for-you · /monthly-recap
 *
 * IMPORTANT: pages no longer call this during render — it can take many seconds
 * (RAWG + pricing + OpenAI) and would block the page. Pages read the cache
 * directly (fast) and, when there's no cached content yet, trigger generation
 * client-side via /api/premium/generate-mine, which calls this. It:
 *   1. returns the current-period published rotation when it already exists
 *      (the common case — NO regeneration),
 *   2. otherwise generates once, caches + publishes, and returns it,
 *   3. on failure / not-enough-data, falls back to the last successful cached
 *      rotation (shown as stale) or null.
 *
 * A short anti-storm cooldown stops a just-attempted generation from being
 * re-run by a double request, without masking newly-imported data (the old 6h
 * window made premium pages keep showing the empty state after a Steam import).
 *
 * Orchestration only — reuses the existing generators, store, and service-role
 * credentials. Never touches /api/recommend, billing, or auth.
 */

// Anti-storm window: don't re-run a generation we JUST attempted (dedupes double
// requests). Short on purpose so a fresh Steam import / saved search is picked up
// on the next trigger rather than masked for hours.
const AUTO_RETRY_COOLDOWN_MS = 60 * 1000; // 60s
// Manual "Refresh" min interval between successful regenerations.
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000; // 15m

// Generator errors that mean "this user simply doesn't have enough usable signal
// yet" (→ encourage Steam import / saved searches / tracking), as opposed to a
// transient failure.
const INSUFFICIENT_DATA_ERRORS = new Set([
  "insufficient_taste_signal",
  "insufficient_activity",
  "insufficient_credible_candidates",
  "not_enough_candidates",
  "no_matching_deals",
  "no_good_deals",
  "no_deal_candidates",
  "no_titles_to_price",
  "RAWG_API_KEY is not configured",
]);

/** True when a rotation has real content to display. */
export function rotationHasContent(rotation: UserPremiumRotation | null): boolean {
  if (!rotation) return false;
  return rotation.items.length > 0 || Boolean(rotation.featuredItem);
}

export type EnsureStatus =
  /** Fresh current-period rotation already existed. */
  | "fresh"
  /** Generated a new rotation on this visit. */
  | "generated"
  /** No fresh rotation, but a recent attempt is cooling down — used cache/empty. */
  | "cooldown"
  /** Served a previous (stale) cached rotation because current-period gen failed. */
  | "stale"
  /** User doesn't have enough signal to personalize yet → empty state. */
  | "insufficient_data"
  /** Generation failed transiently and there was nothing cached to fall back to. */
  | "failed";

export type EnsureResult = {
  rotation: UserPremiumRotation | null;
  meta: PremiumRotationMeta | null;
  status: EnsureStatus;
};

function withinCooldown(generatedAt: string | null, windowMs: number): boolean {
  if (!generatedAt) return false;
  const t = Date.parse(generatedAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < windowMs;
}

type GenerateOutcome = "generated" | "insufficient_data" | "failed";

/** Generate → save → publish for the current period. Records failures. */
async function generateAndPublish(
  userId: string,
  type: PremiumRotationType,
  periodKey: string
): Promise<GenerateOutcome> {
  const generated = await generatePremiumRotation(type, userId);
  if (!generated.ok) {
    await saveFailedUserRotation(userId, type, periodKey, generated.error);
    return INSUFFICIENT_DATA_ERRORS.has(generated.error) ? "insufficient_data" : "failed";
  }
  const saved = await saveUserRotation(userId, type, periodKey, generated.data);
  if (!saved.ok) {
    await saveFailedUserRotation(userId, type, periodKey, saved.error ?? "save_failed");
    return "failed";
  }
  const published = await publishUserRotation(userId, type, periodKey);
  if (!published.ok) return "failed";
  return "generated";
}

/**
 * Read-or-generate the user's rotation for this visit. Safe to call on every
 * page render: it only generates when there's no fresh content AND no recent
 * attempt to cool down.
 */
export async function ensureUserPremiumRotation(
  userId: string,
  type: PremiumRotationType
): Promise<EnsureResult> {
  // 1) Fresh current-period published rotation already cached → just use it.
  const resolved = await resolveUserRotation(userId, type);
  if (resolved.rotation && resolved.meta && !resolved.meta.stale) {
    return { rotation: resolved.rotation, meta: resolved.meta, status: "fresh" };
  }

  const periodKey = currentPremiumPeriodKey(type);

  // 2) Was there a recent attempt (failed or content-less) this period? If so,
  //    don't regenerate — fall back to the last good cached rotation or empty.
  const attempt = await getAnyUserRotation(userId, type, periodKey);
  if (attempt && withinCooldown(attempt.generatedAt, AUTO_RETRY_COOLDOWN_MS)) {
    return {
      rotation: resolved.rotation,
      meta: resolved.meta,
      status: resolved.rotation ? "stale" : "cooldown",
    };
  }

  // 3) Generate once for this period.
  const outcome = await generateAndPublish(userId, type, periodKey);
  if (outcome === "generated") {
    const after = await resolveUserRotation(userId, type);
    return { rotation: after.rotation, meta: after.meta, status: "generated" };
  }

  // 4) Generation failed / not enough data — serve the last good cache if any.
  return {
    rotation: resolved.rotation,
    meta: resolved.meta,
    status: outcome === "insufficient_data" ? "insufficient_data" : resolved.rotation ? "stale" : "failed",
  };
}

export type RefreshResult = {
  ok: boolean;
  status: EnsureStatus | "cooldown";
  /** Seconds until refresh is allowed again (cooldown only). */
  retryAfterSec?: number;
};

/**
 * Manual "Refresh" (admin-only) — force a regeneration for the current period,
 * guarded by a short cooldown.
 *
 * CRITICAL: never replace a good cached rotation with a failed/empty generation.
 * We generate FIRST and only overwrite the cache when the new generation
 * succeeds (the generators already validate quality: credible candidates,
 * franchise diversity, ≥ MIN_CREDIBLE_PICKS, real signal). On failure we leave
 * the existing published rotation untouched.
 */
export async function refreshUserPremiumRotation(
  userId: string,
  type: PremiumRotationType
): Promise<RefreshResult> {
  const periodKey = currentPremiumPeriodKey(type);
  const current = await getAnyUserRotation(userId, type, periodKey);
  if (current?.generatedAt) {
    const elapsed = Date.now() - Date.parse(current.generatedAt);
    if (Number.isFinite(elapsed) && elapsed < REFRESH_COOLDOWN_MS) {
      return {
        ok: false,
        status: "cooldown",
        retryAfterSec: Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  // Generate into memory first — do NOT touch the cache yet.
  const generated = await generatePremiumRotation(type, userId);
  if (!generated.ok) {
    // Preserve the existing published rotation. Only record a failure when there
    // was nothing good cached to keep (so we never overwrite good content).
    if (!rotationHasContent(current)) {
      await saveFailedUserRotation(userId, type, periodKey, generated.error);
    }
    return {
      ok: false,
      status: INSUFFICIENT_DATA_ERRORS.has(generated.error) ? "insufficient_data" : "failed",
    };
  }

  // Success → safe to replace the cache.
  const saved = await saveUserRotation(userId, type, periodKey, generated.data);
  if (!saved.ok) return { ok: false, status: "failed" };
  const published = await publishUserRotation(userId, type, periodKey);
  return { ok: published.ok, status: published.ok ? "generated" : "failed" };
}
