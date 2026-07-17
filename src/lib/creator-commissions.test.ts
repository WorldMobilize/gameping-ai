import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  billingPeriod,
  buildCheckoutAttribution,
  buildLedgerInsert,
  buildMonthlyStatement,
  commissionCentsForInvoice,
  isSelfReferral,
  mapSubscriptionStatus,
  milestoneBonusCents,
  normalizeReferralCode,
  resolveCommissionPct,
  sumCommissionCents,
} from "@/lib/creator-commissions";

describe("normalizeReferralCode", () => {
  it("trims and uppercases", () => {
    assert.equal(normalizeReferralCode("  marco "), "MARCO");
    assert.equal(normalizeReferralCode("Gaia20"), "GAIA20");
  });
});

describe("isSelfReferral", () => {
  it("flags a creator using their own code, ignores others / null", () => {
    assert.equal(isSelfReferral("u1", "u1"), true);
    assert.equal(isSelfReferral("u1", "u2"), false);
    assert.equal(isSelfReferral("u1", null), false);
    assert.equal(isSelfReferral("u1", undefined), false);
  });
});

describe("commissionCentsForInvoice", () => {
  it("computes on the real collected amount (all 3 code types)", () => {
    // referral: full $7.99 → 20% → $1.60
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: 799, commissionPct: 20 }), 160);
    // discount code: Stripe collected $6.39 → 20% → $1.28
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: 639, commissionPct: 20 }), 128);
    // annual $79.99 → 20% → $16.00 that month
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: 7999, commissionPct: 20 }), 1600);
  });

  it("is zero during a trial (nothing collected)", () => {
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: 0, commissionPct: 20 }), 0);
  });

  it("clamps negative amounts and a 0% rate to 0", () => {
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: -500, commissionPct: 20 }), 0);
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: 799, commissionPct: 0 }), 0);
  });

  it("applies the higher tier rate", () => {
    // Legend 30% on $7.99 → $2.40 (799 * 0.3 = 239.7 → 240)
    assert.equal(commissionCentsForInvoice({ grossCollectedCents: 799, commissionPct: 30 }), 240);
  });
});

describe("resolveCommissionPct (tiers)", () => {
  it("moves Explorer → Pathfinder → Legend at the boundaries", () => {
    assert.equal(resolveCommissionPct(0), 20);
    assert.equal(resolveCommissionPct(49), 20);
    assert.equal(resolveCommissionPct(50), 25);
    assert.equal(resolveCommissionPct(199), 25);
    assert.equal(resolveCommissionPct(200), 30);
  });
});

describe("milestoneBonusCents", () => {
  it("pays a milestone once when crossed", () => {
    assert.equal(milestoneBonusCents({ previousActiveCount: 9, currentActiveCount: 10 }), 2500); // $25
    assert.equal(milestoneBonusCents({ previousActiveCount: 10, currentActiveCount: 10 }), 0);
  });

  it("sums multiple milestones crossed at once", () => {
    // 10 + 50 + 100 → $25 + $100 + $250 = $375
    assert.equal(milestoneBonusCents({ previousActiveCount: 0, currentActiveCount: 100 }), 37500);
    // only the 100 tier is newly crossed (50 already had it)
    assert.equal(milestoneBonusCents({ previousActiveCount: 50, currentActiveCount: 100 }), 25000);
  });

  it("never re-pays when the count dips and recovers (caller passes the peak)", () => {
    assert.equal(milestoneBonusCents({ previousActiveCount: 50, currentActiveCount: 40 }), 0);
  });
});

describe("sumCommissionCents", () => {
  it("adds ledger rows and ignores negatives / empties", () => {
    assert.equal(sumCommissionCents([{ commission_cents: 160 }, { commission_cents: 128 }]), 288);
    assert.equal(sumCommissionCents([{ commission_cents: -50 }, { commission_cents: 100 }]), 100);
    assert.equal(sumCommissionCents([]), 0);
  });
});

describe("buildMonthlyStatement", () => {
  it("combines accrued commission with a newly-unlocked milestone", () => {
    const s = buildMonthlyStatement({
      activeReferralCount: 10,
      priorActiveCount: 9,
      ledgerCommissionCents: 1600,
    });
    assert.equal(s.tier.name, "Explorer");
    assert.equal(s.commissionPct, 20);
    assert.equal(s.commissionCents, 1600);
    assert.equal(s.milestoneBonusCents, 2500); // crossing 10
    assert.equal(s.totalCents, 4100);
  });

  it("uses the higher tier once the creator scales, and its milestone", () => {
    const s = buildMonthlyStatement({
      activeReferralCount: 50,
      priorActiveCount: 49,
      ledgerCommissionCents: 0,
    });
    assert.equal(s.tier.name, "Pathfinder");
    assert.equal(s.commissionPct, 25);
    assert.equal(s.milestoneBonusCents, 10000); // crossing 50 → $100
    assert.equal(s.totalCents, 10000);
  });

  it("no milestone, steady month", () => {
    const s = buildMonthlyStatement({
      activeReferralCount: 12,
      priorActiveCount: 12,
      ledgerCommissionCents: 1920,
    });
    assert.equal(s.milestoneBonusCents, 0);
    assert.equal(s.totalCents, 1920);
  });
});

describe("mapSubscriptionStatus", () => {
  it("maps live states through, and dead/transitional states to canceled/incomplete", () => {
    assert.equal(mapSubscriptionStatus("active"), "active");
    assert.equal(mapSubscriptionStatus("trialing"), "trialing");
    assert.equal(mapSubscriptionStatus("past_due"), "past_due");
    assert.equal(mapSubscriptionStatus("incomplete"), "incomplete");
    assert.equal(mapSubscriptionStatus("canceled"), "canceled");
    assert.equal(mapSubscriptionStatus("unpaid"), "canceled");
    assert.equal(mapSubscriptionStatus("paused"), "canceled");
    assert.equal(mapSubscriptionStatus("something_new"), "incomplete");
  });
});

describe("billingPeriod", () => {
  it("returns UTC YYYY-MM", () => {
    assert.equal(billingPeriod(Math.floor(Date.UTC(2026, 6, 15, 12) / 1000)), "2026-07");
    assert.equal(billingPeriod(Math.floor(Date.UTC(2026, 0, 1) / 1000)), "2026-01");
    assert.equal(billingPeriod(Math.floor(Date.UTC(2025, 11, 31, 23) / 1000)), "2025-12");
  });
});

describe("buildCheckoutAttribution", () => {
  const code = (type: "referral" | "discount" | "trial") => ({
    creatorUserId: "creator1",
    code: "MARCO",
    type,
  });

  it("referral: metadata only, no discount/trial", () => {
    const a = buildCheckoutAttribution({ code: code("referral"), buyerUserId: "buyer1" });
    assert.deepEqual(a, {
      metadata: { creator_code: "MARCO", creator_user_id: "creator1", creator_code_type: "referral" },
    });
  });

  it("discount: attaches the shared coupon", () => {
    const a = buildCheckoutAttribution({
      code: code("discount"),
      buyerUserId: "buyer1",
      discountCouponId: "coupon_20",
    });
    assert.deepEqual(a.discounts, [{ coupon: "coupon_20" }]);
    assert.equal(a.trialPeriodDays, undefined);
  });

  it("discount without a coupon id throws (misconfig, not silent)", () => {
    assert.throws(() => buildCheckoutAttribution({ code: code("discount"), buyerUserId: "buyer1" }));
  });

  it("trial: sets 7 trial days", () => {
    const a = buildCheckoutAttribution({ code: code("trial"), buyerUserId: "buyer1" });
    assert.equal(a.trialPeriodDays, 7);
    assert.equal(a.discounts, undefined);
  });

  it("no code, or self-referral, yields empty attribution (checkout never blocked)", () => {
    assert.deepEqual(buildCheckoutAttribution({ code: null, buyerUserId: "buyer1" }), { metadata: {} });
    assert.deepEqual(
      buildCheckoutAttribution({ code: code("discount"), buyerUserId: "creator1", discountCouponId: "coupon_20" }),
      { metadata: {} }
    );
  });
});

describe("buildLedgerInsert", () => {
  const paidAt = Math.floor(Date.UTC(2026, 6, 10) / 1000);

  it("accrues a normal paid invoice at the current tier", () => {
    const row = buildLedgerInsert({
      creatorUserId: "c1",
      referralId: "r1",
      invoiceId: "in_1",
      amountPaidCents: 799,
      currency: "USD",
      activeReferralCount: 5, // Explorer 20%
      paidAtUnix: paidAt,
    });
    assert.deepEqual(row, {
      creator_user_id: "c1",
      referral_id: "r1",
      stripe_invoice_id: "in_1",
      period: "2026-07",
      gross_collected_cents: 799,
      currency: "usd",
      commission_pct: 20,
      commission_cents: 160,
    });
  });

  it("returns null for a $0 trial invoice (nothing to accrue)", () => {
    const row = buildLedgerInsert({
      creatorUserId: "c1",
      referralId: "r1",
      invoiceId: "in_trial",
      amountPaidCents: 0,
      currency: "usd",
      activeReferralCount: 5,
      paidAtUnix: paidAt,
    });
    assert.equal(row, null);
  });

  it("uses the higher tier rate on a discounted invoice", () => {
    const row = buildLedgerInsert({
      creatorUserId: "c1",
      referralId: "r1",
      invoiceId: "in_2",
      amountPaidCents: 639, // 20%-off price
      currency: "usd",
      activeReferralCount: 200, // Legend 30%
      paidAtUnix: paidAt,
    });
    assert.equal(row?.commission_pct, 30);
    assert.equal(row?.commission_cents, 192); // 639 * 0.30 = 191.7 → 192
  });
});
