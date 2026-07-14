import type { ReactNode } from "react";
import PremiumIcon from "@/components/home/landing/PremiumIcon";
import Reveal from "@/components/home/landing/Reveal";
import {
  GLYPH_BELL,
  GLYPH_COMPANION,
  GLYPH_DNA,
  GLYPH_GEM,
  GLYPH_SPARKLE,
} from "@/components/home/landing/landing-icons";

/**
 * "Everything in one place" — a bento of honest value props in the dark/blue
 * system, with premium metallic icons. Presentation only: no data, no logic.
 */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const TILE = "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/15";
const TITLE = "mt-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white";
const DESC = "mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400";

export default function FeatureBento({ className = "" }: { className?: string }) {
  return (
    <section className={`py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300/80">
            Why GamePing
          </p>
          <h2 className="gp-home-display mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything you need, in one place
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Find, price, and keep track of games — plus a companion for while you play. One account, one world.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className={TILE}>
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
              <PremiumIcon><Icon>{GLYPH_SPARKLE}</Icon></PremiumIcon>
              <h3 className={TITLE}>Taste-aware AI, not tag-matching</h3>
              <p className={`${DESC} max-w-md`}>
                We read how a game <em>feels</em> to play — pace, tone, freedom — and hand you a short, explained
                shortlist. Refine it in your own words and the picks sharpen.
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-2" delay={80}>
            <div className={TILE}>
              <PremiumIcon><Icon>{GLYPH_BELL}</Icon></PremiumIcon>
              <h3 className={TITLE}>Price-drop pings</h3>
              <p className={DESC}>Track a game and we ping you the moment it hits your price.</p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-2" delay={40}>
            <div className={TILE}>
              <PremiumIcon><Icon>{GLYPH_GEM}</Icon></PremiumIcon>
              <h3 className={TITLE}>Curated &amp; hidden gems</h3>
              <p className={DESC}>Hand-built lists and under-played games worth your time.</p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-2" delay={120}>
            <div className={TILE}>
              <PremiumIcon><Icon>{GLYPH_DNA}</Icon></PremiumIcon>
              <h3 className={TITLE}>Your GamePing DNA</h3>
              <p className={DESC}>Sync Steam for a taste profile that makes every pick sharper.</p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-2" delay={160}>
            <div className={TILE}>
              <PremiumIcon><Icon>{GLYPH_COMPANION}</Icon></PremiumIcon>
              <h3 className={TITLE}>Companion overlay</h3>
              <p className={DESC}>Ask mid-game and get the answer over your screen — no alt-tab.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
