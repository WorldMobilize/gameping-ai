import { PLAN_QUOTAS } from "@/lib/plan-quotas";

/** Client-safe product/marketing copy (not server-only). */

export const EARLY_ACCESS_NOTICE =
  "GamePing AI is currently in early access. Recommendations and pricing coverage will improve over time.";

export const PREMIUM_UNLOCK_LINE =
  "Premium unlocks 25 saved runs, 50 tracked games, and 50 recommendations/day.";

export const LIMIT_TOAST_DURATION_MS = 9000;

export type LimitType =
  | "saved_runs"
  | "tracked_games"
  | "daily_recommendations";

export function isPremiumOrAdminPlan(plan: string | null | undefined): boolean {
  return plan === "premium" || plan === "admin";
}

export function normalizeLimitPlan(
  plan: string | null | undefined,
  options?: { anonymous?: boolean }
): string {
  if (options?.anonymous) return "anonymous";
  if (!plan || plan === "free") return "free";
  if (isPremiumOrAdminPlan(plan)) return "premium";
  return plan;
}

export function getLimitReachedDisplay(params: {
  limitType: LimitType;
  plan: string | null | undefined;
  /** When true, treat as anonymous (no account) for daily recommendations. */
  anonymous?: boolean;
}): {
  title: string;
  body: string;
  footer?: string;
  showUpgradeCta: boolean;
  showManageDashboard: boolean;
} {
  const planKey = normalizeLimitPlan(params.plan, {
    anonymous: params.anonymous,
  });
  const premium = planKey === "premium";
  const Q = PLAN_QUOTAS;

  if (premium) {
    const title = "Premium limit reached";
    let body: string;
    switch (params.limitType) {
      case "saved_runs":
        body = `You've used all ${Q.premiumSavedSearches} saved recommendation runs available on your Premium plan.`;
        break;
      case "tracked_games":
        body = `You've reached the ${Q.premiumTrackedGames} tracked games available on your Premium plan.`;
        break;
      case "daily_recommendations":
        body = `You've used all ${Q.premiumRecommendDaily} daily recommendations available on your Premium plan. Try again tomorrow.`;
        break;
    }
    return {
      title,
      body,
      showUpgradeCta: false,
      showManageDashboard: params.limitType !== "daily_recommendations",
    };
  }

  const title = "Free plan limit reached";
  let body: string;
  switch (params.limitType) {
    case "saved_runs":
      body = `You've used all ${Q.freeSavedSearches} saved recommendation runs available on the free plan.`;
      break;
    case "tracked_games":
      body = `You've reached the ${Q.freeTrackedGames} tracked games available on the free plan.`;
      break;
    case "daily_recommendations":
      if (planKey === "anonymous") {
        body = `You've used all ${Q.anonRecommendDaily} daily recommendations available without signing in. Create a free account for higher limits.`;
      } else {
        body = `You've used all ${Q.freeRecommendDaily} daily recommendations available on the free plan.`;
      }
      break;
  }

  return {
    title,
    body,
    footer: planKey === "anonymous" ? undefined : PREMIUM_UNLOCK_LINE,
    showUpgradeCta: true,
    showManageDashboard: false,
  };
}

/** Single-line toast message (body + optional footer). */
export function limitReachedToastMessage(params: {
  limitType: LimitType;
  plan: string | null | undefined;
  anonymous?: boolean;
}): { title: string; message: string } {
  const display = getLimitReachedDisplay(params);
  const message = display.footer
    ? `${display.body} ${display.footer}`
    : display.body;
  return { title: display.title, message };
}

/** API-facing limit error payload (no new endpoints). */
export function buildLimitErrorPayload(params: {
  error: string;
  limitType: LimitType;
  plan: string | null | undefined;
  limit: number;
  anonymous?: boolean;
}): {
  error: string;
  limitType: LimitType;
  plan: string;
  limit: number;
  message: string;
} {
  const plan = normalizeLimitPlan(params.plan, { anonymous: params.anonymous });
  const { body } = getLimitReachedDisplay({
    limitType: params.limitType,
    plan,
    anonymous: params.anonymous,
  });
  return {
    error: params.error,
    limitType: params.limitType,
    plan,
    limit: params.limit,
    message: body,
  };
}
