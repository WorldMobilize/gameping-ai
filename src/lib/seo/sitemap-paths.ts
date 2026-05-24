import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";

/** Static public routes (no query strings). */
export const STATIC_PUBLIC_PATHS = [
  "/",
  "/recommend",
  "/games",
  "/curated",
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
  return CURATED_COLLECTIONS.map((c) => `/curated/${c.slug}`);
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
  return [...titles]
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
    .map((title) => gameDetailPath(title));
}

export function getAllSitemapPaths(): string[] {
  return [
    ...STATIC_PUBLIC_PATHS,
    ...getCuratedCollectionPaths(),
    ...getIndexableGamePaths(),
  ];
}
