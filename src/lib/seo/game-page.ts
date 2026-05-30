import {
  CURATED_COLLECTIONS,
  type CuratedCollection,
} from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export type GameBreadcrumbItem = {
  label: string;
  href?: string;
};

export function titleCaseFromSlug(slug: string): string {
  return slug
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase();
}

export function findDirectoryGameImage(gameName: string): string | null {
  const key = normalizeTitleKey(gameName);
  const pick = DIRECTORY_GAMES.find((g) => normalizeTitleKey(g.title) === key);
  return pick?.image?.trim() || null;
}

export function buildGamePageMetadata(
  gameName: string,
  titleFromSlug: string,
  options?: { ogImage?: string | null }
) {
  const name = gameName.trim() || titleCaseFromSlug(titleFromSlug);
  const path = gameDetailPath(titleFromSlug);
  const ogImage =
    options?.ogImage?.trim() ||
    findDirectoryGameImage(name) ||
    undefined;

  return buildPublicPageMetadata({
    title: `${name} Deals, Prices & Similar Games | GamePing AI`,
    description: `Compare verified ${name} deals, track price drops, and discover games similar to ${name} with AI-powered recommendations on GamePing AI.`,
    path,
    ogImage,
  });
}

export function findCuratedCollectionSlugForGame(gameName: string): string | null {
  return findCuratedCollectionsForGame(gameName)[0]?.slug ?? null;
}

/** All curated lists that include this game (catalog order). */
export function findCuratedCollectionsForGame(
  gameName: string
): CuratedCollection[] {
  const key = normalizeTitleKey(gameName);
  return CURATED_COLLECTIONS.filter((collection) =>
    collection.games.some((g) => normalizeTitleKey(g.title) === key)
  );
}

/** Prefer curated parent when the game appears in a collection. */
export function buildGameBreadcrumbs(
  gameName: string,
  collections?: CuratedCollection[]
): GameBreadcrumbItem[] {
  const name = gameName.trim() || "Game";
  const containing = collections ?? findCuratedCollectionsForGame(name);
  const primary = containing[0];

  if (primary) {
    return [
      { label: "Home", href: "/" },
      { label: "Curated", href: "/curated" },
      { label: primary.h1, href: `/curated/${primary.slug}` },
      { label: name },
    ];
  }

  return [
    { label: "Home", href: "/" },
    { label: "Games", href: "/games" },
    { label: name },
  ];
}

function genreOverlapScore(tagOrLabel: string, genres: string[]): number {
  const blob = tagOrLabel.toLowerCase();
  let score = 0;
  for (const genre of genres) {
    const g = genre.toLowerCase().trim();
    if (!g) continue;
    if (blob.includes(g)) {
      score += 2;
      continue;
    }
    const token = g.split(/[\s-]+/)[0];
    if (token.length > 3 && blob.includes(token)) score += 1;
  }
  return score;
}

/** Contextual related titles: curated siblings → genre overlap → directory fallback. */
export function getSemanticRelatedGames(input: {
  currentTitle: string;
  genreNames?: string[];
  limit?: number;
}): { title: string }[] {
  const limit = input.limit ?? 4;
  const currentKey = normalizeTitleKey(input.currentTitle);
  const seen = new Set<string>([currentKey]);
  const result: { title: string }[] = [];

  const add = (title: string) => {
    const key = normalizeTitleKey(title);
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ title: title.trim() });
  };

  for (const collection of findCuratedCollectionsForGame(input.currentTitle)) {
    for (const game of collection.games) {
      if (result.length >= limit) return result.slice(0, limit);
      add(game.title);
    }
  }

  const genres = (input.genreNames ?? [])
    .map((g) => g.trim())
    .filter(Boolean);

  if (genres.length > 0 && result.length < limit) {
    const candidates = new Map<string, { title: string; score: number }>();

    for (const pick of DIRECTORY_GAMES) {
      const score = genreOverlapScore(pick.tag, genres);
      if (score > 0) {
        candidates.set(pick.title, { title: pick.title, score });
      }
    }

    for (const collection of CURATED_COLLECTIONS) {
      for (const game of collection.games) {
        const score = Math.max(
          genreOverlapScore(game.whyItFits, genres),
          genreOverlapScore(collection.h1, genres)
        );
        if (score > 0) {
          const prev = candidates.get(game.title);
          if (!prev || score > prev.score) {
            candidates.set(game.title, { title: game.title, score });
          }
        }
      }
    }

    const ranked = [...candidates.values()].sort(
      (a, b) =>
        b.score - a.score ||
        a.title.localeCompare(b.title, "en", { sensitivity: "base" })
    );

    for (const candidate of ranked) {
      if (result.length >= limit) break;
      add(candidate.title);
    }
  }

  for (const pick of DIRECTORY_GAMES) {
    if (result.length >= limit) break;
    add(pick.title);
  }

  return result.slice(0, limit);
}

/** @deprecated Use getSemanticRelatedGames */
export function getRelatedDirectoryGames(currentTitle: string, limit = 4) {
  return getSemanticRelatedGames({ currentTitle, limit });
}
