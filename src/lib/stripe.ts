import Stripe from "stripe";

export type StripeBillingInterval = "month" | "year";

/**
 * Stripe server client (secret key only — use from API routes / server actions).
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, {
    typescript: true,
  });
}

/** Subscription price ID from Stripe Dashboard (safe to expose). */
export function getStripePriceId(
  interval: StripeBillingInterval = "month"
): string {
  if (interval === "year") {
    const annual = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL;
    if (!annual) {
      throw new Error("NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL is not set");
    }
    return annual;
  }
  const id = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  if (!id) {
    throw new Error("NEXT_PUBLIC_STRIPE_PRICE_ID is not set");
  }
  return id;
}
