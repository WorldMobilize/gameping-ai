"use client";

import Link from "next/link";
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
  HIDDEN_GEM_FEATURED,
  HIDDEN_GEM_PICKS,
  type HiddenGemPick,
} from "@/lib/discovery/curated-picks";

const ACCENT_BADGE =
  "inline-flex items-center whitespace-nowrap rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]";

// Borderless tag pill — frosted fill only, no outline.
const VIBE_TAG =
  "inline-flex items-center whitespace-nowrap rounded-full bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-white/[0.06] dark:text-slate-300";

function GemCard({ pick }: { pick: HiddenGemPick }) {
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
          <span className={ACCENT_BADGE}>{pick.discoveryCategory}</span>
          {pick.priceLabel ? (
            <span className="whitespace-nowrap text-xs font-bold tabular-nums text-[color:var(--page-accent-text)]">
              {pick.priceLabel}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
          <Link href={href} className="transition hover:text-[color:var(--page-accent-text)]">
            {pick.title}
          </Link>
        </h3>
        <p className={`mt-2 flex-1 text-sm leading-6 ${APP_MUTED}`}>{pick.reason}</p>
        <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1.5">
          {pick.tags.map((tag) => (
            <span key={tag} className={VIBE_TAG}>
              {tag}
            </span>
          ))}
        </div>
        <Link href={href} className={`mt-4 w-fit ${APP_PRIMARY_CTA_ACCENT_SM}`}>
          View details
        </Link>
      </div>
    </article>
  );
}

export default function HiddenGemsView({
  featured = HIDDEN_GEM_FEATURED,
  picks = HIDDEN_GEM_PICKS,
  meta,
  breadcrumbs,
}: {
  /** Cached RAWG-derived picks (admin testing); falls back to static curated data. */
  featured?: HiddenGemPick;
  picks?: HiddenGemPick[];
  /** Admin-only cached-rotation metadata (period, generated_at, source). */
  meta?: DiscoveryRotationMetaData;
  /** Public breadcrumb (visible + BreadcrumbList JSON-LD). */
  breadcrumbs?: GameBreadcrumbItem[];
} = {}) {
  const visible = picks;

  const featuredHref = gameDetailPath(featured.title);

  return (
    <AppSection maxWidth="max-w-6xl">
      {/* 1 — Hero */}
      {breadcrumbs?.length ? (
        <PageBreadcrumbs items={breadcrumbs} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Discovery
        </p>
      </div>
      <DiscoveryRotationMeta meta={meta} />
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
        Hidden gems <span className="text-[color:var(--page-accent-strong)]">worth discovering</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
        Underrated games with a strong identity, picked for players who want something beyond the
        usual recommendations.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/recommend" className={APP_PRIMARY_CTA_ACCENT_SM}>
          Find games for my taste
        </Link>
        <Link href="/games" className={APP_SECONDARY_CTA}>
          Browse all games
        </Link>
      </div>

      {/* 2 — Featured hidden gem */}
      <section className="mt-12" aria-labelledby="hidden-gems-featured">
        <h2 id="hidden-gems-featured" className="text-2xl font-extrabold text-white">
          Featured hidden gem
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
              <span className={ACCENT_BADGE}>{featured.discoveryCategory}</span>
              {featured.priceLabel ? (
                <span className="whitespace-nowrap text-sm font-bold tabular-nums text-[color:var(--page-accent-text)]">
                  {featured.priceLabel}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
              <Link href={featuredHref} className="transition hover:text-[color:var(--page-accent-text)]">
                {featured.title}
              </Link>
            </h3>
            <p className={`mt-3 text-base leading-7 ${APP_MUTED}`}>{featured.reason}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="shrink-0 font-bold text-slate-800 dark:text-slate-200">Best for:</dt>
                <dd className={APP_MUTED}>{featured.bestFor}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-bold text-slate-800 dark:text-slate-200">Skip if:</dt>
                <dd className={APP_MUTED}>{featured.skipIf}</dd>
              </div>
            </dl>
            <div className="mt-6">
              <Link href={featuredHref} className={APP_PRIMARY_CTA_ACCENT_SM}>
                View details
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* 3 — Hidden Gems grid */}
      <section className="mt-12" aria-labelledby="hidden-gems-grid-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="hidden-gems-grid-heading" className="text-2xl font-extrabold text-white">
            More hidden gems
          </h2>
          <p className="text-sm text-slate-300" aria-live="polite">
            {visible.length} pick{visible.length === 1 ? "" : "s"}
          </p>
        </div>
        {visible.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((pick) => (
              <li key={pick.id} className="flex">
                <GemCard pick={pick} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={`mt-8 ${APP_CARD} text-center`}>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              No picks in this category yet
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

      {/* 4 — What this page is.
           Only a generated rotation (`meta`) earns the "we refresh this from store
           data and AI analysis" line. Without one the page is a hand-picked list
           that does not change, and it says that instead. */}
      <section className={`mt-12 ${APP_CARD_LG}`} aria-labelledby="hidden-gems-fresh">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
            {meta ? "Fresh hidden-gem discovery" : "Hand-picked hidden gems"}
          </p>
        </div>
        <h2 id="hidden-gems-fresh" className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
          Overlooked games, surfaced for you
        </h2>
        <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
          {meta
            ? "GamePing refreshes this page with overlooked games worth your time, combining store data, player signals, and AI taste analysis."
            : "These gems are chosen by hand, not generated. Open any game to see its live price and current deals."}
        </p>
      </section>
    </AppSection>
  );
}
