import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export function titleCaseFromSlug(slug: string): string {
  return slug
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function buildGamePageMetadata(gameName: string, titleFromSlug: string) {
  const name = gameName.trim() || titleCaseFromSlug(titleFromSlug);
  const path = gameDetailPath(titleFromSlug);

  return buildPublicPageMetadata({
    title: `${name} Deals, Prices & Similar Games | GamePing AI`,
    description: `Compare verified ${name} deals, track price drops, and discover games similar to ${name} with AI-powered recommendations on GamePing AI.`,
    path,
  });
}

export function findCuratedCollectionSlugForGame(gameName: string): string | null {
  const key = gameName.trim().toLowerCase();
  for (const collection of CURATED_COLLECTIONS) {
    if (collection.games.some((g) => g.title.trim().toLowerCase() === key)) {
      return collection.slug;
    }
  }
  return null;
}

/** Lightweight related picks for internal links (same directory, exclude current title). */
export function getRelatedDirectoryGames(currentTitle: string, limit = 4) {
  const key = currentTitle.trim().toLowerCase();
  return DIRECTORY_GAMES.filter((g) => g.title.trim().toLowerCase() !== key).slice(
    0,
    limit
  );
}
