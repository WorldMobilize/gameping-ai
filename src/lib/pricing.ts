import { PLAN_QUOTAS } from "@/lib/plan-quotas";

/**
 * Single source of truth for GamePing pricing — used by the landing membership
 * section AND the /upgrade page so plan names and prices never drift apart.
 * Display strings only; Stripe checkout is driven by its own price IDs.
 */

export type BillingInterval = "month" | "year";

export const FREE_PRICE = "$0";

// Amounts are in USD. The `_EUR`-suffixed names are kept only to avoid touching
// the (unshipped) creator-program math that imports them; the numbers are USD.
export const PREMIUM_MONTHLY_PRICE_EUR = 7.99;
export const PREMIUM_YEARLY_PRICE_EUR = 79.99;

export const PREMIUM_MONTHLY_PRICE = "$7.99";
export const PREMIUM_YEARLY_PRICE = "$79.99";

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

/** The creator "discount" code = this % off the first payment (Stripe coupon). */
export const CREATOR_DISCOUNT_PCT = 20;

/** Premium price with the creator discount applied (first payment only). */
export function discountedPremiumPrice(interval: BillingInterval): string {
  const base =
    interval === "year" ? PREMIUM_YEARLY_PRICE_EUR : PREMIUM_MONTHLY_PRICE_EUR;
  const discounted =
    Math.round(base * (1 - CREATOR_DISCOUNT_PCT / 100) * 100) / 100;
  return `$${discounted.toFixed(2)}`;
}

/**
 * Marketing feature lists — the essential set spanning BOTH products (Companion
 * + GamePing). The landing shows a compact slice; the full comparison lives on
 * /upgrade. Order matters: the landing shows the first 3 (Free) / 4 (Premium).
 */
export const FREE_FEATURES: string[] = [
  "Desktop Companion overlay + text chat",
  `${PLAN_QUOTAS.freeRecommendDaily} recommendations per day`,
  `${PLAN_QUOTAS.freeSavedSearches} saved runs · ${PLAN_QUOTAS.freeTrackedGames} tracked games`,
  "Price-drop alerts",
  "Build your taste profile over time",
];

// Order matters: the landing shows the first 4, so those are balanced across BOTH
// products — two Companion, two Discovery — instead of one Companion line buried
// under discovery perks. The full six read on /upgrade.
export const PREMIUM_FEATURES: string[] = [
  "Unlimited Companion requests + voice chat",
  "Companion memory & resume sessions across games",
  `${PLAN_QUOTAS.premiumRecommendDaily} recommendations per day`,
  "Weekly Picks, Deals For You & Monthly Recap",
  "Steam Import & Taste DNA",
  `${PLAN_QUOTAS.premiumSavedSearches} saved runs · ${PLAN_QUOTAS.premiumTrackedGames} tracked games`,
];
