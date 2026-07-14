import { notFound } from "next/navigation";
import GamesLikeShowcaseView from "@/components/curated/GamesLikeShowcaseView";
import {
  collectionPath,
  gamesLikeSlugFromParam,
  isGamesLikeSlug,
} from "@/lib/curated/collection-kinds";
import {
  loadCollectionStats,
  loadCollectionSubjectArt,
} from "@/lib/curated/collection-game-stats";
import {
  getAllCollectionSlugs,
  getCollectionBySlug,
  getRelatedGamesLike,
} from "@/lib/curated/collections";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

/** /games-like/hades → the "games-like-hades" collection. */
export function generateStaticParams() {
  return getAllCollectionSlugs()
    .filter(isGamesLikeSlug)
    .map((slug) => ({ slug: slug.replace(/^games-like-/, "") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(gamesLikeSlugFromParam(slug));
  if (!collection) return { title: "Games like… | GamePing AI" };
  return buildPublicPageMetadata({
    title: collection.seoTitle,
    description: collection.metaDescription,
    path: collectionPath(collection.slug),
  });
}

export default async function GamesLikePage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollectionBySlug(gamesLikeSlugFromParam(slug));
  if (!collection) notFound();

  // The showcase carousel shows other "games like" lists only — themed
  // collections stay on /collections, where they get their own treatment.
  const related = getRelatedGamesLike(collection.slug);

  const [stats, relatedArt] = await Promise.all([
    loadCollectionStats(collection),
    loadCollectionSubjectArt(related),
  ]);

  return (
    <GamesLikeShowcaseView
      collection={collection}
      others={related}
      stats={stats}
      relatedArt={relatedArt}
    />
  );
}
