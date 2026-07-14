import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  CREATOR_MILESTONES,
  CREATOR_TIERS,
  milestoneBonusesUnlocked,
  monthlyEarnings,
} from "@/lib/creator-program";
import { PREMIUM_MONTHLY_PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Creator Referral Program — GamePing",
  description:
    "Share GamePing with your community and earn recurring commission while your members stay Premium. Higher tiers and milestone bonuses as your community grows.",
};

const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-300";
const MUTED = "text-slate-500 dark:text-slate-400";
const CARD = "rounded-3xl border border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]";
const EYEBROW = "text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 dark:text-blue-400";
const CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-blue-800 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

const euro = (n: number) => `€${Math.round(n)}`;
const euroFull = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const tierRange = (min: number, max: number | null) => (max === null ? `${min}+` : `${min}–${max}`);

/* ── Example numbers (kept in sync with the shared config) ── */
const EXAMPLE_USERS = 100;
const example = monthlyEarnings(EXAMPLE_USERS);
const exampleBonuses = milestoneBonusesUnlocked(EXAMPLE_USERS);
const EXAMPLE_MONTHLY = Math.round(example.amountEur); // ≈ 200
const EXAMPLE_YEARLY = EXAMPLE_MONTHLY * 12; // ≈ 2,400
const EXAMPLE_FIRST_YEAR = EXAMPLE_YEARLY + exampleBonuses; // ≈ 2,775

/** Small scenario chips across the tiers. */
const SCENARIOS = [25, 100, 250].map((n) => {
  const e = monthlyEarnings(n);
  return { users: n, tier: e.tier.name, monthly: Math.round(e.amountEur) };
});

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "What counts as an active Premium member?",
    a: "Someone who signed up through your referral and currently holds a paid GamePing Premium subscription. If a member cancels, they stop counting toward your active total and your recurring commission for them ends.",
  },
  {
    q: "Is the commission recurring?",
    a: "Yes. You earn your tier's percentage every month (or year) that a referred member stays on Premium — not just once at signup. Keep your community subscribed and the income keeps coming.",
  },
  {
    q: "When does my tier upgrade?",
    a: "Your tier is based on how many referred members are active Premium subscribers right now. As that number crosses 50 and then 200, your commission rate steps up to the next tier automatically.",
  },
  {
    q: "Are payouts implemented yet?",
    a: "Payout infrastructure will come later; this page defines the planned creator program. There's nothing to track or withdraw yet — join the waitlist and we'll reach out as we roll it out.",
  },
];

export default function CreatorProgramPage() {
  return (
    <AppPageShell className="overflow-x-hidden">
      {/* Hero */}
      <AppSection maxWidth="max-w-5xl" className="pt-12">
        <div className="max-w-2xl">
          <p className={EYEBROW}>Creator Referral Program</p>
          <h1 className={`gp-home-display mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl ${HEADING}`}>
            Earn with the game discovery community you build
          </h1>
          <p className={`mt-5 text-lg leading-relaxed ${BODY}`}>
            Share GamePing with your audience and earn a recurring cut of every member who goes Premium —
            paid every month they stay subscribed, not just once. The bigger your community grows, the
            higher your rate.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <Link href="/contact" className={CTA}>Apply / join waitlist</Link>
            <span className={`text-xs ${MUTED}`}>Applications open soon — join the waitlist to be first in line.</span>
          </div>
        </div>
      </AppSection>

      {/* Tiers */}
      <AppSection maxWidth="max-w-5xl" className="!py-10">
        <h2 className={`gp-home-display text-2xl font-semibold tracking-tight sm:text-3xl ${HEADING}`}>Commission tiers</h2>
        <p className={`mt-2 text-sm ${BODY}`}>Your rate is based on how many referred members are active Premium subscribers.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CREATOR_TIERS.map((tier, i) => {
            const top = i === CREATOR_TIERS.length - 1;
            return (
              <div
                key={tier.name}
                className={`relative flex flex-col p-7 ${CARD} ${top ? "ring-1 ring-blue-400/40 dark:ring-blue-400/30" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-[13px] font-semibold uppercase tracking-[0.16em] ${top ? "text-blue-700 dark:text-blue-300" : BODY}`}>{tier.name}</p>
                  {top ? <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">Top rate</span> : null}
                </div>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className={`text-4xl font-bold tracking-tight ${HEADING}`}>{tier.commissionPct}%</span>
                  <span className={`text-sm ${BODY}`}>recurring</span>
                </div>
                <p className={`mt-2 text-sm font-medium ${HEADING}`}>{tierRange(tier.min, tier.max)} active Premium users</p>
                <p className={`mt-3 text-sm leading-relaxed ${BODY}`}>{tier.blurb}</p>
              </div>
            );
          })}
        </div>
      </AppSection>

      {/* Milestone bonuses */}
      <AppSection maxWidth="max-w-5xl" className="!py-10">
        <h2 className={`gp-home-display text-2xl font-semibold tracking-tight sm:text-3xl ${HEADING}`}>Milestone bonuses</h2>
        <p className={`mt-2 text-sm ${BODY}`}>One-time bonuses on top of your recurring commission, unlocked as your active Premium community grows.</p>
        <div className={`mt-8 p-7 md:p-9 ${CARD}`}>
          <div className="relative flex items-start justify-between gap-4">
            {/* connecting track */}
            <div aria-hidden className="absolute left-6 right-6 top-6 h-px bg-slate-200 dark:bg-white/10" />
            {CREATOR_MILESTONES.map((m) => (
              <div key={m.users} className="relative z-10 flex flex-1 flex-col items-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.8)]">{m.users}</span>
                <p className={`mt-3 text-lg font-bold ${HEADING}`}>{euro(m.bonusEur)}</p>
                <p className={`text-xs ${MUTED}`}>at {m.users} active Premium users</p>
              </div>
            ))}
          </div>
        </div>
      </AppSection>

      {/* Earnings */}
      <AppSection maxWidth="max-w-5xl" className="!py-10">
        <h2 className={`gp-home-display text-2xl font-semibold tracking-tight sm:text-3xl ${HEADING}`}>See what your community can earn</h2>
        <p className={`mt-2 text-sm ${BODY}`}>Here&apos;s what {EXAMPLE_USERS} active Premium members adds up to.</p>

        {/* Headline example card */}
        <div className={`mt-8 p-7 md:p-10 ${CARD}`}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${HEADING} bg-slate-100 dark:bg-white/[0.06]`}>{EXAMPLE_USERS} active Premium members</span>
            <span className="rounded-full bg-blue-600/15 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{example.tier.name} · {example.commissionPct}% recurring</span>
          </div>

          {/* Two big highlights */}
          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-6 dark:bg-white/[0.03]">
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${MUTED}`}>Recurring earnings</p>
              <p className={`gp-home-display mt-2 text-5xl font-bold tracking-tight ${HEADING}`}>~{euro(EXAMPLE_MONTHLY)}<span className={`text-xl font-medium ${BODY}`}>/month</span></p>
              <p className={`mt-2 text-xs ${MUTED}`}>{EXAMPLE_USERS} × {PREMIUM_MONTHLY_PRICE} × {example.commissionPct}% ≈ {euro(EXAMPLE_MONTHLY)}/month</p>
            </div>
            <div className="rounded-2xl bg-blue-600/[0.06] p-6 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/[0.08]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">First-year potential</p>
              <p className={`gp-home-display mt-2 text-5xl font-bold tracking-tight ${HEADING}`}>~{euroFull(EXAMPLE_FIRST_YEAR)}</p>
              <p className={`mt-2 text-xs ${MUTED}`}>{euroFull(EXAMPLE_YEARLY)} recurring + {euro(exampleBonuses)} in bonuses</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-200/70 pt-6 dark:border-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Tier", v: example.tier.name },
              { k: "Commission", v: `${example.commissionPct}% recurring` },
              { k: "Yearly recurring", v: `~${euroFull(EXAMPLE_YEARLY)}` },
              { k: "Bonuses unlocked", v: `${euro(CREATOR_MILESTONES[0].bonusEur)} + ${euro(CREATOR_MILESTONES[1].bonusEur)} + ${euro(CREATOR_MILESTONES[2].bonusEur)} = ${euro(exampleBonuses)}` },
            ].map((row) => (
              <div key={row.k}>
                <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${MUTED}`}>{row.k}</p>
                <p className={`mt-1 text-sm font-semibold ${HEADING}`}>{row.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scenario chips across the tiers */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {SCENARIOS.map((s) => (
            <div key={s.users} className={`flex items-center justify-between p-5 ${CARD}`}>
              <div>
                <p className={`text-sm font-semibold ${HEADING}`}>{s.users} Premium members</p>
                <p className={`mt-0.5 text-xs ${MUTED}`}>{s.tier}</p>
              </div>
              <p className={`gp-home-display text-xl font-bold tracking-tight ${HEADING}`}>~{euro(s.monthly)}<span className={`text-xs font-medium ${BODY}`}>/mo</span></p>
            </div>
          ))}
        </div>

        <p className={`mt-4 text-xs ${MUTED}`}>Figures are illustrative and assume members stay on the {PREMIUM_MONTHLY_PRICE}/month plan.</p>
      </AppSection>

      {/* FAQ */}
      <AppSection maxWidth="max-w-3xl" className="!pt-10 !pb-24">
        <p className={EYEBROW}>FAQ</p>
        <h2 className={`gp-home-display mt-3 text-2xl font-semibold tracking-tight sm:text-3xl ${HEADING}`}>Good to know</h2>
        <div className="mt-6 flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className={`group px-5 py-4 ${CARD}`}>
              <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold ${HEADING}`}>
                {item.q}
                <svg className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className={`mt-3 text-sm leading-6 ${BODY}`}>{item.a}</p>
            </details>
          ))}
        </div>

        <div className={`mt-10 flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between ${CARD}`}>
          <div>
            <p className={`text-lg font-semibold ${HEADING}`}>Ready to grow with GamePing?</p>
            <p className={`mt-1 text-sm ${BODY}`}>Join the waitlist and we&apos;ll reach out as the program opens.</p>
          </div>
          <Link href="/contact" className={`${CTA} shrink-0`}>Apply / join waitlist</Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
