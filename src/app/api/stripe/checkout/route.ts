import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  getStripePriceId,
  type StripeBillingInterval,
} from "@/lib/stripe";
import { resolveCheckoutAttribution } from "@/lib/creator-referrals";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireVerifiedUser(supabase);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = profile?.plan ?? "free";
    if (plan === "premium" || plan === "admin") {
      return NextResponse.json(
        {
          error: "Already subscribed",
          message:
            plan === "admin"
              ? "Your account already has full access. No Premium checkout is needed."
              : "You already have Premium on this account. Open the dashboard or run a new recommendation instead of starting another subscription.",
        },
        { status: 409 }
      );
    }

    const origin =
      req.headers.get("origin") ?? new URL(req.url).origin ?? "";

    if (!origin) {
      return NextResponse.json(
        { error: "Could not determine request origin" },
        { status: 400 }
      );
    }

    let interval: StripeBillingInterval = "month";
    let referralCode: string | null = null;
    try {
      const raw = await req.text();
      if (raw.trim()) {
        const body = JSON.parse(raw) as { interval?: string; code?: string };
        if (body.interval === "year") interval = "year";
        if (typeof body.code === "string") referralCode = body.code;
      }
    } catch {
      /* invalid/empty body → monthly, no referral code */
    }

    const stripe = getStripe();
    const priceId = getStripePriceId(interval);

    // Creator-referral attribution — empty (no-op) unless the program is enabled
    // and a valid, non-self code was entered. Never blocks checkout.
    const attribution = await resolveCheckoutAttribution({
      rawCode: referralCode,
      buyerUserId: user.id,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgrade=success`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        ...attribution.metadata,
      },
      /** Copied onto the Subscription so lifecycle webhooks can resolve the Supabase user. */
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          ...attribution.metadata,
        },
        ...(attribution.trialPeriodDays
          ? { trial_period_days: attribution.trialPeriodDays }
          : {}),
      },
      ...(attribution.discounts ? { discounts: attribution.discounts } : {}),
      customer_email: user.email ?? undefined,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session missing redirect URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not start checkout" },
      { status: 500 }
    );
  }
}
