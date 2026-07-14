"use client";

import Link from "next/link";
import { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  PARTY_CATEGORY_GROUPS,
  PARTY_LIST_PREVIEW,
} from "@/lib/parties/party-data";

const ACCENT_BADGE =
  "inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Import your library",
    body: "GamePing sees the multiplayer and co-op games you already own — no manual lists.",
  },
  {
    step: "02",
    title: "Join a game list",
    body: "Mark yourself as looking to play Dota, 7 Days to Die, Helldivers, Monster Hunter, or anything else in your library.",
  },
  {
    step: "03",
    title: "Match by vibe",
    body: "Matching finds players by region, language, playstyle, and availability — not just rank.",
  },
];

export default function PartiesView() {
  return (
    <AppSection maxWidth="max-w-6xl">
      {/* Hero */}
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
        Squads &amp; co-op
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
        GamePing <span className="text-[color:var(--page-accent-strong)]">Parties</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
        Find players for the games you already own — from co-op survival nights to ranked matches
        and weekend squads.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="#party-lists" className={APP_PRIMARY_CTA_ACCENT_SM}>
          Explore party lists
        </Link>
        <Link href="#how-it-works" className={APP_SECONDARY_CTA}>
          How it works
        </Link>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="mt-16 scroll-mt-24" aria-labelledby="parties-how-heading">
        <h2 id="parties-how-heading" className="text-2xl font-extrabold text-white">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.step} className={APP_CARD}>
              <p className="text-sm font-black tabular-nums text-[color:var(--page-accent-text)]">
                {s.step}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Game categories / lists */}
      <section id="party-lists" className="mt-16 scroll-mt-24" aria-labelledby="parties-lists-heading">
        <h2 id="parties-lists-heading" className="text-2xl font-extrabold text-white">
          Game lists
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Built for co-op nights, survival servers, ranked squads, and weird long sessions.
        </p>

        <div className="mt-8 space-y-8">
          {PARTY_CATEGORY_GROUPS.map((group) => (
            <div key={group.id} id={group.id} className={`scroll-mt-24 ${APP_CARD_LG}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={ACCENT_BADGE}>{group.category}</span>
                </div>
              </div>
              <p className={`mt-3 text-sm leading-6 ${APP_MUTED}`}>{group.blurb}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {group.games.map((game) => (
                  <li
                    key={game.title}
                    className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      <Link
                        href={gameDetailPath(game.title)}
                        className="transition hover:text-[color:var(--page-accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] rounded-md"
                      >
                        {game.title}
                      </Link>
                    </h3>
                    <p className={`mt-1.5 text-sm leading-6 ${APP_MUTED}`}>{game.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Game list preview */}
      <section id="weekend-squads" className="mt-16 scroll-mt-24" aria-labelledby="parties-preview-heading">
        <h2 id="parties-preview-heading" className="text-2xl font-extrabold text-white">
          A party list, at a glance
        </h2>
        <article className={`mt-5 ${APP_CARD_LG}`}>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {PARTY_LIST_PREVIEW.game} party list
          </h3>
          <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>
            Match by playstyle, not just rank. Filters narrow a list down to the people you
            actually want to queue with:
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {PARTY_LIST_PREVIEW.filters.map((filter) => (
              <li
                key={filter}
                className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                {filter}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`${APP_PRIMARY_CTA_ACCENT_SM} cursor-default opacity-90`}
              role="note"
              aria-label="Join the waitlist"
            >
              Join the waitlist
            </span>
            <Link
              href="/recommend"
              className="text-sm font-semibold text-[color:var(--page-accent-text)] underline-offset-4 hover:underline"
            >
              Find games to play meanwhile
            </Link>
          </div>
        </article>
      </section>

      <section className={`mt-16 ${APP_CARD_LG}`} aria-labelledby="parties-future-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
          Smart matching
        </p>
        <h2 id="parties-future-heading" className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
          Matched on how you play
        </h2>
        <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
          GamePing Parties uses Steam import and your game signals to suggest players for
          specific games — considering owned games, region, language, casual vs. competitive,
          availability, and how you like to play.
        </p>
      </section>
    </AppSection>
  );
}
