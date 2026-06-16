import Link from "next/link";
import CuratedGameArt from "@/components/CuratedGameArt";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD_INTERACTIVE_LG,
  APP_INLINE_LINK,
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  CURATED_COLLECTIONS,
  getAllCollectionSlugs,
  getCollectionBySlug,
} from "@/lib/curated/collections";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllCollectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) {
    return { title: "Collection | GamePing AI" };
  }
  return buildPublicPageMetadata({
    title: collection.seoTitle,
    description: collection.metaDescription,
    path: `/curated/${collection.slug}`,
  });
}

export default async function CuratedCollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();

  const others = CURATED_COLLECTIONS.filter((c) => c.slug !== slug).slice(0, 4);

  return (
    <AppPageShell>
      <article>
        <AppSection maxWidth="max-w-3xl">
          <p className={APP_KICKER}>Curated collection</p>
          <h1 className={APP_PAGE_TITLE}>{collection.h1}</h1>

          <p className={APP_PAGE_LEAD}>{collection.intro}</p>

          <p className="mt-6 text-sm leading-7 text-slate-600">
            For recommendations shaped to your budget, platform, and mood, use{" "}
            <Link href="/recommend" className={APP_INLINE_LINK}>
              GamePing AI recommendations
            </Link>
            . You can also browse our{" "}
            <Link href="/games" className={APP_INLINE_LINK}>
              games directory (A–Z)
            </Link>{" "}
            or return to the{" "}
            <Link href="/curated" className={APP_INLINE_LINK}>
              full list of collections
            </Link>
            .
          </p>

          <div className="mt-10 rounded-3xl border border-cyan-200/80 bg-cyan-50/60 p-6">
            <p className="text-sm font-bold text-slate-800">Try your own recommendation</p>
            <Link href="/recommend" className={`mt-3 inline-flex ${APP_PRIMARY_CTA_SM}`}>
              Open GamePing AI
            </Link>
          </div>
        </AppSection>

        <AppSection maxWidth="max-w-5xl" className="pt-0">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Games in this angle</h2>
          <p className="mt-2 text-sm text-slate-500">
            Each entry explains why it fits this collection—tap through to the game page when
            available.
          </p>

          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {collection.games.map((game) => (
              <li
                key={game.title}
                className={`group flex flex-col overflow-hidden ${APP_CARD_INTERACTIVE_LG} p-0 hover:-translate-y-0.5`}
              >
                <CuratedGameArt
                  src={game.image}
                  alt={`${game.title} header art`}
                  sizes="(max-width: 768px) 100vw, 520px"
                  variant="carousel"
                />

                <div className="flex flex-1 flex-col justify-center p-6">
                  <h3 className="text-lg font-bold text-slate-900">{game.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{game.whyItFits}</p>
                  <Link
                    href={gameDetailPath(game.title)}
                    className={`mt-4 inline-flex w-fit ${APP_SECONDARY_CTA}`}
                  >
                    View game details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </AppSection>

        {others.length > 0 ? (
          <AppSection maxWidth="max-w-5xl" className="border-t border-slate-200/90 pt-12">
            <h2 className="text-xl font-bold text-slate-900">More curated pages</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/curated/${c.slug}`}
                    className="inline-flex rounded-full border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300/70 hover:text-cyan-800"
                  >
                    {c.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </AppSection>
        ) : null}
      </article>
    </AppPageShell>
  );
}
