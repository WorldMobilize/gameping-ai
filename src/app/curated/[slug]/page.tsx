import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  CURATED_COLLECTIONS,
  getAllCollectionSlugs,
  getCollectionBySlug,
} from "@/lib/curated/collections";
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
  return {
    title: collection.seoTitle,
    description: collection.metaDescription,
    openGraph: {
      title: collection.seoTitle,
      description: collection.metaDescription,
    },
  };
}

export default async function CuratedCollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();

  const others = CURATED_COLLECTIONS.filter((c) => c.slug !== slug).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <article className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Curated collection
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">{collection.h1}</h1>

          <p className="mt-6 text-lg leading-8 text-white/65">{collection.intro}</p>

          <p className="mt-6 text-sm leading-7 text-white/55">
            For recommendations shaped to your budget, platform, and mood, use{" "}
            <Link href="/recommend" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              GamePing AI recommendations
            </Link>
            . You can also browse our{" "}
            <Link href="/games" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              games directory (A–Z)
            </Link>{" "}
            or return to the{" "}
            <Link href="/curated" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              full list of collections
            </Link>
            .
          </p>

          <div className="mt-10 rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-6">
            <p className="text-sm font-bold text-cyan-100">Try your own recommendation</p>
            <Link
              href="/recommend"
              className="mt-3 inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
            >
              Open GamePing AI →
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-14 max-w-5xl">
          <h2 className="text-xl font-black md:text-2xl">Games in this angle</h2>
          <p className="mt-2 text-sm text-white/50">
            Each entry explains why it fits this collection—tap through to the game page when
            available.
          </p>

          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {collection.games.map((game) => (
              <li
                key={game.title}
                className="flex flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] md:flex-row"
              >
                <div className="relative aspect-[460/215] w-full shrink-0 overflow-hidden bg-black/30 md:w-[min(240px,40%)] md:aspect-auto md:min-h-[200px]">
                  <Image
                    src={game.image}
                    alt={`${game.title} header art`}
                    fill
                    sizes="(max-width: 768px) 100vw, 240px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05060f]/80 to-transparent md:bg-gradient-to-r" />
                </div>

                <div className="flex flex-1 flex-col justify-center p-6">
                  <h3 className="text-lg font-black">{game.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{game.whyItFits}</p>
                  <Link
                    href={gameDetailPath(game.title)}
                    className="mt-4 inline-flex w-fit rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-200 transition hover:border-cyan-400/50 hover:bg-white/10"
                  >
                    View game details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {others.length > 0 && (
          <div className="relative z-10 mx-auto mt-16 max-w-5xl border-t border-white/10 pt-12">
            <h2 className="text-xl font-black">More curated pages</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/curated/${c.slug}`}
                    className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    {c.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </main>
  );
}
