import "server-only";

import { PLAN_QUOTAS } from "@/lib/plan-quotas";

export { PLAN_QUOTAS as PLAN_LIMITS };

/** Daily cap for recommend; admin bypass is applied at call site (no RPC). */
export function getRecommendDailyLimit(params: {
  plan: string | null | undefined;
  userId: string | null;
}): number {
  const { plan, userId } = params;
  if (!userId) return PLAN_QUOTAS.anonRecommendDaily;
  if (plan === "premium" || plan === "admin") return PLAN_QUOTAS.premiumRecommendDaily;
  return PLAN_QUOTAS.freeRecommendDaily;
}

export function getTrackedGamesLimit(plan: string | null | undefined): number {
  if (plan === "premium" || plan === "admin") return PLAN_QUOTAS.premiumTrackedGames;
  return PLAN_QUOTAS.freeTrackedGames;
}

export function getSavedSearchesLimit(plan: string | null | undefined): number {
  if (plan === "premium" || plan === "admin") return PLAN_QUOTAS.premiumSavedSearches;
  return PLAN_QUOTAS.freeSavedSearches;
}
