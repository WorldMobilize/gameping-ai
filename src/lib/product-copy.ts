/** Client-safe product/marketing copy (not server-only). */

export const EARLY_ACCESS_NOTICE =
  "GamePing AI is currently in early access. Recommendations and pricing coverage will improve over time.";

export const PREMIUM_UNLOCK_LINE =
  "Premium unlocks 25 saved runs, 50 tracked games, and 50 recommendations/day.";

export const FREE_PLAN_LIMIT_TITLE = "Free plan limit reached";

export type FreePlanLimitVariant =
  | "saved_runs"
  | "tracked_games"
  | "daily_recommendations";

export const FREE_LIMIT_BODY: Record<FreePlanLimitVariant, string> = {
  saved_runs:
    "You've used all 3 saved recommendation runs available on the free plan.",
  tracked_games:
    "You've reached the 5 tracked games available on the free plan.",
  daily_recommendations:
    "You've used all 5 daily recommendations available on the free plan.",
};
