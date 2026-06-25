import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import {
  APP_CARD_INTERACTIVE_LG,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";
import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Curated game collections | GamePing AI",
  description:
    "Editor-style lists for popular searches—games like Hades, cozy picks, emotional stories, and more. Jump in, then get personalized recommendations.",
  path: "/curated",
});

const BREADCRUMBS: GameBreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Curated" },
];

/** Inline link in the current page accent (violet on /curated). */
const ACCENT_LINK =
  "font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline";

/** Subtle public-discovery links shown on the hub (internal linking). */
const DISCOVERY_LINKS = [
  { label: "Hidden Gems", href: "/hidden-gems" },
  { label: "Games of the Week", href: "/games-of-the-week" },
  { label: "AI recommendations", href: "/recommend" },
] as const;

/**
 * Presentational grouping for the hub only — no URLs, slugs, cards, or data
 * change. "Games like …" is matched by slug prefix; mood/genre groups list
 * their slugs explicitly. Anything unmatched falls into "More collections" so
 * no collection is ever dropped.
 */
const MOOD_SLUGS = new Set<string>([
  "best-cozy-games",
  "cozy-games-for-long-nights",
  "relaxing-games-after-work",
  "games-for-rainy-nights",
  "atmospheric-exploration-games",
  "beautiful-indie-games",
  "best-emotional-story-games",
  "games-with-deep-stories",
  "emotional-indie-games",
  "games-to-get-lost-in",
  "games-with-amazing-worlds",
]);

const GENRE_SLUGS = new Set<string>([
  "best-open-world-games",
  "best-soulslike-games",
  "best-roguelike-games",
  "best-underwater-exploration-games",
  "best-island-survival-games",
  "relaxing-survival-games",
]);

const COLLECTION_GROUPS = [
  {
    key: "like",
    title: "Games like your favorites",
    blurb: "Start from a game you love and branch out to similar picks.",
    match: (slug: string) => slug.startsWith("games-like-"),
  },
  {
    key: "mood",
    title: "Best games by mood",
    blurb: "Pick by the feeling you're chasing—cozy, emotional, atmospheric.",
    match: (slug: string) => MOOD_SLUGS.has(slug),
  },
  {
    key: "genre",
    title: "Explore by genre & playstyle",
    blurb: "Browse by the kind of game you want—open world, survival, roguelike.",
    match: (slug: string) => GENRE_SLUGS.has(slug),
  },
  {
    key: "more",
    title: "More collections",
    blurb: "",
    match: () => true,
  },
] as const;

export default function CuratedIndexPage() {
  // Assign each collection to the first group it matches (presentational only).
  const assigned = new Set<string>();
  const groupedCollections = COLLECTION_GROUPS.map((group) => {
    const items = CURATED_COLLECTIONS.filter(
      (c) => !assigned.has(c.slug) && group.match(c.slug)
    );
    items.forEach((c) => assigned.add(c.slug));
    return { key: group.key, title: group.title, blurb: group.blurb, items };
  }).filter((g) => g.items.length > 0);

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-curated-bg" />
        <AppSection>
        <PageBreadcrumbs items={BREADCRUMBS} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Game discovery
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          Curated <span className="text-[color:var(--page-accent-strong)]">game lists</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">
          Starting points for common searches—each page has context, examples, and links to dive
          deeper. When you are ready,{" "}
          <Link href="/recommend" className={ACCENT_LINK}>
            run your own recommendation
          </Link>{" "}
          with GamePing AI.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            Discover more
          </span>
          {DISCOVERY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={ACCENT_LINK}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          {groupedCollections.map((group) => (
            <section key={group.key} aria-labelledby={`curated-group-${group.key}`}>
              <h2
                id={`curated-group-${group.key}`}
                className="text-2xl font-bold tracking-tight text-white gp-home-display"
              >
                {group.title}
              </h2>
              {group.blurb ? (
                <p className="mt-2 text-sm leading-6 text-slate-300">{group.blurb}</p>
              ) : null}

              <ul className="mt-6 space-y-4">
                {group.items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/curated/${c.slug}`}
                      className={`group flex flex-col md:flex-row md:items-center md:justify-between md:gap-6 ${APP_CARD_INTERACTIVE_LG}`}
                    >
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-[color:var(--page-accent-text)] dark:text-white dark:group-hover:text-[color:var(--page-accent-text)]">
                          {c.h1}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">{c.intro}</p>
                      </div>
                      <span className="mt-4 shrink-0 text-sm font-bold text-[color:var(--page-accent-text)] md:mt-0">Read</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-[color:var(--page-accent-border)] bg-white p-6 dark:bg-slate-900/70">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Want picks tailored to you—not a static list?
          </p>
          <Link href="/recommend" className={`mt-3 ${APP_PRIMARY_CTA_ACCENT_SM}`}>
            Try your own recommendation
          </Link>
        </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
