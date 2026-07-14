import { PREMIUM_MONTHLY_PRICE_EUR } from "@/lib/pricing";

/**
 * GamePing Creator Referral Program — planned structure and math. Presentation
 * data only: no referral tracking, no payouts, no Stripe/coupons are wired up.
 */

export const CREATOR_BASE_COMMISSION_PCT = 20;

export type CreatorTier = {
  name: string;
  commissionPct: number;
  /** Active referred Premium users required. `max: null` = no ceiling. */
  min: number;
  max: number | null;
  blurb: string;
};

export const CREATOR_TIERS: CreatorTier[] = [
  { name: "Explorer", commissionPct: 20, min: 0, max: 49, blurb: "Where every creator starts. Earn recurring commission from the first member you bring." },
  { name: "Pathfinder", commissionPct: 25, min: 50, max: 199, blurb: "Your community is growing — so does your cut on every active Premium member." },
  { name: "Legend", commissionPct: 30, min: 200, max: null, blurb: "For creators building real discovery communities. The highest recurring rate we offer." },
];

export type CreatorMilestone = { users: number; bonusEur: number };

export const CREATOR_MILESTONES: CreatorMilestone[] = [
  { users: 10, bonusEur: 25 },
  { users: 50, bonusEur: 100 },
  { users: 100, bonusEur: 250 },
];

/** The tier a creator sits in for a given number of active Premium referrals. */
export function tierForActiveUsers(activeUsers: number): CreatorTier {
  return (
    CREATOR_TIERS.find(
      (t) => activeUsers >= t.min && (t.max === null || activeUsers <= t.max)
    ) ?? CREATOR_TIERS[0]
  );
}

/** Recurring monthly commission for a number of active Premium referrals. */
export function monthlyEarnings(activeUsers: number): {
  tier: CreatorTier;
  commissionPct: number;
  amountEur: number;
} {
  const tier = tierForActiveUsers(activeUsers);
  const amountEur = activeUsers * PREMIUM_MONTHLY_PRICE_EUR * (tier.commissionPct / 100);
  return { tier, commissionPct: tier.commissionPct, amountEur };
}

/** Total one-time milestone bonuses unlocked at or below a user count. */
export function milestoneBonusesUnlocked(activeUsers: number): number {
  return CREATOR_MILESTONES.filter((m) => activeUsers >= m.users).reduce(
    (sum, m) => sum + m.bonusEur,
    0
  );
}
