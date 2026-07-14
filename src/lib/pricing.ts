import { PLAN_QUOTAS } from "@/lib/plan-quotas";

/**
 * Single source of truth for GamePing pricing — used by the landing membership
 * section AND the /upgrade page so plan names and prices never drift apart.
 * Display strings only; Stripe checkout is driven by its own price IDs.
 */

export type BillingInterval = "month" | "year";

export const FREE_PRICE = "€0";

export const PREMIUM_MONTHLY_PRICE_EUR = 7.99;
export const PREMIUM_YEARLY_PRICE_EUR = 69.99;

export const PREMIUM_MONTHLY_PRICE = "€7.99";
export const PREMIUM_YEARLY_PRICE = "€69.99";

/** Rounded % saved on yearly vs 12× monthly (for the "save" badge). */
export const PREMIUM_YEARLY_SAVINGS_PCT = Math.round(
  (1 - PREMIUM_YEARLY_PRICE_EUR / (PREMIUM_MONTHLY_PRICE_EUR * 12)) * 100
);

export function premiumPrice(interval: BillingInterval): string {
  return interval === "year" ? PREMIUM_YEARLY_PRICE : PREMIUM_MONTHLY_PRICE;
}

export function premiumPeriod(interval: BillingInterval): string {
  return interval === "year" ? "/year" : "/month";
}

/**
 * Marketing feature lists — the essential set spanning BOTH products (Companion
 * + GamePing). The landing shows a compact slice; the full comparison lives on
 * /upgrade. Order matters: the landing shows the first 3 (Free) / 4 (Premium).
 */
export const FREE_FEATURES: string[] = [
  "Desktop Companion overlay + text chat",
  `${PLAN_QUOTAS.freeRecommendDaily} AI searches per day`,
  `${PLAN_QUOTAS.freeSavedSearches} saved searches · ${PLAN_QUOTAS.freeTrackedGames} tracked games`,
  "Price-drop alerts",
  "Build your taste profile over time",
];

export const PREMIUM_FEATURES: string[] = [
  "Unlimited Companion requests + voice chat",
  `${PLAN_QUOTAS.premiumRecommendDaily} AI searches per day`,
  `${PLAN_QUOTAS.premiumSavedSearches} saved · ${PLAN_QUOTAS.premiumTrackedGames} tracked games`,
  "Steam import, taste memory & smart alerts",
  "Weekly Picks, Deals For You & Monthly Recap",
  "Companion memory & resume sessions",
];
