import { PLAN_QUOTAS } from "@/lib/plan-quotas";

/** Client-safe product/marketing copy (not server-only). */

export const EARLY_ACCESS_NOTICE =
  "GamePing AI is currently in early access. Discovery, deal coverage, and the Companion will keep improving over time.";

export const PREMIUM_UNLOCK_LINE =
  "Premium unlocks saved runs, tracked games, Steam Library Sync, and your GamePing DNA—personalized Weekly Picks, Deals For You, and Monthly Recap.";

/** Premium subscription prices now live in the shared source of truth:
 *  see `@/lib/pricing` (PREMIUM_MONTHLY_PRICE / PREMIUM_YEARLY_PRICE). */

export const SIGNUP_REDIRECT_RECOMMEND = "/login?redirect=%2Frecommend";

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
  showSignupCta: boolean;
  signupHref: string;
  signupLabel: string;
  showManageDashboard: boolean;
} {
  const planKey = normalizeLimitPlan(params.plan, {
    anonymous: params.anonymous,
  });
  const premium = planKey === "premium";
  const Q = PLAN_QUOTAS;

  if (premium) {
    const title = "Come back tomorrow";
    let body: string;
    switch (params.limitType) {
      case "saved_runs":
        body = `You've used all ${Q.premiumSavedSearches} saved recommendation runs on Premium. Pause one on your dashboard to swap in another.`;
        break;
      case "tracked_games":
        body = `You've reached ${Q.premiumTrackedGames} tracked games on Premium. Pause one to track something new.`;
        break;
      case "daily_recommendations":
        body = `You've had a big discovery day—${Q.premiumRecommendDaily} recommendations is the daily cap on Premium. Your limit resets at midnight UTC.`;
        break;
    }
    return {
      title,
      body,
      showUpgradeCta: false,
      showSignupCta: false,
      signupHref: SIGNUP_REDIRECT_RECOMMEND,
      signupLabel: "Create free account",
      showManageDashboard: params.limitType !== "daily_recommendations",
    };
  }

  if (planKey === "anonymous" && params.limitType === "daily_recommendations") {
    return {
      title: "GamePing gets better once it learns your taste",
      body: "Create a free account to unlock more recommendations, save searches, track games, and build your personal discovery profile.",
      showUpgradeCta: false,
      showSignupCta: true,
      signupHref: SIGNUP_REDIRECT_RECOMMEND,
      signupLabel: "Create free account",
      showManageDashboard: false,
    };
  }

  const title =
    params.limitType === "daily_recommendations"
      ? "You've explored a lot today"
      : "Free plan limit reached";
  let body: string;
  switch (params.limitType) {
    case "saved_runs":
      body = `You've used all ${Q.freeSavedSearches} saved recommendation runs on the free plan. Upgrade for more room to keep taste profiles and deal alerts.`;
      break;
    case "tracked_games":
      body = `You've reached ${Q.freeTrackedGames} tracked games on the free plan. Upgrade to follow more deals on games you care about.`;
      break;
    case "daily_recommendations":
      body = `You've used today's ${Q.freeRecommendDaily} free recommendations. Come back tomorrow—or upgrade for your GamePing DNA, more saved runs, and more tracked games.`;
      break;
  }

  return {
    title,
    body,
    footer: PREMIUM_UNLOCK_LINE,
    showUpgradeCta: true,
    showSignupCta: false,
    signupHref: SIGNUP_REDIRECT_RECOMMEND,
    signupLabel: "Create free account",
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
/** Free legacy storage: active cap reached (pause one to swap). */
export function buildActiveCapLimitErrorPayload(params: {
  error: string;
  limitType: Exclude<LimitType, "daily_recommendations">;
  limit: number;
}): {
  error: string;
  limitType: LimitType;
  plan: string;
  limit: number;
  message: string;
} {
  const noun =
    params.limitType === "saved_runs"
      ? "saved recommendation runs"
      : "tracked games";
  return {
    error: params.error,
    limitType: params.limitType,
    plan: "free",
    limit: params.limit,
    message: `Free plan allows ${params.limit} active ${noun}. Pause one to activate another, or upgrade to Premium.`,
  };
}

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
