import { collectionPath } from "@/lib/curated/collection-kinds";
import {
  rankGamesByScore,
  type CollectionStats,
} from "@/lib/curated/collection-game-stats";
import type { CuratedCollection } from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * `ItemList` JSON-LD for a curated collection — the shape Google expects from a
 * ranked "games like X" list, and what earns the carousel/list treatment in
 * search results. Mirrors what is actually on the page: same order, same games.
 *
 * Ratings only when RAWG gave us one. An AggregateRating without a real rating
 * count is invalid structured data, so a missing count means no rating at all —
 * never a placeholder.
 */
export default function CollectionStructuredData({
  collection,
  stats,
}: {
  collection: CuratedCollection;
  stats: CollectionStats;
}) {
  // Same order as the page. A JSON-LD list that ranks the games differently from
  // what the visitor sees is a mismatch Google is entitled to distrust.
  const games = rankGamesByScore(collection.games, stats);

  const graph = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.h1,
    description: collection.intro,
    url: absoluteUrl(collectionPath(collection.slug)),
    numberOfItems: games.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: games.map((game, i) => {
      const stat = stats.byTitle[game.title];

      const videoGame: Record<string, unknown> = {
        "@type": "VideoGame",
        name: game.title,
        url: absoluteUrl(gameDetailPath(game.title)),
        image: game.image,
        description: game.whyItFits,
      };

      if (stat?.genres.length) videoGame.genre = stat.genres;

      if (stat?.rating && stat.ratingsCount) {
        videoGame.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number(stat.rating.toFixed(2)),
          bestRating: 5,
          worstRating: 1,
          ratingCount: stat.ratingsCount,
        };
      }

      return {
        "@type": "ListItem",
        position: i + 1,
        item: videoGame,
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
