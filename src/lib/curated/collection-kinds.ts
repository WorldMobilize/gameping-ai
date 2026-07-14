import type { HubKind } from "@/lib/seo/discovery-hubs";

/**
 * The two collection families live at URLs that say what they are.
 *
 *   games-like-hades      →  /games-like/hades
 *   best-cozy-games       →  /collections/best-cozy-games
 *
 * The slug in the data keeps its "games-like-" prefix; only the URL drops it,
 * because /games-like/games-like-hades would be absurd.
 */
export const GAMES_LIKE_INDEX = "/games-like";
export const COLLECTIONS_INDEX = "/collections";

const GAMES_LIKE_PREFIX = "games-like-";

export function isGamesLikeSlug(slug: string): boolean {
  return slug.startsWith(GAMES_LIKE_PREFIX);
}

/** Data slug → the URL it is served at. Single source of truth for links. */
export function collectionPath(slug: string): string {
  return isGamesLikeSlug(slug)
    ? `${GAMES_LIKE_INDEX}/${slug.slice(GAMES_LIKE_PREFIX.length)}`
    : `${COLLECTIONS_INDEX}/${slug}`;
}

/** URL segment → data slug (the inverse, for the /games-like/[slug] route). */
export function gamesLikeSlugFromParam(param: string): string {
  return `${GAMES_LIKE_PREFIX}${param}`;
}

/**
 * Which /browse section each themed curated collection belongs to.
 *
 * These lists were already used to group the old /curated index; they moved here
 * when the themed collections did, so /browse can slot them into the same
 * Best / Genres / By Mood sections as the SEO hubs instead of dumping them in a
 * separate pile. "games-like-*" collections are not here — they live on /curated.
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

/**
 * Returns the section a collection belongs to, or null for "games like X"
 * (which belongs on /curated, not here). Anything unrecognised falls back to
 * "best" so a new collection is never silently dropped from the page.
 */
export function curatedCollectionKind(slug: string): HubKind | null {
  if (slug.startsWith("games-like-")) return null;
  if (MOOD_SLUGS.has(slug)) return "mood";
  if (GENRE_SLUGS.has(slug)) return "genre";
  return "best";
}
