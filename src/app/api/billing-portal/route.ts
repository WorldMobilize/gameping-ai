import { NextResponse } from "next/server";
import { getSiteOrigin } from "@/lib/site-url";
import { getStripe } from "@/lib/stripe";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireVerifiedUser(supabase);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("plan, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr) {
      console.error("[billing-portal] profile lookup", profileErr);
      return NextResponse.json(
        { error: "Could not load your account." },
        { status: 500 }
      );
    }

    const plan = profile?.plan ?? "free";

    if (plan === "admin") {
      return NextResponse.json(
        {
          error: "billing_not_applicable",
          message: "Admin accounts are not billed through Stripe.",
        },
        { status: 403 }
      );
    }

    if (plan !== "premium") {
      return NextResponse.json(
        {
          error: "not_premium",
          message: "Upgrade to Premium before managing billing.",
        },
        { status: 403 }
      );
    }

    const customerId =
      typeof profile?.stripe_customer_id === "string"
        ? profile.stripe_customer_id.trim()
        : "";

    if (!customerId.startsWith("cus_")) {
      return NextResponse.json(
        {
          error: "no_stripe_customer",
          message:
            "We could not find a Stripe billing profile for this account. If you subscribed recently, try again in a few minutes or contact support@gamepingai.com.",
        },
        { status: 404 }
      );
    }

    const requestOrigin =
      req.headers.get("origin") ?? new URL(req.url).origin ?? null;
    const returnUrl = `${getSiteOrigin(requestOrigin)}/settings/account`;

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Portal session missing redirect URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing-portal]", err);
    return NextResponse.json(
      {
        error: "portal_failed",
        message: "Could not open the billing portal. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}
