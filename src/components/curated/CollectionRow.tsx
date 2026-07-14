"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * One "Netflix" row: a title, and a rail of cards you scroll sideways.
 *
 * The rail is a real scroll container (snap + touch + keyboard), so it works with
 * no JS at all; the arrow buttons are an enhancement on top and hide themselves
 * when there is nothing to scroll to. Deliberately NOT the marquee used on the
 * collection detail page — a rail that moves on its own is unreadable when the row
 * is something you are meant to browse rather than glance at.
 */

export type RowCard = {
  slug: string;
  path: string;
  /** The game the list starts from, or the themed collection's own title. */
  title: string;
  intro?: string;
  gameCount: number;
  image: string | null;
  /** "Games like" — omitted for themed collections, which are not "like" anything. */
  label?: string;
};

const ARROW =
  "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-text)] disabled:pointer-events-none disabled:opacity-30 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300";

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={back ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/**
 * The lead card carries NO text over its art — laid over busy key art the label was
 * unreadable, and dimming the art enough to fix that would defeat the point of a
 * showcase row. So the art stays clean and the words move underneath it, where they
 * sit on the page background and are actually legible.
 *
 * The standard cards keep the overlay: they are small, the caption is two short
 * lines, and a text block under every one of them would double the height of a row
 * you are meant to skim.
 */
function Card({ card, size }: { card: RowCard; size: "lead" | "standard" }) {
  const lead = size === "lead";

  return (
    <li
      className={`snap-start ${lead ? "w-[280px] sm:w-[320px]" : "w-[210px] sm:w-[240px]"} shrink-0`}
    >
      <Link href={card.path} className="group block">
        <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200/90 bg-[#080a14] shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-[color:var(--page-accent-border)] group-hover:shadow-[0_14px_36px_-16px_var(--page-accent-glow)] dark:border-slate-800/80">
          {card.image ? (
            <Image
              src={card.image}
              alt={`${card.title} key art`}
              fill
              sizes={lead ? "320px" : "240px"}
              className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
            />
          ) : null}

          {!lead ? (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/45 to-transparent"
              />

              <span className="absolute inset-x-0 bottom-0 p-4">
                {card.label ? (
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    {card.label}
                  </span>
                ) : null}

                <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-white">
                  {card.title}
                </h3>

                <span className="mt-1 block text-[11px] font-medium text-white/55">
                  {card.gameCount} games
                </span>
              </span>
            </>
          ) : null}
        </span>

        {lead ? (
          <span className="mt-3 block">
            <h3 className="text-base font-extrabold leading-tight text-slate-900 dark:text-white">
              {card.title}
            </h3>
            <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {card.gameCount} games
            </span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export default function CollectionRow({
  id,
  title,
  blurb,
  cards,
  size = "standard",
  viewAllHref,
}: {
  id: string;
  title: string;
  blurb?: string;
  cards: RowCard[];
  size?: "lead" | "standard";
  viewAllHref?: string;
}) {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    // 2px of slack: sub-pixel scroll widths mean the end is never exactly equal.
    const max = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync, cards]);

  /* Scroll by most of a viewport rather than a fixed card count, so the step is
     right on a phone and on a wide desktop alike. */
  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: "smooth" });
  };

  if (cards.length === 0) return null;

  const scrollable = !(atStart && atEnd);

  return (
    <section aria-labelledby={id} className="mt-12 first:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={id}
            className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl gp-home-display"
          >
            {title}
          </h2>
          {blurb ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{blurb}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-sm font-bold text-[color:var(--page-accent-text)] underline-offset-4 hover:underline"
            >
              View all
            </Link>
          ) : null}

          {/* Hidden entirely when the row fits — an arrow that cannot move is noise. */}
          {scrollable ? (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                disabled={atStart}
                aria-label={`Scroll ${title} left`}
                className={ARROW}
              >
                <Chevron back />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                disabled={atEnd}
                aria-label={`Scroll ${title} right`}
                className={ARROW}
              >
                <Chevron />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Full-bleed rail: cards run out to the page edges instead of stopping short
          of them, so a row that continues LOOKS like it continues. The padding puts
          the first card back in line with the heading above it. */}
      <ul
        ref={railRef}
        onScroll={sync}
        className="gp-no-scrollbar -mx-6 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 py-2"
      >
        {cards.map((card) => (
          <Card key={`${id}-${card.slug}`} card={card} size={size} />
        ))}
      </ul>
    </section>
  );
}
