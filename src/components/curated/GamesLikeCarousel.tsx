import Image from "next/image";
import Link from "next/link";
import { collectionPath } from "@/lib/curated/collection-kinds";
import type { CollectionSubjectArt } from "@/lib/curated/collection-game-stats";
import type { CuratedCollection } from "@/lib/curated/collections";

/**
 * Self-scrolling rail of OTHER "games like X" lists. Themed collections (cozy,
 * best-of, by mood) are deliberately excluded — they belong on /collections.
 *
 * The motion is a pure-CSS marquee (see `.gp-marquee` in globals.css): the cards
 * are rendered twice and the track slides by -50%, which lands on an identical
 * copy so the loop never visibly jumps. It pauses on hover and on focus, and
 * reduced-motion users get a plain scrollable rail instead.
 *
 * Consequence worth having: no state, no timers, no client JS — this stays a
 * server component.
 *
 * Each card shows the game the list STARTS FROM (Disco Elysium on the "Games like
 * Disco Elysium" card), not the first game inside it, which is what the title
 * promises.
 */

const CARD =
  "group flex h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-border)] hover:shadow-[0_14px_36px_-16px_var(--page-accent-glow)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-[color:var(--page-accent-border)]";

function Card({
  collection,
  art,
  clone,
}: {
  collection: CuratedCollection;
  art: CollectionSubjectArt | undefined;
  /** The duplicated half exists only to make the loop seamless — hide it from
      screen readers and from the tab order so every list is announced once. */
  clone?: boolean;
}) {
  // RAWG key art for the subject game; the first pick's Steam header only as a
  // fallback, so a card is never blank.
  const image = art?.image ?? collection.games[0]?.image;
  if (!image) return null;

  return (
    // Spacing lives on the item (`pr-4`), NOT as a `gap` on the track: with a gap
    // there are 2N-1 gaps for 2N cards, so the two halves differ by one gap and
    // translateX(-50%) lands a few pixels off, which shows up as a jump every
    // loop. Per-item padding makes every card an identical block.
    <li className="flex pr-4" aria-hidden={clone || undefined}>
      <Link
        href={collectionPath(collection.slug)}
        className={CARD}
        tabIndex={clone ? -1 : undefined}
      >
        {/* 3:2 — RAWG key art is landscape and busy; a taller frame lets
            object-cover keep the subject instead of shaving it to a strip. */}
        <span className="relative block aspect-[3/2] w-full overflow-hidden bg-[#080a14]">
          {/* No hover zoom here: the rail is already sliding, so a card that also
              scales under the cursor reads as two competing motions. */}
          <Image
            src={image}
            alt={art?.title && !clone ? `${art.title} key art` : ""}
            fill
            sizes="260px"
            className="object-cover object-center"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f]/80 via-[#05060f]/10 to-transparent"
          />
        </span>

        <span className="flex flex-1 flex-col justify-center gap-1 p-5">
          <span className="text-base font-bold leading-6 text-slate-900 dark:text-white">
            {collection.h1}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {collection.games.length} games
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function GamesLikeCarousel({
  collections,
  subjectArt,
}: {
  collections: CuratedCollection[];
  subjectArt: Record<string, CollectionSubjectArt>;
}) {
  if (collections.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">
        More “games like…” lists
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Start from another game you love.
      </p>

      {/* Full-bleed: the rail runs past the section padding, so cards slide in and
          out of the page edges instead of stopping short of them. */}
      <div className="gp-marquee gp-no-scrollbar mt-6 -mx-6">
        <ul className="gp-marquee-track py-2">
          {collections.map((c) => (
            <Card key={c.slug} collection={c} art={subjectArt[c.slug]} />
          ))}
          {collections.map((c) => (
            <Card
              key={`clone-${c.slug}`}
              collection={c}
              art={subjectArt[c.slug]}
              clone
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
