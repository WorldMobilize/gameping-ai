"use client";

import { AppSection } from "@/components/app/AppPageShell";
import { APP_CARD, APP_CARD_LG, APP_MUTED } from "@/components/app/app-styles";

/**
 * Community Wars — ADMIN-ONLY CONCEPT DEMO (static, visual only).
 *
 * Gaming-themed take on the WorldMobilize idea: communities compete for
 * territory, momentum, and bragging rights. Everything on this page is
 * hard-coded demo data — no database tables, no voting logic, no payments,
 * no live systems. The page is admin-gated and noindexed.
 */

const ACCENT_BADGE =
  "inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]";

const DEMO_PILL =
  "inline-flex items-center rounded-full border border-dashed border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300";

/** Demo factions with fixed colors used across map, wars, and momentum cards. */
const FACTIONS = [
  { key: "wasteland", name: "Wasteland (Fallout)", tile: "bg-cyan-500/70", text: "text-cyan-300" },
  { key: "tamriel", name: "Tamriel (Elder Scrolls)", tile: "bg-violet-500/70", text: "text-violet-300" },
  { key: "indie", name: "Indie Alliance", tile: "bg-emerald-500/70", text: "text-emerald-300" },
  { key: "aaa", name: "AAA Coalition", tile: "bg-amber-500/70", text: "text-amber-300" },
] as const;

/**
 * Static territory layout (8×5). Values index into FACTIONS; -1 = contested
 * (neutral). Purely visual — a placeholder for a future real map.
 */
const TERRITORY_ROWS: number[][] = [
  [0, 0, 0, 1, 1, 1, 3, 3],
  [0, 0, -1, 1, 1, 3, 3, 3],
  [0, 2, 2, -1, 1, 1, 3, 3],
  [2, 2, 2, 2, -1, 1, 1, 3],
  [2, 2, 2, 0, 0, -1, 1, 1],
];

const ACTIVE_WARS = [
  { a: "Fallout", b: "Elder Scrolls", aPct: 54, theater: "Open-world RPG heartlands" },
  { a: "Soulslike", b: "Roguelike", aPct: 47, theater: "Difficulty frontier" },
  { a: "PC", b: "Console", aPct: 61, theater: "Platform ridge" },
  { a: "Indie", b: "AAA", aPct: 58, theater: "Budget canyon" },
  { a: "League", b: "Dota", aPct: 50, theater: "MOBA lowlands" },
  { a: "Minecraft", b: "Terraria", aPct: 52, theater: "Sandbox plains" },
] as const;

const MOMENTUM_CARDS = [
  {
    faction: FACTIONS[2],
    stat: "+18%",
    line: "Indie Alliance surging after a weekend rally.",
  },
  {
    faction: FACTIONS[0],
    stat: "+11%",
    line: "Wasteland holding the northern territories for 6 days.",
  },
  {
    faction: FACTIONS[1],
    stat: "+7%",
    line: "Tamriel counter-push building on the eastern front.",
  },
] as const;

const DAILY_ACTIONS = [
  { label: "Check in", detail: "Daily presence keeps your faction's momentum alive." },
  { label: "Rally", detail: "Boost one active war for your side today." },
  { label: "Claim territory", detail: "Convert momentum into map control." },
] as const;

export default function CommunityWarsView() {
  return (
    <AppSection maxWidth="max-w-6xl">
      {/* Hero */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Community
        </p>
        <span className={DEMO_PILL}>Admin-only concept demo</span>
        <span className={ACCENT_BADGE}>Alpha</span>
      </div>
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
        Community <span className="text-[color:var(--page-accent-strong)]">Wars</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
        Communities compete for territory, momentum, and bragging rights. Rally your side,
        hold the map, and settle the classic rivalries — Fallout vs Elder Scrolls, PC vs
        Console, Indie vs AAA.
      </p>
      <p className={`mt-3 ${APP_MUTED}`}>
        Static concept data — no real votes, no live systems. GamePing is growing into a
        community layer; this is the first visual of it.
      </p>

      {/* Territory map placeholder */}
      <section className="mt-16" aria-labelledby="cw-map-heading">
        <h2 id="cw-map-heading" className="text-2xl font-extrabold text-white">
          Faction map
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Territory placeholder — each tile is a region held by a faction. Contested tiles
          pulse until one side claims them.
        </p>
        <div className={`${APP_CARD_LG} mt-6 p-5 md:p-6`}>
          <div className="grid grid-cols-8 gap-1.5">
            {TERRITORY_ROWS.flatMap((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  title={cell === -1 ? "Contested" : FACTIONS[cell].name}
                  className={`aspect-square rounded-md ${
                    cell === -1
                      ? "animate-pulse border border-dashed border-white/40 bg-white/10 motion-reduce:animate-none"
                      : FACTIONS[cell].tile
                  }`}
                />
              ))
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {FACTIONS.map((f) => (
              <span key={f.key} className="inline-flex items-center gap-2 text-xs text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-sm ${f.tile}`} aria-hidden />
                {f.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 text-xs text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-sm border border-dashed border-white/40 bg-white/10"
                aria-hidden
              />
              Contested
            </span>
          </div>
        </div>
      </section>

      {/* Active wars */}
      <section className="mt-16" aria-labelledby="cw-wars-heading">
        <h2 id="cw-wars-heading" className="text-2xl font-extrabold text-white">
          Active wars
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Head-to-head rivalries. The bar shows current momentum between the two sides.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ACTIVE_WARS.map((war) => (
            <div key={`${war.a}-${war.b}`} className={`${APP_CARD} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                {war.theater}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-base font-extrabold text-white">{war.a}</p>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  vs
                </span>
                <p className="text-base font-extrabold text-white">{war.b}</p>
              </div>
              <div
                className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/10"
                role="img"
                aria-label={`${war.a} ${war.aPct}% momentum vs ${war.b} ${100 - war.aPct}%`}
              >
                <div
                  className="h-full rounded-l-full bg-[var(--page-accent-strong)]"
                  style={{ width: `${war.aPct}%` }}
                />
                <div className="h-full flex-1 bg-violet-500/70" />
              </div>
              <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-300">
                <span>{war.aPct}%</span>
                <span>{100 - war.aPct}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community momentum */}
      <section className="mt-16" aria-labelledby="cw-momentum-heading">
        <h2 id="cw-momentum-heading" className="text-2xl font-extrabold text-white">
          Community momentum
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {MOMENTUM_CARDS.map((card) => (
            <div key={card.faction.key} className={`${APP_CARD} p-5`}>
              <p className={`text-sm font-extrabold ${card.faction.text}`}>
                {card.faction.name}
              </p>
              <p className="mt-3 text-3xl font-black tabular-nums text-white">{card.stat}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily actions placeholder */}
      <section className="mt-16" aria-labelledby="cw-actions-heading">
        <h2 id="cw-actions-heading" className="text-2xl font-extrabold text-white">
          Daily actions
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          How members will push their faction forward, one day at a time.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {DAILY_ACTIONS.map((action) => (
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

      <p className={`mt-14 ${APP_MUTED}`}>
        Admin-only concept demo — static data throughout. No voting, no payments, no public
        access.
      </p>
    </AppSection>
  );
}
