import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin =
      req.headers.get("origin") ?? new URL(req.url).origin ?? "";

    if (!origin) {
      return NextResponse.json(
        { error: "Could not determine request origin" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const priceId = getStripePriceId();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgrade=success`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      /** Copied onto the Subscription so lifecycle webhooks can resolve the Supabase user. */
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
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
