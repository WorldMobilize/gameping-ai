import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function setPremiumFromSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId || typeof userId !== "string") {
    console.error("Stripe webhook: missing supabase_user_id in session metadata");
    return;
  }

  const supabase = getServiceRoleClient();

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ plan: "premium" })
    .eq("user_id", userId)
    .select("user_id");

  if (updateError) {
    console.error("Stripe webhook: profiles update failed", updateError);
    throw updateError;
  }

  if (updated && updated.length > 0) {
    return;
  }

  const email =
    typeof session.customer_email === "string" && session.customer_email
      ? session.customer_email
      : null;

  if (!email) {
    console.error(
      "Stripe webhook: no profile row and no customer_email on session",
      userId
    );
    return;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
    email,
    plan: "premium",
  });

  if (insertError) {
    console.error("Stripe webhook: profiles insert failed", insertError);
    throw insertError;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        await setPremiumFromSession(session);
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
