import { notFound } from "next/navigation";
import CollectionDetailView from "@/components/curated/CollectionDetailView";
import { collectionPath, isGamesLikeSlug } from "@/lib/curated/collection-kinds";
import {
  getAllCollectionSlugs,
  getCollectionBySlug,
  getRelatedCollections,
} from "@/lib/curated/collections";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

/** Themed collections only — "games like X" is served from /games-like. */
export function generateStaticParams() {
  return getAllCollectionSlugs()
    .filter((slug) => !isGamesLikeSlug(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection || isGamesLikeSlug(slug)) {
    return { title: "Collection | GamePing AI" };
  }
  return buildPublicPageMetadata({
    title: collection.seoTitle,
    description: collection.metaDescription,
    path: collectionPath(collection.slug),
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  // A "games like" slug reaching this route would be a duplicate URL for the
  // same content — it belongs to /games-like only.
  if (!collection || isGamesLikeSlug(slug)) notFound();

  return (
    <CollectionDetailView collection={collection} others={getRelatedCollections(slug)} />
  );
}
