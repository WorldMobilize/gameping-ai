import { collectionPath } from "@/lib/curated/collection-kinds";
import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";
import { getHowItWorksSlugs } from "@/lib/how-it-works/pages";
import { getDiscoveryHubPaths } from "@/lib/seo/discovery-hubs";

/** Static public routes (no query strings). */
export const STATIC_PUBLIC_PATHS = [
  "/",
  "/discover",
  "/collections",
  "/worldmobilize/about",
  "/companion/about",
  "/recommend",
  "/games",
  "/hidden-gems",
  "/games-of-the-week",
  "/games-like",
  "/how-it-works",
  "/upgrade",
  "/about",
  "/contact",
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
  "/disclaimer",
  "/affiliate-disclosure",
  "/refund-policy",
] as const;

export function getCuratedCollectionPaths(): string[] {
  return CURATED_COLLECTIONS.map((c) => collectionPath(c.slug));
}

/** Public feature explanation pages under /how-it-works. */
export function getHowItWorksPaths(): string[] {
  return getHowItWorksSlugs().map((slug) => `/how-it-works/${slug}`);
}

/** Unique game detail paths aligned with `gameDetailPath()` (lowercase slug). */
export function getIndexableGamePaths(): string[] {
  const titles = new Set<string>();
  for (const game of DIRECTORY_GAMES) {
    titles.add(game.title.trim());
  }
  for (const collection of CURATED_COLLECTIONS) {
    for (const game of collection.games) {
      titles.add(game.title.trim());
    }
  }
  const paths = [...titles]
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
    .map((title) => gameDetailPath(title));
  // Different title spellings (e.g. "DREDGE" vs "Dredge") slugify to the same
  // path — dedupe on the final path so a game appears once in the sitemap.
  return [...new Set(paths)];
}

export function getAllSitemapPaths(): string[] {
  // Final safety net: collapse any duplicate URL across all path sources.
  return [
    ...new Set([
      ...STATIC_PUBLIC_PATHS,
      ...getHowItWorksPaths(),
      ...getCuratedCollectionPaths(),
      ...getDiscoveryHubPaths(),
      ...getIndexableGamePaths(),
    ]),
  ];
}
