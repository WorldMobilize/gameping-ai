/** Plan quota numbers (safe to import from client and server). */
export const PLAN_QUOTAS = {
  anonRecommendDaily: 3,
  freeRecommendDaily: 10,
  premiumRecommendDaily: 50,
  freeSavedSearches: 3,
  premiumSavedSearches: 25,
  freeTrackedGames: 5,
  premiumTrackedGames: 50,
} as const;
