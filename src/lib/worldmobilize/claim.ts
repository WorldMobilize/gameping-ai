/**
 * WorldMobilize claim flow — Phase 1 placeholder, structured for Stripe.
 *
 * Stripe already powers subscriptions in this project. When region claims go
 * live, the swap is intentionally tiny:
 *   1. Replace REGION_PRICE_PLACEHOLDER with a real Stripe Price id (env var).
 *   2. Point startRegionClaim at a checkout endpoint (server-side session
 *      creation, same pattern as the existing subscription checkout) and
 *      redirect to the returned session URL.
 * Nothing else in the map UI needs to change — the CTA already renders from
 * this module's result shape.
 */

/** Placeholder Stripe Price id — replace with a real `price_…` id at launch. */
export const REGION_PRICE_PLACEHOLDER = "price_placeholder_region";

/** Display price shown on region panels until real pricing lands. */
export const REGION_PRICE_DISPLAY = "€6.99";

export type ClaimStartResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; reason: "checkout_not_live" };

/**
 * Begin a region claim. Phase 1: always reports that checkout isn't live —
 * the UI turns this into a friendly toast. Phase 2 replaces the body with a
 * POST to the checkout route; the signature is already what that needs.
 */
export function startRegionClaim(regionId: string): ClaimStartResult {
  void regionId; // consumed by the Phase 2 checkout request
  return { ok: false, reason: "checkout_not_live" };
}
