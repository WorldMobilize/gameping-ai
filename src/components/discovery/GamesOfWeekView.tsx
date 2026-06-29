"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppSection } from "@/components/app/AppPageShell";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import {
  APP_CARD,
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import DiscoveryCover from "@/components/discovery/DiscoveryCover";
import DiscoveryRotationMeta, {
  type DiscoveryRotationMetaData,
} from "@/components/discovery/DiscoveryRotationMeta";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  WEEKLY_CATEGORIES,
  WEEKLY_FEATURED,
  WEEKLY_GAME_PICKS,
  type WeeklyCategory,
  type WeeklyGamePick,
} from "@/lib/discovery/curated-picks";

const ACCENT_BADGE =
  "inline-flex items-center whitespace-nowrap rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]";

// Savings/deal note — green carries the "you save" meaning regardless of page accent.
const DEAL_NOTE =
  "inline-flex items-center whitespace-nowrap rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-800 ring-1 ring-green-200/80 dark:bg-green-500/15 dark:text-green-200 dark:ring-green-500/25";

const DETAILS_LINK =
  "mt-4 inline-flex w-fit items-center gap-1 text-sm font-bold uppercase tracking-wider text-[color:var(--page-accent-text)] transition-all hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] rounded-md";

// Borderless filter chips: frosted glass surface + soft shadow for depth (no
// outline in any state). Selected = page-accent fill + accent glow + bolder text.
// Keyboard focus ring is kept (accessibility, not a decorative border).
function chipClass(active: boolean) {
  return active
    ? "rounded-full bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-bold text-[color:var(--page-accent-text)] shadow-[0_6px_18px_-6px_var(--page-accent-glow)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]"
    : "rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[color:var(--page-accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.12]";
}

function DetailsArrow() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8h9M8.5 4l4 4-4 4" />
    </svg>
  );
}

function WeeklyCard({ pick }: { pick: WeeklyGamePick }) {
  const href = gameDetailPath(pick.title);
  return (
    <article className={`flex h-full flex-col overflow-hidden ${APP_CARD} p-0`}>
      <Link
        href={href}
        className="group relative block aspect-[460/215] overflow-hidden bg-slate-100 dark:bg-slate-900"
      >
        <DiscoveryCover
          src={pick.image}
          alt={pick.title}
          className="h-full w-full transition duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className={ACCENT_BADGE}>{pick.category}</span>
          {pick.priceLabel ? (
            <span className="whitespace-nowrap text-xs font-bold tabular-nums text-[color:var(--page-accent-text)]">
              {pick.priceLabel}
            </span>
          ) : null}
          {pick.dealNote ? <span className={DEAL_NOTE}>{pick.dealNote}</span> : null}
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
          <Link href={href} className="transition hover:text-[color:var(--page-accent-text)]">
            {pick.title}
          </Link>
        </h3>
        <p className={`mt-2 flex-1 text-sm leading-6 ${APP_MUTED}`}>{pick.whyThisWeek}</p>
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Best for:</span>{" "}
          {pick.bestFor}
        </p>
        <Link href={href} className={DETAILS_LINK}>
          View details
          <DetailsArrow />
        </Link>
      </div>
    </article>
  );
}

export default function GamesOfWeekView({
  featured = WEEKLY_FEATURED,
  picks = WEEKLY_GAME_PICKS,
  meta,
  canViewWeeklyPicks = false,
  breadcrumbs,
}: {
  /** Cached RAWG-derived picks (admin testing); falls back to static curated data. */
  featured?: WeeklyGamePick;
  picks?: WeeklyGamePick[];
  /** Admin-only cached-rotation metadata (period, generated_at, source). */
  meta?: DiscoveryRotationMetaData;
  /** Public breadcrumb (visible + BreadcrumbList JSON-LD). */
  breadcrumbs?: GameBreadcrumbItem[];
  /**
   * Whether the viewer (admin/premium) can already see personalized Weekly Picks.
   * Drives the hero CTA copy; the destination is always /weekly-picks (personalized
   * weekly discovery lives there now — never /recommend, which is manual search).
   */
  canViewWeeklyPicks?: boolean;
} = {}) {
  const [active, setActive] = useState<WeeklyCategory | "All">("All");

  const visible = useMemo(
    () =>
      active === "All"
        ? picks
        : picks.filter((p) => p.category === active),
    [active, picks]
  );

  const featuredHref = gameDetailPath(featured.title);

  return (
    <AppSection maxWidth="max-w-6xl">
      {/* 1 — Hero */}
      {breadcrumbs?.length ? (
        <PageBreadcrumbs items={breadcrumbs} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Weekly discovery
        </p>
      </div>
      <DiscoveryRotationMeta meta={meta} />
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
        Games worth checking <span className="text-[color:var(--page-accent-strong)]">this week</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
        A weekly mix of standout deals, overlooked picks, and games that deserve your attention
        right now.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/weekly-picks" className={APP_PRIMARY_CTA_ACCENT_SM}>
          {canViewWeeklyPicks ? "See your Weekly Picks" : "Unlock your Weekly Picks"}
        </Link>
        <Link href="/hidden-gems" className={APP_SECONDARY_CTA}>
          Browse hidden gems
        </Link>
      </div>

      {/* 2 — Weekly categories */}
      <section className="mt-14" aria-labelledby="gotw-categories">
        <h2 id="gotw-categories" className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
          Browse by category
        </h2>
        <div className="mt-4 flex flex-wrap gap-2.5" role="group" aria-label="Filter weekly picks by category">
          <button type="button" onClick={() => setActive("All")} className={chipClass(active === "All")} aria-pressed={active === "All"}>
            All
          </button>
          {WEEKLY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={chipClass(active === cat)}
              aria-pressed={active === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3 — This week's featured pick */}
      <section className="mt-12" aria-labelledby="gotw-featured">
        <h2 id="gotw-featured" className="text-2xl font-extrabold text-white">
          This week&apos;s featured pick
        </h2>
        <article className={`mt-5 grid gap-0 overflow-hidden ${APP_CARD_LG} p-0 md:grid-cols-2`}>
          <Link
            href={featuredHref}
            className="group relative block aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900 md:aspect-auto"
          >
            <DiscoveryCover
              src={featured.image}
              alt={featured.title}
              className="h-full w-full transition duration-300 group-hover:scale-[1.02]"
            />
          </Link>
          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className={ACCENT_BADGE}>{featured.category}</span>
              {featured.priceLabel ? (
                <span className="whitespace-nowrap text-sm font-bold tabular-nums text-[color:var(--page-accent-text)]">
                  {featured.priceLabel}
                </span>
              ) : null}
              {featured.dealNote ? (
                <span className={DEAL_NOTE}>{featured.dealNote}</span>
              ) : null}
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
              <Link href={featuredHref} className="transition hover:text-[color:var(--page-accent-text)]">
                {featured.title}
              </Link>
            </h3>
            <p className={`mt-3 text-base leading-7 ${APP_MUTED}`}>{featured.whyThisWeek}</p>
            <p className="mt-4 text-sm">
              <span className="font-bold text-slate-800 dark:text-slate-200">Best for:</span>{" "}
              <span className={APP_MUTED}>{featured.bestFor}</span>
            </p>
            <div className="mt-6">
              <Link href={featuredHref} className={APP_PRIMARY_CTA_ACCENT_SM}>
                View details
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* 4 — Weekly grid */}
      <section className="mt-12" aria-labelledby="gotw-grid-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="gotw-grid-heading" className="text-2xl font-extrabold text-white">
            This week&apos;s picks
          </h2>
          <p className="text-sm text-slate-300" aria-live="polite">
            {visible.length} pick{visible.length === 1 ? "" : "s"}
            {active !== "All" ? ` in ${active}` : ""}
          </p>
        </div>
        {visible.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((pick) => (
              <li key={pick.id} className="flex">
                <WeeklyCard pick={pick} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={`mt-8 ${APP_CARD} text-center`}>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              No picks in this category this week
            </p>
            <p className={`mt-2 ${APP_MUTED}`}>
              Try another category, or{" "}
              <Link href="/recommend" className="font-semibold text-[color:var(--page-accent-text)] underline-offset-4 hover:underline">
                get AI recommendations
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      {/* 5 — Always-fresh note */}
      <section className={`mt-12 ${APP_CARD_LG}`} aria-labelledby="gotw-future">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
          Always fresh
        </p>
        <h2 id="gotw-future" className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
          A rotating set of weekly picks
        </h2>
        <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
          This page highlights a rotating set of weekly picks from GamePing, curated from deal
          data and discovery signals. Check back for new games.
        </p>
      </section>
    </AppSection>
  );
}
