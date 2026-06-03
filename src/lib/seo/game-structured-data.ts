import { absoluteUrl } from "@/lib/seo/site";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

export type GameStructuredDataInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  genres?: string[];
  developers?: string[];
  publishers?: string[];
  released?: string | null;
  rating?: number | null;
  /** RAWG ratings_count (or equivalent) — required for valid AggregateRating in JSON-LD. */
  ratingCount?: number | null;
  platforms?: string[];
  path: string;
  breadcrumbs: GameBreadcrumbItem[];
  offer?: {
    price: number;
    priceCurrency: string;
  } | null;
};

/** Sources that may carry a RAWG-style rating count (no invented defaults). */
export type RatingCountSource = {
  ratingCount?: number | null;
  ratings_count?: number | null;
  ratingsCount?: number | null;
  reviews_count?: number | null;
};

export function resolveSchemaRatingCount(
  source: RatingCountSource | null | undefined
): number | null {
  if (!source) return null;
  const candidates = [
    source.ratingCount,
    source.ratings_count,
    source.ratingsCount,
    source.reviews_count,
  ];
  for (const value of candidates) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      continue;
    }
    const count = Math.floor(value);
    if (count > 0) return count;
  }
  return null;
}

export function buildAggregateRatingJsonLd(
  ratingValue: number,
  ratingCount: number
): Record<string, unknown> {
  return {
    "@type": "AggregateRating",
    ratingValue,
    ratingCount,
    bestRating: 5,
    worstRating: 0,
  };
}

function stripDescription(text: string, max = 500): string {
  const cleaned = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.length > max ? `${cleaned.slice(0, max).trim()}…` : cleaned;
}

export function buildBreadcrumbListJsonLd(items: GameBreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
      };
      if (item.href) {
        entry.item = absoluteUrl(item.href);
      }
      return entry;
    }),
  };
}

export function buildVideoGameJsonLd(input: GameStructuredDataInput) {
  const game: Record<string, unknown> = {
    "@type": "VideoGame",
    "@id": `${absoluteUrl(input.path)}#videogame`,
    name: input.name,
    url: absoluteUrl(input.path),
  };

  if (input.description) {
    const desc = stripDescription(input.description);
    if (desc) game.description = desc;
  }

  if (input.image?.trim()) {
    game.image = input.image.trim();
  }

  if (input.genres?.length) {
    game.genre = input.genres;
  }

  if (input.developers?.length) {
    game.author = input.developers.map((name) => ({
      "@type": "Organization",
      name,
    }));
  }

  if (input.publishers?.length) {
    game.publisher = input.publishers.map((name) => ({
      "@type": "Organization",
      name,
    }));
  }

  if (input.released?.trim()) {
    game.datePublished = input.released.trim();
  }

  const ratingValue =
    input.rating != null &&
    Number.isFinite(input.rating) &&
    input.rating > 0
      ? input.rating
      : null;
  const ratingCount = resolveSchemaRatingCount({
    ratingCount: input.ratingCount,
  });

  if (ratingValue != null && ratingCount != null) {
    game.aggregateRating = buildAggregateRatingJsonLd(ratingValue, ratingCount);
  }

  if (input.platforms?.length) {
    game.gamePlatform = input.platforms;
  }

  if (
    input.offer &&
    Number.isFinite(input.offer.price) &&
    input.offer.priceCurrency?.trim()
  ) {
    game.offers = {
      "@type": "Offer",
      price: input.offer.price,
      priceCurrency: input.offer.priceCurrency.trim().toUpperCase(),
      availability: "https://schema.org/InStock",
      url: absoluteUrl(input.path),
    };
  }

  return game;
}

export function buildGameStructuredDataGraph(input: GameStructuredDataInput) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildBreadcrumbListJsonLd(input.breadcrumbs),
      buildVideoGameJsonLd(input),
    ],
  };
}
