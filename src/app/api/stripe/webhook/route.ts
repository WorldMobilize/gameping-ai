import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceRoleClient(): SupabaseClient {
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

/**
 * Map Stripe subscription.status → profiles.plan ("premium" | "free").
 *
 * Stripe statuses (subset): active, canceled, incomplete, incomplete_expired,
 * past_due, trialing, unpaid, paused.
 *
 * Policy (conservative — avoid ghost Premium when billing is unhealthy):
 * - active → premium (includes cancel_at_period_end: user paid through period)
 * - trialing → premium
 * - canceled → free (ended)
 * - past_due → free (payment retries exhausted or high risk; downgrade access)
 * - unpaid → free
 * - incomplete → free (never successfully started)
 * - incomplete_expired → free
 * - paused → free (treat as no active entitlement)
 */
function subscriptionStatusToPlan(
  status: Stripe.Subscription.Status
): "premium" | "free" {
  switch (status) {
    case "active":
    case "trialing":
      return "premium";
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
      return "free";
    default:
      return "free";
  }
}

function resolveSupabaseUserIdFromSubscription(
  sub: Stripe.Subscription
): string | null {
  const raw = sub.metadata?.supabase_user_id;
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return null;
}

async function setPremiumFromSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId || typeof userId !== "string") {
    console.error(
      "[stripe webhook] checkout.session.completed: missing supabase_user_id in session metadata"
    );
    return;
  }

  const supabase = getServiceRoleClient();

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ plan: "premium" })
    .eq("user_id", userId)
    .select("user_id");

  if (updateError) {
    console.error("[stripe webhook] profiles update failed", updateError);
    throw updateError;
  }

  if (updated && updated.length > 0) {
    console.log(
      "[stripe webhook] checkout.session.completed: plan set to premium (existing profile)"
    );
    return;
  }

  const email =
    typeof session.customer_email === "string" && session.customer_email
      ? session.customer_email
      : null;

  if (!email) {
    console.error(
      "[stripe webhook] checkout.session.completed: no profile row and no customer_email on session"
    );
    return;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
    email,
    plan: "premium",
  });

  if (insertError) {
    console.error("[stripe webhook] profiles insert failed", insertError);
    throw insertError;
  }

  console.log(
    "[stripe webhook] checkout.session.completed: plan set to premium (new profile row)"
  );
}

async function syncProfilePlanFromSubscription(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  eventType: string
): Promise<void> {
  const userId = resolveSupabaseUserIdFromSubscription(subscription);
  if (!userId) {
    console.warn(
      `[stripe webhook] ${eventType}: ignored — subscription missing metadata.supabase_user_id (older checkouts may lack subscription_data.metadata)`
    );
    return;
  }

  const { data: profile, error: selErr } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) {
    console.error("[stripe webhook] profiles select failed", selErr);
    return;
  }

  const previousPlan = profile?.plan ?? "free";
  if (previousPlan === "admin") {
    console.log(
      `[stripe webhook] ${eventType}: ignored — user has admin plan (not modified by Stripe)`
    );
    return;
  }

  const targetPlan = subscriptionStatusToPlan(subscription.status);
  const { data: updatedRows, error: updErr } = await supabase
    .from("profiles")
    .update({ plan: targetPlan })
    .eq("user_id", userId)
    .select("user_id");

  if (updErr) {
    console.error("[stripe webhook] profiles plan sync failed", updErr);
    return;
  }

  if (!updatedRows?.length) {
    console.warn(
      `[stripe webhook] ${eventType}: no profile row updated for metadata user (missing profile?)`
    );
    return;
  }

  console.log(
    `[stripe webhook] ${eventType}: plan transition ${previousPlan} → ${targetPlan} (stripe_status=${subscription.status})`
  );
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = resolveSupabaseUserIdFromSubscription(subscription);
  if (!userId) {
    console.warn(
      "[stripe webhook] customer.subscription.deleted: ignored — missing metadata.supabase_user_id"
    );
    return;
  }

  const { data: profile, error: selErr } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) {
    console.error("[stripe webhook] profiles select failed", selErr);
    return;
  }

  if (profile?.plan === "admin") {
    console.log(
      "[stripe webhook] customer.subscription.deleted: ignored — admin plan"
    );
    return;
  }

  const { data: updatedRows, error: updErr } = await supabase
    .from("profiles")
    .update({ plan: "free" })
    .eq("user_id", userId)
    .select("user_id");

  if (updErr) {
    console.error("[stripe webhook] profiles downgrade failed", updErr);
    return;
  }

  if (!updatedRows?.length) {
    console.warn(
      "[stripe webhook] customer.subscription.deleted: no profile row updated (missing profile?)"
    );
    return;
  }

  console.log(
    `[stripe webhook] customer.subscription.deleted: plan set to free (was ${profile?.plan ?? "unknown"})`
  );
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

  console.log(`[stripe webhook] received: ${event.type}`);

  try {
    const supabase = getServiceRoleClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await setPremiumFromSession(session);
        } else {
          console.log(
            "[stripe webhook] checkout.session.completed: ignored (not subscription mode)"
          );
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncProfilePlanFromSubscription(
          supabase,
          subscription,
          event.type
        );
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }
      default:
        console.log(`[stripe webhook] ignored event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
