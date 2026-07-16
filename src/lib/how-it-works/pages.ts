/**
 * Canonical data for the public "How GamePing works" feature explanation pages.
 * Single source of truth shared by the index (`/how-it-works`), the detail route
 * (`/how-it-works/[slug]`), the sitemap, and breadcrumbs. Content/marketing only
 * — no logic. The rich per-slug page bodies live in HowItWorksDetailView; `body`
 * here is the short summary used on the index and as a fallback.
 */
export type HowItWorksPageMeta = {
  slug: string;
  /** H1 / metadata title (page title, without the site suffix). */
  title: string;
  /** Short label for index cards and breadcrumbs. */
  navLabel: string;
  /** Meta description + index summary. */
  description: string;
  /** Short accurate summary (used on the index card). */
  body: string;
  /** Optional eyebrow, e.g. "Premium". */
  kicker?: string;
};

/** Ordered list — drives the index grid and sitemap order. */
export const HOW_IT_WORKS_PAGES: HowItWorksPageMeta[] = [
  {
    slug: "taste",
    title: "Tell us your taste",
    navLabel: "Tell us your taste",
    description:
      "GamePing doesn't need perfect filters. Describe what you feel like playing in your own words, and it reads the mood, pacing, and games behind your prompt.",
    body: "Skip the genre tags. Describe what you feel like playing the way you'd text a friend, and GamePing reads the mood, pacing, and intent behind your words.",
  },
  {
    slug: "matches",
    title: "Get smarter matches",
    navLabel: "Get smarter matches",
    description:
      "GamePing goes beyond store tags to analyze why a game fits — gameplay loop, freedom, difficulty, story focus, atmosphere, progression, and replayability.",
    body: "Every pick comes with why it fits, honest concerns, real prices, and where to buy — AI ranking grounded in verified game data, not just sales patterns.",
  },
  {
    slug: "discovery",
    title: "Keep discovering",
    navLabel: "Keep discovering",
    description:
      "Discovery continues after one search. Save recommendation runs, track games, get price alerts, and sync your Steam library so your Taste DNA makes results more personal.",
    body: "Save your runs, track games for price alerts, and sync Steam so your Taste DNA makes every result more personal. Discovery keeps going after one search.",
  },
  {
    slug: "steam-import",
    title: "Steam Import",
    navLabel: "Steam Import",
    kicker: "Premium",
    description:
      "Connect your Steam library so GamePing understands what you actually play — not just what you search.",
    body: "Connect your Steam library and GamePing learns from your owned games and playtime — skipping games you already own and sharpening every recommendation.",
  },
  {
    slug: "taste-memory",
    title: "Taste DNA",
    navLabel: "Taste DNA",
    kicker: "Premium",
    description:
      "Your personal gaming profile evolves from your library, searches, and saved games.",
    body: "Your taste profile builds from your Steam library, searches, and saved games to power your Weekly Picks, Deals For You, and Monthly Recap. The more you use it, the sharper it gets.",
  },
];

const HOW_IT_WORKS_BY_SLUG: Record<string, HowItWorksPageMeta> = Object.fromEntries(
  HOW_IT_WORKS_PAGES.map((page) => [page.slug, page])
);

export function getHowItWorksPage(slug: string): HowItWorksPageMeta | null {
  return HOW_IT_WORKS_BY_SLUG[slug] ?? null;
}

export function getHowItWorksSlugs(): string[] {
  return HOW_IT_WORKS_PAGES.map((page) => page.slug);
}
