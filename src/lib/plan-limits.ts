import "server-only";

/** Plan quotas for MVP launch (single source of truth). */
export const PLAN_LIMITS = {
  anonRecommendDaily: 10,
  freeRecommendDaily: 5,
  premiumRecommendDaily: 50,
  freeSavedSearches: 3,
  premiumSavedSearches: 25,
  freeTrackedGames: 5,
  premiumTrackedGames: 50,
} as const;

/** Daily cap for recommend; admin bypass is applied at call site (no RPC). */
export function getRecommendDailyLimit(params: {
  plan: string | null | undefined;
  userId: string | null;
}): number {
  const { plan, userId } = params;
  if (!userId) return PLAN_LIMITS.anonRecommendDaily;
  if (plan === "premium" || plan === "admin") return PLAN_LIMITS.premiumRecommendDaily;
  return PLAN_LIMITS.freeRecommendDaily;
}

export function getTrackedGamesLimit(plan: string | null | undefined): number {
  if (plan === "premium" || plan === "admin") return PLAN_LIMITS.premiumTrackedGames;
  return PLAN_LIMITS.freeTrackedGames;
}

export function getSavedSearchesLimit(plan: string | null | undefined): number {
  if (plan === "premium" || plan === "admin") return PLAN_LIMITS.premiumSavedSearches;
  return PLAN_LIMITS.freeSavedSearches;
}
