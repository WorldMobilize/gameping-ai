/** Plan quota numbers (safe to import from client and server). */
export const PLAN_QUOTAS = {
  anonRecommendDaily: 10,
  freeRecommendDaily: 5,
  premiumRecommendDaily: 50,
  freeSavedSearches: 3,
  premiumSavedSearches: 25,
  freeTrackedGames: 5,
  premiumTrackedGames: 50,
} as const;
