import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { enforceFreePlanActiveCaps } from "@/lib/plan-enforcement";
import { getStripe } from "@/lib/stripe";
import {
  accrueCommissionFromInvoice,
  recordReferralFromSubscription,
} from "@/lib/creator-referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record a creator referral without ever breaking plan sync: a referral-write
 * failure must not fail the webhook (Stripe would retry and could delay premium
 * activation). Logged and swallowed.
 */
async function safeRecordReferral(sub: Stripe.Subscription): Promise<void> {
  try {
    await recordReferralFromSubscription(sub);
  } catch (err) {
    console.error("[stripe webhook] record referral failed", err);
  }
}

function logSupabaseEnvPresence(): void {
  const hasUrl = Boolean(process.env.SUPABASE_URL?.trim());
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  if (!hasUrl || !hasKey) {
    console.error(
      "[stripe webhook] missing Supabase server env: " +
        `SUPABASE_URL=${hasUrl ? "set" : "MISSING"}, ` +
        `SUPABASE_SERVICE_ROLE_KEY=${hasKey ? "set" : "MISSING"}`
    );
  }
}

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
 * Used by customer.subscription.updated / deleted. checkout.session.completed
 * does not use this for granting premium (avoids relying on subscription metadata).
 *
 * customer.subscription.updated: transitional **incomplete** / **incomplete_expired**
 * are handled separately (skipped) so they do not overwrite premium right after checkout.
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

function resolveStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (typeof customer === "string" && customer.startsWith("cus_")) {
    return customer;
  }
  return null;
}

function buildProfileStripePatch(params: {
  plan: string;
  customerId: string | null;
}): Record<string, string> {
  const patch: Record<string, string> = { plan: params.plan };
  if (params.customerId) {
    patch.stripe_customer_id = params.customerId;
  }
  return patch;
}

/** Best-effort email from Checkout Session (webhook payload varies by flow). */
function sessionCheckoutEmail(session: Stripe.Checkout.Session): string | null {
  const direct = session.customer_email?.trim();
  if (direct) return direct;
  const details = session.customer_details;
  if (
    details &&
    typeof details.email === "string" &&
    details.email.trim().length > 0
  ) {
    return details.email.trim();
  }
  return null;
}

async function applyPremiumDowngradeEnforcement(
  supabase: SupabaseClient,
  userId: string,
  previousPlan: string | null | undefined
): Promise<void> {
  if (previousPlan !== "premium") return;

  try {
    const result = await enforceFreePlanActiveCaps(supabase, userId);
    console.log("[stripe webhook] downgrade active caps enforced", {
      userId,
      ...result,
    });
  } catch (err) {
    console.error("[stripe webhook] downgrade enforcement failed", userId, err);
  }
}

async function resolveSessionEmailWithStripeFallback(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<string | null> {
  const direct = sessionCheckoutEmail(session);
  if (direct) return direct;

  const customerId =
    typeof session.customer === "string" && session.customer.startsWith("cus_")
      ? session.customer
      : null;
  if (!customerId) return null;

  try {
    const cust = await stripe.customers.retrieve(customerId);
    if (cust.deleted) return null;
    const e =
      typeof cust.email === "string" && cust.email.trim().length > 0
        ? cust.email.trim()
        : null;
    return e;
  } catch {
    console.warn("[stripe webhook] customer retrieve failed for email fallback");
    return null;
  }
}

/**
 * checkout.session.completed (subscription): set profiles.plan = premium.
 * Uses session.metadata.supabase_user_id only (not subscription.metadata).
 */
async function setPremiumFromSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<void> {
  console.log("[stripe webhook] checkout.session.completed: handler entered");

  const userIdRaw = session.metadata?.supabase_user_id;
  console.log(
    "[stripe webhook] checkout metadata user id:",
    typeof userIdRaw === "string" && userIdRaw.length > 0
      ? "present"
      : "missing"
  );

  if (!userIdRaw || typeof userIdRaw !== "string" || !userIdRaw.trim()) {
    console.error(
      "[stripe webhook] checkout.session.completed: missing supabase_user_id in session.metadata"
    );
    throw new Error("checkout.session.completed: missing supabase_user_id");
  }

  const userId = userIdRaw.trim();

  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    console.warn(
      "[stripe webhook] checkout.session.completed: unexpected payment_status:",
      session.payment_status
    );
    throw new Error(
      `checkout.session.completed: expected payment_status paid or no_payment_required, got ${session.payment_status}`
    );
  }

  const supabase = getServiceRoleClient();
  const stripeCustomerId = resolveStripeCustomerId(session.customer);

  console.log("[stripe webhook] profile update attempted for user_id match");

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(
      buildProfileStripePatch({ plan: "premium", customerId: stripeCustomerId })
    )
    .eq("user_id", userId)
    .select("user_id");

  if (updateError) {
    console.error(
      "[stripe webhook] profile update result: error",
      updateError.code ?? "",
      updateError.message
    );
    throw updateError;
  }

  const updateCount = updated?.length ?? 0;
  console.log("[stripe webhook] profile update result count:", updateCount);

  if (updateCount > 0) {
    console.log(
      "[stripe webhook] checkout.session.completed: plan set to premium (row updated)"
    );
    return;
  }

  const { count: profileCount, error: countErr } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countErr) {
    console.error("[stripe webhook] profile diagnostic select failed", countErr);
  } else {
    console.log(
      "[stripe webhook] profile diagnostic: rows in public.profiles with this user_id:",
      profileCount ?? 0
    );
  }

  const email = await resolveSessionEmailWithStripeFallback(session, stripe);
  if (!email) {
    console.error(
      "[stripe webhook] checkout.session.completed: update matched 0 rows and no email on session/customer — cannot insert profile"
    );
    throw new Error(
      "checkout.session.completed: no profile row and no resolvable email for insert"
    );
  }

  console.log("[stripe webhook] profile insert attempted (no existing row)");

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
    email,
    plan: "premium",
    ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
  });

  if (insertError) {
    console.error(
      "[stripe webhook] profile insert result: error",
      insertError.code ?? "",
      insertError.message
    );
    throw insertError;
  }

  console.log(
    "[stripe webhook] checkout.session.completed: plan set to premium (inserted profile row)"
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
      `[stripe webhook] ${eventType}: ignored — subscription missing metadata.supabase_user_id`
    );
    return;
  }

  /**
   * Early subscription events often have status **incomplete** before payment succeeds.
   * Mapping that to **free** would overwrite **premium** set moments earlier by
   * checkout.session.completed. Skip until status is stable.
   */
  if (
    subscription.status === "incomplete" ||
    subscription.status === "incomplete_expired"
  ) {
    console.log(
      `[stripe webhook] ${eventType}: ignored transitional stripe_status=${subscription.status}`
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
  const stripeCustomerId = resolveStripeCustomerId(subscription.customer);
  const { data: updatedRows, error: updErr } = await supabase
    .from("profiles")
    .update(
      buildProfileStripePatch({ plan: targetPlan, customerId: stripeCustomerId })
    )
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

  if (targetPlan === "free") {
    await applyPremiumDowngradeEnforcement(supabase, userId, previousPlan);
  }
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

  await applyPremiumDowngradeEnforcement(supabase, userId, profile?.plan);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
    return NextResponse.json(
      isProd
        ? { error: "Invalid signature" }
        : {
            error: "Invalid signature",
            hint: "Ensure STRIPE_WEBHOOK_SECRET matches the signing secret for this endpoint (Stripe CLI or Dashboard webhook).",
          },
      { status: 400 }
    );
  }

  console.log("[stripe webhook] received event type:", event.type);

  logSupabaseEnvPresence();

  try {
    const supabase = getServiceRoleClient();
    const stripe = getStripe();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await setPremiumFromSession(session, stripe);
        } else {
          console.log(
            "[stripe webhook] checkout.session.completed: ignored (not subscription mode)"
          );
        }
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await safeRecordReferral(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncProfilePlanFromSubscription(
          supabase,
          subscription,
          event.type
        );
        await safeRecordReferral(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        await safeRecordReferral(subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        try {
          await accrueCommissionFromInvoice(invoice, stripe);
        } catch (err) {
          console.error("[stripe webhook] accrue commission failed", err);
        }
        break;
      }
      default:
        console.log("[stripe webhook] ignored event type:", event.type);
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
