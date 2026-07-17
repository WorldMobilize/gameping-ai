"use client";

import Link from "next/link";
import { Fragment, useCallback, useState, type ReactNode } from "react";
import { NAVY_CTA_LG, NAVY_OUTLINE } from "@/components/app/app-styles";
import { CREATOR_BASE_COMMISSION_PCT } from "@/lib/creator-program";
import CompanionOverlayDemo from "@/components/home/landing/CompanionOverlayDemo";
import LandingRedeemCard from "@/components/home/landing/LandingRedeemCard";
import DiscoveryMorphShowcase from "@/components/home/landing/DiscoveryMorphShowcase";
import FeatureBento from "@/components/home/landing/FeatureBento";
import FinalCta from "@/components/home/landing/FinalCta";
import {
  GLYPH_BOLT,
  GLYPH_CHAT,
  GLYPH_COMPANION,
  GLYPH_DISCOVERY,
  GLYPH_KEYBOARD,
  GLYPH_WORLDMOBILIZE,
} from "@/components/home/landing/landing-icons";
import HowItWorks from "@/components/home/landing/HowItWorks";
import LandingFaq from "@/components/home/landing/LandingFaq";
import PremiumIcon from "@/components/home/landing/PremiumIcon";
import SpacePlanet from "@/components/home/landing/SpacePlanet";
import RetypeText from "@/components/home/landing/RetypeText";
import Reveal from "@/components/home/landing/Reveal";
import TrustStrip from "@/components/home/landing/TrustStrip";
import WorldMobilizeComingSoonChapter from "@/components/home/landing/WorldMobilizeComingSoonChapter";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  discountedPremiumPrice,
  FREE_FEATURES,
  FREE_PRICE,
  PREMIUM_FEATURES,
  PREMIUM_YEARLY_SAVINGS_PCT,
  premiumPeriod,
  premiumPrice,
  type BillingInterval,
} from "@/lib/pricing";

/**
 * Ecosystem landing — chapters with distinct backgrounds & signature motion.
 *
 * Order: Hero → 01 Discovery (scroll-pinned, heading slides aside as product
 * cards reveal) → 02 Companion (centred overlay demo) → 03 WorldMobilize
 * (minimal, letters drop in, Coming soon) → 04 Pricing. Alternating band
 * backgrounds (BAND_BASE / BAND_RAISED) + dividers separate the chapters so the
 * page doesn't read as one uniform block in dark mode. Presentation only.
 */

// Alternating section backgrounds so each chapter reads as its own band —
// essential in dark mode, where sections are otherwise all transparent.
const BAND_RAISED = "border-y border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]";
const BAND_BASE = "border-t border-slate-200 bg-white dark:border-white/10 dark:bg-transparent";

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

/**
 * The three ecosystem pillars, shown under the hero CTA as informational
 * labels (icon + name). NOT navigation — the navbar already handles that —
 * so these are static, non-clickable, and part of the hero composition.
 */
const HERO_PILLARS: { label: string; icon: ReactNode }[] = [
  { label: "Discovery", icon: GLYPH_DISCOVERY },
  { label: "Companion", icon: GLYPH_COMPANION },
  { label: "WorldMobilize", icon: GLYPH_WORLDMOBILIZE },
];

/** Companion "how it works" — three quick steps. */
const COMPANION_STEPS: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: "Press Alt + G — or Alt + M",
    desc: "Alt + G summons the overlay over any game. Alt + M opens it straight into voice, so you never let go of the controls.",
    icon: GLYPH_KEYBOARD,
  },
  {
    title: "Ask, or just say it",
    desc: "Type your question — a boss, a build, where to go next — or speak it out loud mid-fight and keep playing.",
    icon: GLYPH_CHAT,
  },
  {
    title: "Get the answer",
    desc: "Right over your screen, in seconds — text, an image, a clip, or the track you couldn't place.",
    icon: GLYPH_BOLT,
  },
];

export default function HomeEcosystemLanding() {
  const { theme } = useHomeTheme();
  const isDark = theme !== "light";

  const heading = isDark ? "text-white" : "text-slate-900";
  const body = isDark ? "text-slate-400" : "text-slate-600";
  const eyebrow = isDark ? "text-slate-400" : "text-slate-500";
  const card = isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-slate-200/60 bg-white";

  return (
    <main className="flex-1">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* A world seen from space, lit from the left — behind the copy. */}
        <SpacePlanet />

        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-32 text-center sm:pb-28 sm:pt-48">
          <h1 className={`gp-hero-rise gp-home-display text-[2.5rem] font-bold leading-[1.06] sm:text-[3.5rem] lg:text-[4.75rem] ${heading}`} style={{ animationDelay: "90ms" }}>
            <span className="block lg:whitespace-nowrap">The home for gamers.</span>
            <span className="block lg:whitespace-nowrap">One connected <span className="text-blue-700 dark:text-blue-400">world</span>.</span>
          </h1>

          <p className={`gp-hero-rise mx-auto mt-8 max-w-lg text-lg leading-relaxed sm:text-xl ${body}`} style={{ animationDelay: "170ms" }}>
            Three connected products, one platform for how you find, play, and belong.
          </p>

          {/* The one primary hero action — it opens the ecosystem (the three
           * products) rather than dropping straight into one of them. */}
          <div className="gp-hero-rise mt-11 flex flex-col items-center" style={{ animationDelay: "240ms" }}>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-9 py-4 text-[15px] font-semibold text-white shadow-[0_18px_44px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-white dark:text-slate-900 dark:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6)] dark:hover:bg-slate-100 dark:focus-visible:ring-white/40"
            >
              Start your journey
            </a>
            <p className={`mt-4 text-sm ${body}`}>Free to start. No credit card required.</p>
          </div>

          {/* Ecosystem pillars — informational labels, part of the hero composition
           * (navigation lives in the navbar): static, not clickable, not tabs/pills. */}
          {/* Wraps instead of overflowing: on a narrow phone "WorldMobilize" drops
              to its own line rather than being cut off. Dividers only once the
              three sit on one row. */}
          <div className="gp-hero-rise mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-14" style={{ animationDelay: "320ms" }}>
            {HERO_PILLARS.map((p, i) => (
              <Fragment key={p.label}>
                {i > 0 ? <span aria-hidden className="hidden h-6 w-px bg-slate-300/70 dark:bg-white/15 sm:block" /> : null}
                <span className={`flex items-center gap-2 text-[15px] font-semibold sm:gap-2.5 sm:text-lg ${heading}`}>
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6">{p.icon}</Icon>
                  {p.label}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trust strip — real data sources ═══ */}
      <TrustStrip className={BAND_BASE} />

      {/* ═══ How it works — 3-step primer ═══ */}
      <HowItWorks className={BAND_RAISED} />

      {/* ═══ 01 · DISCOVERY — scroll-driven morph → cards reveal (reversible, in flow) ═══ */}
      <DiscoveryMorphShowcase heading={heading} body={body} eyebrow={eyebrow} className={BAND_BASE} />

      {/* ═══ 02 · COMPANION — centred overlay demo (no window chrome) ═══ */}
      <section id="companion" className={`scroll-mt-[150px] py-24 sm:py-36 ${BAND_RAISED}`}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className={`flex items-center justify-center gap-3 text-[13px] font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>
              <span className="tabular-nums">02</span><span className="h-px w-8 bg-current opacity-40" aria-hidden />Desktop app
            </p>
            <h2 className={`gp-home-display mt-4 text-[2.6rem] font-semibold uppercase leading-[0.98] sm:text-[4.75rem] ${heading}`}>
              <RetypeText text="Companion" speed={80} />
            </h2>
            <p className={`mt-5 text-lg leading-relaxed sm:text-xl ${body}`}>
              Never alt-tab to a wiki again — ask mid-game, get the answer right over your screen.
            </p>
          </div>

          {/* Desktop only: the overlay demo needs the width to read at all — on a
              phone the panel and its answer collapse into an unreadable smudge. */}
          <div className="mt-14 hidden md:block"><CompanionOverlayDemo /></div>

          {/* How the Companion works — 3 steps */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {COMPANION_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 110}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <PremiumIcon className="h-11 w-11"><Icon>{step.icon}</Icon></PremiumIcon>
                  <div>
                    <p className={`text-sm font-semibold ${heading}`}>{step.title}</p>
                    <p className={`mt-1 text-sm leading-6 ${body}`}>{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <Link href="/companion" className={NAVY_CTA_LG}>Get Companion</Link>
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${body}`}>Windows · in alpha</p>
          </div>
        </div>
      </section>

      {/* ═══ 03 · WORLDMOBILIZE — minimal, letters drop in, Coming soon ═══ */}
      <WorldMobilizeComingSoonChapter heading={heading} eyebrow={eyebrow} className={BAND_BASE} />

      {/* ═══ Feature bento — everything in one place ═══ */}
      <FeatureBento className={BAND_RAISED} />

      {/* ═══ 04 · PRICING ═══ */}
      <PricingChapter heading={heading} body={body} eyebrow={eyebrow} isDark={isDark} card={card} />

      {/* ═══ FAQ ═══ */}
      <LandingFaq className={BAND_RAISED} />

      {/* ═══ Closing CTA ═══ */}
      <FinalCta className={BAND_BASE} />
    </main>
  );
}

/* ═══════════ Pricing chapter ═══════════ */
function PricingChapter({ heading, body, eyebrow, isDark, card }: { heading: string; body: string; eyebrow: string; isDark: boolean; card: string }) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [code, setCode] = useState("");
  const [codeInfo, setCodeInfo] = useState<{ valid: boolean; type?: string } | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const discountApplied = codeInfo?.valid === true && codeInfo.type === "discount";

  const validateCode = useCallback(async (raw: string) => {
    const c = raw.trim();
    if (!c) {
      setCodeInfo(null);
      return;
    }
    setCheckingCode(true);
    try {
      const res = await fetch(`/api/creator/redeem?code=${encodeURIComponent(c)}`);
      const d = (await res.json().catch(() => ({}))) as { valid?: boolean; type?: string };
      setCodeInfo(res.ok ? { valid: Boolean(d.valid), type: d.type } : { valid: false });
    } catch {
      setCodeInfo({ valid: false });
    } finally {
      setCheckingCode(false);
    }
  }, []);

  const premiumHref = codeInfo?.valid
    ? `/upgrade?ref=${encodeURIComponent(code.trim())}`
    : "/upgrade";

  const premiumCompact = PREMIUM_FEATURES.slice(0, 4);
  const freeCompact = FREE_FEATURES.slice(0, 3);

  return (
    <section id="pricing" className={`scroll-mt-20 py-24 sm:py-36 ${BAND_BASE}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className={`flex items-center justify-center gap-3 text-[13px] font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>
            <span className="tabular-nums">04</span><span className="h-px w-8 bg-current opacity-40" aria-hidden />Membership
          </p>
          <h2 className={`gp-home-display mt-4 text-[2.6rem] font-semibold uppercase leading-[0.98] sm:text-[3.5rem] ${heading}`}>Pricing</h2>
          <p className={`mt-5 text-lg leading-relaxed ${body}`}>One simple membership. Start free, go Premium when you&apos;re ready — the same prices you&apos;ll see at checkout.</p>
        </div>

        {/* billing toggle */}
        <div className="mt-10 flex justify-center">
          <div className={`inline-flex items-center gap-1 rounded-full border p-1 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"}`}>
            {(["month", "year"] as const).map((iv) => (
              <button
                key={iv} type="button" onClick={() => setInterval(iv)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  interval === iv ? "bg-blue-600 text-white" : `${body} hover:text-slate-900 dark:hover:text-white`
                }`}
              >
                {iv === "month" ? "Monthly" : "Yearly"}
                {iv === "year" ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${interval === "year" ? "bg-white/20 text-white" : "bg-blue-500/15 text-blue-600 dark:text-blue-300"}`}>−{PREMIUM_YEARLY_SAVINGS_PCT}%</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* plans — Free + Premium (+ For Creators for admins only, prices match /upgrade).
            The creator card is admin-gated below; the grid widens to three columns only
            when it's shown, so the public still sees a balanced two-column layout. */}
        <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
          {/* Free */}
          <Reveal>
            <div className={`flex h-full flex-col rounded-[1.75rem] border p-7 md:p-8 ${card}`}>
              <p className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${body}`}>Free</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className={`text-[2.75rem] font-bold leading-none tracking-tight ${heading}`}>{FREE_PRICE}</span>
                <span className={`text-sm ${body}`}>/forever</span>
              </div>
              <p className={`mt-3 text-sm ${body}`}>Try the core discovery engine and build your taste.</p>
              <Link href="/recommend" className={`mt-7 w-full !px-4 !py-2.5 ${NAVY_OUTLINE}`}>Start free</Link>
              <ul className="mt-8 flex flex-col gap-3.5">
                {freeCompact.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"><path d="M5 12l5 5 9-11" /></Icon>
                    <span className={heading}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Premium — taller & elevated (breaks out of the row) */}
          <Reveal delay={110}>
            <div className={`relative z-10 flex flex-col rounded-[1.75rem] border p-7 md:-my-6 md:p-9 ${isDark ? "border-blue-400/40 bg-white/[0.05] shadow-[0_40px_100px_-40px_rgba(37,99,235,0.7)]" : "border-blue-300 bg-white shadow-[0_40px_100px_-36px_rgba(37,99,235,0.5)]"}`}>
              <div aria-hidden className="gp-glow-pulse pointer-events-none absolute -inset-4 -z-10 rounded-[2.2rem] bg-gradient-to-b from-blue-500/30 to-blue-600/10 blur-2xl" />
              <div className="flex min-h-6 items-center justify-between">
                <p className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${body}`}>Premium</p>
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">Popular</span>
              </div>
              {discountApplied ? (
                <>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className={`text-lg font-semibold line-through ${body}`}>{premiumPrice(interval)}</span>
                    <span className={`text-[2.75rem] font-bold leading-none tracking-tight ${heading}`}>{discountedPremiumPrice(interval)}</span>
                    <span className={`text-sm ${body}`}>{premiumPeriod(interval)}</span>
                  </div>
                  <p className={`mt-3 text-sm ${body}`}>{discountedPremiumPrice(interval)} the first {interval === "year" ? "year" : "month"}, then {premiumPrice(interval)}{premiumPeriod(interval)}.</p>
                </>
              ) : (
                <>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className={`text-[2.75rem] font-bold leading-none tracking-tight ${heading}`}>{premiumPrice(interval)}</span>
                    <span className={`text-sm ${body}`}>{premiumPeriod(interval)}</span>
                  </div>
                  <p className={`mt-3 text-sm ${body}`}>{interval === "year" ? `Billed yearly — save ${PREMIUM_YEARLY_SAVINGS_PCT}% vs monthly.` : "Billed monthly — cancel anytime."}</p>
                </>
              )}
              <Link href={premiumHref} className={`mt-7 w-full !px-4 !py-2.5 ${NAVY_CTA_LG}`}>Go Premium</Link>
              <ul className="mt-8 flex flex-col gap-3.5">
                {premiumCompact.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"><path d="M5 12l5 5 9-11" /></Icon>
                    <span className={heading}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* For Creators — admin-only until the programme can actually pay (no referral
              tracking / payouts wired up yet; /creators is admin-gated in the middleware).
              Mid prominence: more than Free, less than Premium. */}
            <Reveal delay={180}>
              <div className={`relative flex h-full flex-col rounded-[1.75rem] border p-7 ring-1 ring-blue-400/20 md:p-8 ${card}`}>
                <div aria-hidden className="pointer-events-none absolute -inset-2 -z-10 rounded-[1.9rem] bg-blue-500/10 blur-xl" />
                <p className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${body}`}>For Creators</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className={`text-[2.25rem] font-bold leading-none tracking-tight ${heading}`}>Earn</span>
                  <span className={`text-sm ${body}`}>with your audience</span>
                </div>
                <p className={`mt-3 text-sm ${body}`}>Share GamePing with your community and earn recurring commission while referred members stay Premium.</p>
                <Link href="/creators" className={`mt-7 w-full !px-4 !py-2.5 ${NAVY_OUTLINE}`}>Explore the creator program</Link>
                <ul className="mt-8 flex flex-col gap-3.5">
                  {[`${CREATOR_BASE_COMMISSION_PCT}% recurring commission to start`, "Higher tiers as your community grows", "One-time milestone bonuses"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"><path d="M5 12l5 5 9-11" /></Icon>
                      <span className={heading}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
        </div>

        <p className={`mt-12 text-center text-sm ${body}`}>
          <Link href="/upgrade" className={`font-semibold underline underline-offset-4 ${heading}`}>See full Premium details</Link> — everything Free includes, and more.
        </p>

        <LandingRedeemCard
          card={card}
          heading={heading}
          body={body}
          value={code}
          onChange={(v) => {
            setCode(v);
            setCodeInfo(null);
          }}
          onApply={() => validateCode(code)}
          codeInfo={codeInfo}
          busy={checkingCode}
        />
      </div>
    </section>
  );
}
