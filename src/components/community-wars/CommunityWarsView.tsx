"use client";

import Link from "next/link";
import { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";

/**
 * Community Wars — ADMIN-ONLY CONCEPT DEMO (static, visual only).
 *
 * The live creator layer of World Mobilize: Twitch streamers rally their
 * audiences into factions that push territory momentum during live campaigns.
 * Everything here is hard-coded demo data — NO Twitch integration, NO real
 * voting, NO payments, NO database. The page is admin-gated and noindexed.
 */

const DEMO_PILL =
  "inline-flex items-center rounded-full border border-dashed border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300";

const ACCENT_BADGE =
  "inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]";

/** Demo creator factions — fictional streamers, fictional factions. */
const CREATOR_FACTIONS = [
  {
    creator: "NovaRex",
    faction: "Lumen Vanguard",
    hex: "#22d3ee",
    momentum: 57,
    campaign: "Battle for Craterline",
  },
  {
    creator: "GrimmVolt",
    faction: "Storm Pact",
    hex: "#8b5cf6",
    momentum: 43,
    campaign: "Battle for Craterline",
  },
  {
    creator: "MossQueen",
    faction: "Verdant Order",
    hex: "#34d399",
    momentum: 61,
    campaign: "Scouting Vinegate",
  },
] as const;

const CHAT_FEED = [
  { text: "NovaRex community check-in", delta: "+120 rally points", hex: "#22d3ee" },
  { text: "Craterline is now contested", delta: "Region contested", hex: "#f59e0b" },
  { text: "GrimmVolt raid landed", delta: "Creator raid boosted faction +300", hex: "#8b5cf6" },
  { text: "Hype train ×3 on Lumen Vanguard", delta: "Momentum surge", hex: "#22d3ee" },
  { text: "MossQueen squad scouts the south", delta: "Vinegate scouted", hex: "#34d399" },
] as const;

const VIEWER_ACTIONS = [
  { label: "Daily rally", detail: "Check in once a day to feed your faction's momentum." },
  { label: "Scout region", detail: "Reveal how contested a neighboring region really is." },
  { label: "Defend city", detail: "Hold the line when your capital comes under attack." },
  { label: "Boost creator faction", detail: "Throw extra weight behind your creator's push." },
] as const;

const BATTLE = {
  region: "Craterline",
  macro: "Hollowmark",
  a: CREATOR_FACTIONS[0],
  b: CREATOR_FACTIONS[1],
  aPct: 57,
} as const;

export default function CommunityWarsView() {
  return (
    <AppSection maxWidth="max-w-6xl">
      {/* Hero */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          World Mobilize · Live layer
        </p>
        <span className={DEMO_PILL}>Admin-only concept demo</span>
        <span className={ACCENT_BADGE}>Static prototype</span>
      </div>
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
        Community <span className="text-[color:var(--page-accent-strong)]">Wars</span>
      </h1>
      <p className="mt-4 text-lg font-bold text-white/90">
        Twitch communities become factions.
      </p>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-200">
        Creator-led battles where Twitch communities rally, push momentum, and fight for
        territory inside World Mobilize.
      </p>
      <p className={`mt-3 ${APP_MUTED}`}>
        Static prototype — no live Twitch integration yet, no real voting, no payments.
      </p>
      <div className="mt-8">
        <Link href="/worldmobilize" className={APP_PRIMARY_CTA_ACCENT_SM}>
          Open the World Mobilize map
        </Link>
      </div>

      {/* Live campaign mock */}
      <section className="mt-16" aria-labelledby="cw-live-heading">
        <h2 id="cw-live-heading" className="text-2xl font-extrabold text-white">
          Live campaign
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          How a creator campaign will look while it&apos;s happening. Mock data — the embed is a
          placeholder, not a real stream.
        </p>
        <div className={`${APP_CARD_LG} mt-6 overflow-hidden p-0`}>
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            {/* Fake embed */}
            <div className="relative flex min-h-[240px] items-center justify-center bg-[#0a0d1e]">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.18),transparent_65%)]" />
              <div className="relative flex flex-col items-center gap-3 p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/[0.06]">
                  <svg className="h-6 w-6 translate-x-0.5 text-white/80" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <p className="text-sm font-bold text-white/85">Live embed placeholder</p>
                <p className="text-xs text-slate-400">No Twitch integration yet — concept only.</p>
              </div>
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-rose-600/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                Live · Demo
              </span>
              <span className="absolute right-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white/85">
                12.4k watching
              </span>
            </div>
            {/* Campaign facts */}
            <div className="border-t border-white/10 p-6 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Streamer
              </p>
              <p className="mt-1 text-xl font-extrabold text-white">NovaRex</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">Faction</dt>
                  <dd className="inline-flex items-center gap-2 font-bold text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" aria-hidden />
                    Lumen Vanguard
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">Current battle</dt>
                  <dd className="font-bold text-white">{BATTLE.region}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">Territory push</dt>
                  <dd className="font-bold text-white">
                    {BATTLE.region} · {BATTLE.macro}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">Momentum</dt>
                  <dd className="font-black tabular-nums text-cyan-300">{BATTLE.aPct}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Creator factions */}
      <section className="mt-16" aria-labelledby="cw-factions-heading">
        <h2 id="cw-factions-heading" className="text-2xl font-extrabold text-white">
          Creator factions
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Creators rally their audience into a faction; the community&apos;s activity becomes
          its strength. Demo creators — all fictional.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CREATOR_FACTIONS.map((f) => (
            <div key={f.creator} className={`${APP_CARD} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-extrabold text-white">{f.creator}</p>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ borderColor: `${f.hex}55`, color: f.hex, backgroundColor: `${f.hex}14` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.hex }} aria-hidden />
                  {f.faction}
                </span>
              </div>
              <p className="mt-4 text-3xl font-black tabular-nums text-white">
                {f.momentum}%
                <span className="ml-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  momentum
                </span>
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${f.momentum}%`, backgroundColor: f.hex }} />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Active campaign
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{f.campaign}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chat momentum */}
      <section className="mt-16" aria-labelledby="cw-chat-heading">
        <h2 id="cw-chat-heading" className="text-2xl font-extrabold text-white">
          Chat becomes momentum
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          The idea: future Twitch chat activity — check-ins, raids, hype trains — could convert
          into faction momentum during live campaigns. Below is a mock feed of what that could
          look like. Nothing here is connected to Twitch.
        </p>
        <div className={`${APP_CARD_LG} mt-6 p-5 md:p-6`}>
          <ul className="space-y-2.5">
            {CHAT_FEED.map((entry, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-slate-300">{entry.text}</span>
                <span className="text-sm font-black tabular-nums" style={{ color: entry.hex }}>
                  {entry.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Viewer actions */}
      <section className="mt-16" aria-labelledby="cw-actions-heading">
        <h2 id="cw-actions-heading" className="text-2xl font-extrabold text-white">
          Viewer actions
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Daily moves every viewer will get during a campaign. Demo only — buttons do nothing yet.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VIEWER_ACTIONS.map((action) => (
            <div key={action.label} className={`${APP_CARD} p-5`}>
              <p className="text-base font-extrabold text-white">{action.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{action.detail}</p>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-4 inline-flex cursor-not-allowed items-center rounded-full border border-dashed border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/50"
              >
                Demo only
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Territory impact */}
      <section className="mt-16" aria-labelledby="cw-territory-heading">
        <h2 id="cw-territory-heading" className="text-2xl font-extrabold text-white">
          Territory impact
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Campaign momentum lands on the World Mobilize map: two communities pushing one region.
        </p>
        <div className={`${APP_CARD_LG} mt-6 p-6 md:p-7`}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            {BATTLE.macro} · contested region
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-white gp-home-display">
            {BATTLE.region}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold">
            <span className="inline-flex items-center gap-2" style={{ color: BATTLE.a.hex }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BATTLE.a.hex }} aria-hidden />
              {BATTLE.a.faction}
            </span>
            <span className="inline-flex items-center gap-2" style={{ color: BATTLE.b.hex }}>
              {BATTLE.b.faction}
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BATTLE.b.hex }} aria-hidden />
            </span>
          </div>
          <div
            className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10"
            role="img"
            aria-label={`${BATTLE.a.faction} ${BATTLE.aPct}% vs ${BATTLE.b.faction} ${100 - BATTLE.aPct}%`}
          >
            <div className="h-full rounded-l-full" style={{ width: `${BATTLE.aPct}%`, backgroundColor: BATTLE.a.hex }} />
            <div className="h-full flex-1" style={{ backgroundColor: BATTLE.b.hex }} />
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-300">
            <span>{BATTLE.aPct}%</span>
            <span>{100 - BATTLE.aPct}%</span>
          </div>
          <div className="mt-6">
            <Link href="/worldmobilize?region=craterline" className={APP_PRIMARY_CTA_ACCENT_SM}>
              See {BATTLE.region} on the map
            </Link>
          </div>
        </div>
      </section>

      <p className={`mt-14 ${APP_MUTED}`}>
        Admin-only concept demo — static data throughout. No Twitch integration, no real voting,
        no payments, no public access.
      </p>
    </AppSection>
  );
}
