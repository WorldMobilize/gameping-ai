import {
  CREATOR_MILESTONES,
  tierForActiveUsers,
  type CreatorTier,
} from "@/lib/creator-program";

/**
 * Pure commission math for the creator referral program. No Stripe, no DB — so
 * every "weird case" (discount, trial, cancel, annual, tier/milestone crossings)
 * is unit-testable in isolation before any of it touches checkout or webhooks.
 *
 * Money is integer CENTS, USD. Commission basis is always what Stripe ACTUALLY
 * collected on an invoice (post-discount, $0 during a trial) — never a flat list
 * price — so the three code types resolve without special-casing.
 */

export type ReferralCodeType = "referral" | "discount" | "trial";

/** Normalize a user-entered code for storage + lookup (case-insensitive). */
export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** A creator must never earn commission on their own subscription. */
export function isSelfReferral(
  creatorUserId: string,
  referredUserId: string | null | undefined
): boolean {
  return Boolean(referredUserId) && creatorUserId === referredUserId;
}

/**
 * Commission for a single paid invoice, in integer cents, from the amount Stripe
 * actually collected. Negatives and a 0% rate clamp to 0 (a $0 trial invoice
 * yields $0 commission for free).
 */
export function commissionCentsForInvoice(params: {
  grossCollectedCents: number;
  commissionPct: number;
}): number {
  const gross = Math.max(0, Math.round(params.grossCollectedCents));
  const pct = Math.max(0, params.commissionPct);
  return Math.round((gross * pct) / 100);
}

/** The commission % a creator earns at their current active-referral count. */
export function resolveCommissionPct(activeReferralCount: number): number {
  return tierForActiveUsers(Math.max(0, activeReferralCount)).commissionPct;
}

/**
 * One-time milestone bonuses newly crossed this period, in cents. Pass the
 * HIGHEST active-referral count previously credited as `previousActiveCount`
 * (not merely last month's) so a creator who dips and recovers is never paid the
 * same milestone twice. Milestone figures are USD dollars → converted to cents.
 */
export function milestoneBonusCents(params: {
  previousActiveCount: number;
  currentActiveCount: number;
}): number {
  const prev = Math.max(0, params.previousActiveCount);
  const curr = Math.max(0, params.currentActiveCount);
  if (curr <= prev) return 0;
  return CREATOR_MILESTONES.filter((m) => m.users > prev && m.users <= curr).reduce(
    (sum, m) => sum + m.bonusEur * 100,
    0
  );
}

/** Sum accrued ledger commission (cents), ignoring any stray negatives. */
export function sumCommissionCents(
  rows: ReadonlyArray<{ commission_cents: number }>
): number {
  return rows.reduce(
    (sum, r) => sum + Math.max(0, Math.round(r.commission_cents)),
    0
  );
}

export type CreatorMonthlyStatement = {
  tier: CreatorTier;
  commissionPct: number;
  commissionCents: number;
  milestoneBonusCents: number;
  totalCents: number;
};

/**
 * Amount owed to a creator for a period: the already-accrued ledger commission
 * plus any milestone bonus newly unlocked this period. Pure — the caller sums
 * the ledger and supplies the active-referral counts. `commissionPct`/`tier`
 * reflect the end-of-period standing (for display); `commissionCents` is the
 * real accrued total, since per-invoice rates were locked at accrual time.
 */
export function buildMonthlyStatement(params: {
  activeReferralCount: number;
  priorActiveCount: number;
  ledgerCommissionCents: number;
}): CreatorMonthlyStatement {
  const tier = tierForActiveUsers(Math.max(0, params.activeReferralCount));
  const commissionCents = Math.max(0, Math.round(params.ledgerCommissionCents));
  const milestoneCents = milestoneBonusCents({
    previousActiveCount: params.priorActiveCount,
    currentActiveCount: params.activeReferralCount,
  });
  return {
    tier,
    commissionPct: tier.commissionPct,
    commissionCents,
    milestoneBonusCents: milestoneCents,
    totalCents: commissionCents + milestoneCents,
  };
}

// ── Checkout + webhook helpers (pure) ────────────────────────────────────────

export const CREATOR_TRIAL_DAYS = 7;

export type ReferralStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

/** Map a Stripe subscription status to our narrower referral status. */
export function mapSubscriptionStatus(stripeStatus: string): ReferralStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "incomplete":
      return "incomplete";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}

/** UTC 'YYYY-MM' for a unix-seconds timestamp (an invoice's billing month). */
export function billingPeriod(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}`;
}

export type CheckoutAttribution = {
  metadata: Record<string, string>;
  discounts?: { coupon: string }[];
  trialPeriodDays?: number;
};

/**
 * What to merge into a Stripe Checkout Session for a resolved creator code.
 * Never blocks checkout: no code, or a self-referral, yields empty attribution
 * (the buyer proceeds with no discount/trial and no commission tracking).
 */
export function buildCheckoutAttribution(params: {
  code: { creatorUserId: string; code: string; type: ReferralCodeType } | null;
  buyerUserId: string;
  discountCouponId?: string;
}): CheckoutAttribution {
  const { code, buyerUserId, discountCouponId } = params;
  if (!code || isSelfReferral(code.creatorUserId, buyerUserId)) {
    return { metadata: {} };
  }
  const attribution: CheckoutAttribution = {
    metadata: {
      creator_code: code.code,
      creator_user_id: code.creatorUserId,
      creator_code_type: code.type,
    },
  };
  if (code.type === "discount") {
    if (!discountCouponId) {
      throw new Error("discountCouponId required for a discount code");
    }
    attribution.discounts = [{ coupon: discountCouponId }];
  }
  if (code.type === "trial") {
    attribution.trialPeriodDays = CREATOR_TRIAL_DAYS;
  }
  return attribution;
}

export type CommissionLedgerInsert = {
  creator_user_id: string;
  referral_id: string | null;
  stripe_invoice_id: string;
  period: string;
  gross_collected_cents: number;
  currency: string;
  commission_pct: number;
  commission_cents: number;
};

/**
 * Build the ledger row for a paid invoice, or null when there's nothing to
 * accrue (a $0 trial invoice), so the caller writes nothing.
 */
export function buildLedgerInsert(params: {
  creatorUserId: string;
  referralId: string | null;
  invoiceId: string;
  amountPaidCents: number;
  currency: string;
  activeReferralCount: number;
  paidAtUnix: number;
}): CommissionLedgerInsert | null {
  const gross = Math.max(0, Math.round(params.amountPaidCents));
  if (gross === 0) return null;
  const commissionPct = resolveCommissionPct(params.activeReferralCount);
  return {
    creator_user_id: params.creatorUserId,
    referral_id: params.referralId,
    stripe_invoice_id: params.invoiceId,
    period: billingPeriod(params.paidAtUnix),
    gross_collected_cents: gross,
    currency: params.currency.toLowerCase(),
    commission_pct: commissionPct,
    commission_cents: commissionCentsForInvoice({
      grossCollectedCents: gross,
      commissionPct,
    }),
  };
}
