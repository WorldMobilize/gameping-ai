import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  buildCheckoutAttribution,
  buildLedgerInsert,
  mapSubscriptionStatus,
  normalizeReferralCode,
  type CheckoutAttribution,
  type ReferralCodeType,
} from "@/lib/creator-commissions";
import { generateCreatorCode } from "@/lib/creator-code-generate";

/**
 * Server-only glue between Stripe and the creator-referral tables. All reads and
 * writes use the service role (the tables are service-role only). The pure math
 * lives in creator-commissions.ts; this file just wires it to Stripe + Supabase.
 *
 * Everything is a no-op when CREATOR_PROGRAM_ENABLED !== "true", so the feature
 * ships dark and is flipped on only after the local test pass.
 */

/** Feature flag — the program is off (and invisible) unless explicitly enabled. */
export function isCreatorProgramEnabled(): boolean {
  return process.env.CREATOR_PROGRAM_ENABLED === "true";
}

function discountCouponId(): string | undefined {
  return process.env.STRIPE_DISCOUNT_COUPON_ID?.trim() || undefined;
}

function serviceClient(): SupabaseClient {
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

export type ResolvedCreatorCode = {
  creatorUserId: string;
  code: string;
  type: ReferralCodeType;
};

/** Look up an active creator code (case-insensitive). Null if disabled/missing. */
export async function resolveCreatorCode(
  rawCode: string | null | undefined
): Promise<ResolvedCreatorCode | null> {
  if (!isCreatorProgramEnabled()) return null;
  const code = rawCode ? normalizeReferralCode(rawCode) : "";
  if (!code) return null;

  const supabase = serviceClient();
  const { data } = await supabase
    .from("creator_codes")
    .select("creator_user_id, code, type")
    .eq("active", true)
    .ilike("code", code)
    .maybeSingle();

  if (!data) return null;
  return {
    creatorUserId: data.creator_user_id as string,
    code: data.code as string,
    type: data.type as ReferralCodeType,
  };
}

export type CreatorEarningsSummary = {
  creatorUserId: string;
  creatorEmail: string;
  code: string | null;
  activeReferrals: number;
  totalReferrals: number;
  thisMonthCents: number;
  allTimeCents: number;
};

export type CreatorReferralRow = {
  creatorEmail: string;
  referredEmail: string;
  code: string;
  codeType: string;
  status: string;
  startedAt: string | null;
};

/**
 * Admin earnings report: resolves the UUIDs to emails and aggregates per creator
 * (active referrals, this-month + all-time commission) plus a flat "who brought
 * whom" list. Read-only, service-role. `currentPeriod` is 'YYYY-MM'.
 */
export async function getCreatorEarningsReport(currentPeriod: string): Promise<{
  summary: CreatorEarningsSummary[];
  referrals: CreatorReferralRow[];
}> {
  const supabase = serviceClient();

  const [refRes, ledgerRes, codeRes] = await Promise.all([
    supabase
      .from("creator_referrals")
      .select("creator_user_id, referred_user_id, code, code_type, status, started_at, created_at"),
    supabase
      .from("creator_commission_ledger")
      .select("creator_user_id, period, commission_cents"),
    supabase.from("creator_codes").select("creator_user_id, code").eq("active", true),
  ]);

  const referrals = refRes.data ?? [];
  const ledger = ledgerRes.data ?? [];
  const activeCodes = codeRes.data ?? [];

  // Resolve every referenced user id to an email (fallback: the id itself).
  const ids = new Set<string>();
  for (const r of referrals) {
    if (r.creator_user_id) ids.add(r.creator_user_id as string);
    if (r.referred_user_id) ids.add(r.referred_user_id as string);
  }
  const emailById = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", Array.from(ids));
    for (const p of profiles ?? []) {
      emailById.set(p.user_id as string, (p.email as string) || (p.user_id as string));
    }
  }
  const emailOf = (id: string | null | undefined) =>
    id ? emailById.get(id) || id : "—";

  const codeByCreator = new Map<string, string>();
  for (const c of activeCodes) {
    codeByCreator.set(c.creator_user_id as string, c.code as string);
  }

  const monthByCreator = new Map<string, number>();
  const allByCreator = new Map<string, number>();
  for (const l of ledger) {
    const cid = l.creator_user_id as string;
    const cents = (l.commission_cents as number) ?? 0;
    allByCreator.set(cid, (allByCreator.get(cid) ?? 0) + cents);
    if (l.period === currentPeriod) {
      monthByCreator.set(cid, (monthByCreator.get(cid) ?? 0) + cents);
    }
  }

  const byCreator = new Map<string, { active: number; total: number }>();
  const flat: CreatorReferralRow[] = [];
  for (const r of referrals) {
    const cid = r.creator_user_id as string;
    const agg = byCreator.get(cid) ?? { active: 0, total: 0 };
    agg.total += 1;
    if (r.status === "active" || r.status === "trialing") agg.active += 1;
    byCreator.set(cid, agg);
    flat.push({
      creatorEmail: emailOf(cid),
      referredEmail: emailOf(r.referred_user_id as string | null),
      code: (r.code as string) ?? "",
      codeType: (r.code_type as string) ?? "",
      status: (r.status as string) ?? "",
      startedAt: (r.started_at as string) ?? (r.created_at as string) ?? null,
    });
  }

  const creatorIds = new Set<string>([
    ...byCreator.keys(),
    ...allByCreator.keys(),
    ...codeByCreator.keys(),
  ]);
  const summary: CreatorEarningsSummary[] = [];
  for (const cid of creatorIds) {
    const agg = byCreator.get(cid) ?? { active: 0, total: 0 };
    summary.push({
      creatorUserId: cid,
      creatorEmail: emailOf(cid),
      code: codeByCreator.get(cid) ?? null,
      activeReferrals: agg.active,
      totalReferrals: agg.total,
      thisMonthCents: monthByCreator.get(cid) ?? 0,
      allTimeCents: allByCreator.get(cid) ?? 0,
    });
  }
  summary.sort((a, b) => b.allTimeCents - a.allTimeCents);
  flat.sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));

  return { summary, referrals: flat };
}

/** The caller's current active code (for the creator dashboard). Null if none. */
export async function getActiveCreatorCode(
  creatorUserId: string
): Promise<{ code: string; type: ReferralCodeType } | null> {
  const supabase = serviceClient();
  const { data } = await supabase
    .from("creator_codes")
    .select("code, type")
    .eq("creator_user_id", creatorUserId)
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;
  return { code: data.code as string, type: data.type as ReferralCodeType };
}

/**
 * Create (or replace) the creator's single active code with a freshly-generated
 * one of the chosen type. Deactivates any previous active code first, then
 * retries on the rare code collision.
 */
export async function createOrReplaceCreatorCode(
  creatorUserId: string,
  type: ReferralCodeType
): Promise<string> {
  const supabase = serviceClient();

  // Reuse the creator's existing code (stable string): changing "type" only
  // changes what the code DOES, not the code itself — so links already shared
  // keep working, and we never pile up extra rows.
  const { data: existing } = await supabase
    .from("creator_codes")
    .select("id, code")
    .eq("creator_user_id", creatorUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Clear the active flag first (one-active-per-creator constraint), then
    // reactivate this row with the new type. Same code comes back out.
    await supabase
      .from("creator_codes")
      .update({ active: false })
      .eq("creator_user_id", creatorUserId)
      .eq("active", true);
    await supabase
      .from("creator_codes")
      .update({ type, active: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing.code as string;
  }

  // First time — generate a fresh code (retry on the rare collision).
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCreatorCode();
    const { error } = await supabase.from("creator_codes").insert({
      creator_user_id: creatorUserId,
      code,
      type,
      active: true,
    });
    if (!error) return code;
    // 23505 = unique_violation on lower(code) → try another code.
    if (error.code !== "23505") throw error;
  }
  throw new Error("could not generate a unique creator code");
}

/** Validate an entered code for the redeem field (returns its type, or null). */
export async function describeCreatorCode(
  rawCode: string
): Promise<{ type: ReferralCodeType } | null> {
  const code = await resolveCreatorCode(rawCode);
  return code ? { type: code.type } : null;
}

/**
 * Attribution to merge into a Checkout Session for an entered code. Safe to call
 * unconditionally: returns empty attribution when the program is off, the code
 * is unknown, or it's a self-referral — the buyer is never blocked.
 */
export async function resolveCheckoutAttribution(params: {
  rawCode: string | null | undefined;
  buyerUserId: string;
}): Promise<CheckoutAttribution> {
  const code = await resolveCreatorCode(params.rawCode);
  return buildCheckoutAttribution({
    code,
    buyerUserId: params.buyerUserId,
    discountCouponId: discountCouponId(),
  });
}

/**
 * Upsert the referral row from a subscription's metadata (idempotent on
 * stripe_subscription_id). No-op for subscriptions with no creator metadata.
 */
export async function recordReferralFromSubscription(
  sub: Stripe.Subscription
): Promise<void> {
  const md = sub.metadata ?? {};
  const creatorUserId = md.creator_user_id;
  const code = md.creator_code;
  const codeType = md.creator_code_type as ReferralCodeType | undefined;
  if (!creatorUserId || !code || !codeType) return;

  const referredUserId = md.supabase_user_id?.trim() || null;
  if (referredUserId && referredUserId === creatorUserId) return; // self-referral

  const status = mapSubscriptionStatus(sub.status);
  const supabase = serviceClient();
  const { error } = await supabase.from("creator_referrals").upsert(
    {
      creator_user_id: creatorUserId,
      code,
      code_type: codeType,
      referred_user_id: referredUserId,
      stripe_customer_id:
        typeof sub.customer === "string" ? sub.customer : null,
      stripe_subscription_id: sub.id,
      status,
      started_at: sub.start_date
        ? new Date(sub.start_date * 1000).toISOString()
        : null,
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) {
    console.error("[creator] referral upsert failed", error.code, error.message);
  } else {
    console.log("[creator] referral recorded", sub.id, "status", status);
  }
}

/**
 * The subscription id on an invoice, read defensively: Stripe moved it from
 * `invoice.subscription` (old) to `invoice.parent.subscription_details.subscription`
 * (2025+ API), so we probe both shapes rather than pin a version.
 */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: {
      subscription_details?: { subscription?: string | { id?: string } | null } | null;
    } | null;
  };
  const direct = inv.subscription;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object" && typeof direct.id === "string") {
    return direct.id;
  }
  const nested = inv.parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && typeof nested.id === "string") {
    return nested.id;
  }
  return null;
}

/**
 * Accrue commission for a paid invoice (idempotent on stripe_invoice_id). No-op
 * for $0 invoices (trials) or invoices whose subscription isn't a referral.
 */
export async function accrueCommissionFromInvoice(
  invoice: Stripe.Invoice,
  stripe: Stripe
): Promise<void> {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;
  const amountPaid = invoice.amount_paid ?? 0;
  if (amountPaid <= 0) return;

  const supabase = serviceClient();
  let { data: referral } = await supabase
    .from("creator_referrals")
    .select("id, creator_user_id")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();

  // Ordering safety: Stripe can deliver invoice.paid BEFORE the subscription
  // event that records the referral. If the row isn't there yet, fetch the live
  // subscription and record it now (idempotent), then re-read.
  if (!referral) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      await recordReferralFromSubscription(sub);
      const retry = await supabase
        .from("creator_referrals")
        .select("id, creator_user_id")
        .eq("stripe_subscription_id", subId)
        .maybeSingle();
      referral = retry.data;
    } catch (err) {
      console.error("[creator] accrue: subscription retrieve failed", err);
    }
  }
  if (!referral) return; // not a referred subscription

  const creatorUserId = referral.creator_user_id as string;

  // Commission % follows the creator's CURRENT tier (by active referral count).
  const { count: activeCount } = await supabase
    .from("creator_referrals")
    .select("*", { count: "exact", head: true })
    .eq("creator_user_id", creatorUserId)
    .in("status", ["active", "trialing"]);

  const paidAtUnix =
    (invoice as unknown as { status_transitions?: { paid_at?: number | null } })
      .status_transitions?.paid_at ?? invoice.created;
  const row = buildLedgerInsert({
    creatorUserId,
    referralId: referral.id as string,
    invoiceId: invoice.id,
    amountPaidCents: amountPaid,
    currency: invoice.currency ?? "usd",
    activeReferralCount: activeCount ?? 0,
    paidAtUnix,
  });
  if (!row) return;

  // unique(stripe_invoice_id) makes a replayed webhook a no-op.
  const { error } = await supabase
    .from("creator_commission_ledger")
    .upsert(row, { onConflict: "stripe_invoice_id", ignoreDuplicates: true });
  if (error) {
    console.error("[creator] ledger upsert failed", error.code, error.message);
  } else {
    console.log(
      "[creator] commission accrued",
      row.commission_cents,
      "cents · pct",
      row.commission_pct
    );
  }
}
