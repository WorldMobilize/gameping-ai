"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import { AppSection } from "@/components/app/AppPageShell";
import { APP_PRIMARY_CTA_ACCENT_SM } from "@/components/app/app-styles";
import CollectionRow, { type RowCard } from "@/components/curated/CollectionRow";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

/**
 * The /games-like hub: a hero you land on, then a stack of category rows you
 * browse — one rail per category, a list may sit in several of them.
 *
 * Client-side because the hero search filters the lists in place. There are only
 * ~17 of them, so the whole set ships with the page and typing costs no request.
 *
 * Everything here is real: counts come from the data, art is the RAWG key art of
 * the game each list starts FROM, and the rows are editorial groupings (see
 * lib/curated/games-like-categories.ts). No row claims to be "trending" or "most
 * popular" — we have no traffic data that would make either word true.
 */

export type GamesLikeCard = RowCard & { intro: string };

export type CategoryRow = {
  id: string;
  label: string;
  blurb: string;
  cards: GamesLikeCard[];
  /** "lead" = bigger cards. The page decides which row (if any) gets the weight. */
  size?: "lead" | "standard";
};

export type HubChip = {
  label: string;
  href: string;
};

const BREADCRUMBS: GameBreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Games like…" },
];

const CHIP =
  "inline-flex items-center rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-text)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300";

/** Plain UI chrome, not brand iconography — those icons are still pending. */
function Magnifier() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * The wall of key art beside the hero.
 *
 * It is a MOSAIC, not a fan of loose cards: a dense grid of covers, every tile
 * sharing one tilt, turned away from the reader in 3D and bleeding off the top and
 * right of the page. Tiles at different angles with big drop shadows read as
 * stickers scattered on glass; one rotated plane reads as a wall you are standing
 * beside, which is the thing the reference is doing.
 *
 * Three pieces make it work, and removing any one of them collapses the effect:
 *   - `preserve-3d` on the plane, or the children's depth is flattened away.
 *   - `scale` on the plane, or rotating it exposes empty corners inside the frame.
 *   - the mask, or the mosaic ends in a hard diagonal edge over the headline
 *     instead of dissolving into the page.
 */
/**
 * Portrait covers in staggered columns, not a grid of landscape cells: posters read
 * as game covers, and the stagger is what lets neighbours overlap instead of butting
 * up against each other in tidy rows.
 *
 * `z` is depth on the tilted plane. One card (`lead`) is pushed well forward so the
 * wall has a subject — without it, twelve equal covers give the eye nowhere to land.
 * Percentages are of the plane, which is intentionally larger than the hero band, so
 * slots outside 0–100 are meant to be clipped: the wall continues past the screen.
 */
type CollageSlot = {
  left: number;
  top: number;
  width: number;
  z: number;
  lead?: boolean;
};

/** Card width, as a % of the plane. Smaller = more covers, denser wall. */
const TILE_WIDTH = 14;
/** Vertical step between the covers in one column. Below the card's own height, so
 *  neighbours overlap instead of stacking with a seam between them. */
const ROW_STEP = 34;
const ROWS_PER_COLUMN = 4;

/**
 * Columns of the wall, left to right. `offset` staggers a column against its
 * neighbours (that is what stops the covers lining up into visible rows), and `z`
 * is the depth the whole column sits at.
 *
 * The last column is half off-screen on purpose, and the first is mostly eaten by
 * the mask — the wall has to look like it continues past both edges.
 */
const COLLAGE_COLUMNS = [
  { left: -3, offset: -20, z: -80 },
  { left: 9.5, offset: 2, z: -55 },
  { left: 22, offset: -12, z: -25 },
  { left: 34.5, offset: 8, z: 20 },
  { left: 47, offset: -8, z: -15 },
  { left: 59.5, offset: 10, z: -45 },
  { left: 72, offset: -6, z: -70 },
  { left: 84.5, offset: 14, z: -90 },
];

/** The one cover that comes forward — the wall needs a subject to land the eye on. */
const LEAD_COLUMN = 3;
const LEAD_ROW = 1;

const COLLAGE_SLOTS: CollageSlot[] = COLLAGE_COLUMNS.flatMap((column, columnIndex) =>
  Array.from({ length: ROWS_PER_COLUMN }, (_, row): CollageSlot => {
    const isLead = columnIndex === LEAD_COLUMN && row === LEAD_ROW;

    return {
      left: isLead ? column.left - 3 : column.left,
      top: column.offset + row * ROW_STEP,
      width: isLead ? 20 : TILE_WIDTH,
      z: isLead ? 140 : column.z,
      lead: isLead || undefined,
    };
  })
);

function HeroCollage({ cards }: { cards: RowCard[] }) {
  const art = cards.filter((c) => c.image).slice(0, COLLAGE_SLOTS.length);
  if (art.length < 3) return null;

  /* The foreground slot gets the FIRST cover — the editor's picks lead the list, so
     the card the eye lands on is one we actually chose. The rest fill the wall in
     order behind it. */
  const [first, ...others] = art;
  const queue = [...others];

  const placed = COLLAGE_SLOTS.slice(0, art.length).map((slot) => ({
    slot,
    card: slot.lead ? first : (queue.shift() as RowCard),
  }));

  return (
    // Pinned to the RIGHT EDGE OF THE VIEWPORT, not to the text column: the hero
    // band is full-width, so `right-0` here is the screen. It is also taller than
    // the band and clipped by it, which is what lets the wall run off the top and
    // bottom instead of ending inside the frame.
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[56%] [perspective:1800px] [perspective-origin:100%_50%] lg:block xl:w-[54%]"
    >
      <div
        className="
          absolute -inset-y-[18%] -right-[14%] left-[-6%]
          [transform-style:preserve-3d]
          [transform:rotateX(3deg)_rotateY(-13deg)_rotateZ(8deg)_scale(1.12)]
          [mask-image:linear-gradient(to_right,transparent_0%,black_34%)]
          [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_34%)]
        "
      >
        {placed.map(({ slot, card }) => (
          <span
            key={card.slug}
            style={{
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              width: `${slot.width}%`,
              transform: `translateZ(${slot.z}px)`,
            }}
            className={`absolute aspect-[2/3] overflow-hidden rounded-xl border bg-[#080a14] ${
              slot.lead
                ? "z-10 border-white/25 shadow-[0_50px_100px_-30px_rgba(2,6,23,0.95)]"
                : "border-white/10"
            }`}
          >
            {/* `sizes` is deliberately ~3x the rendered width. RAWG art is 16:9 and
                this frame is 2:3, so object-cover keeps only a narrow vertical strip
                of it — Next must be asked for a file wide enough that the STRIP is
                sharp, not one that merely matches the card's width. Quoting the card
                width here is exactly what made these covers look soft. */}
            <Image
              src={card.image as string}
              alt=""
              fill
              priority={slot.lead}
              sizes={slot.lead ? "800px" : "560px"}
              className="object-cover object-center"
            />
            {/* Depth you can see: the further back a cover sits, the more of the
                page's dark it takes on. Without this the covers overlap but do not
                recede — they just look like stickers on the same sheet of glass. */}
            <span
              className="pointer-events-none absolute inset-0 bg-[#05060f]"
              style={{ opacity: slot.lead ? 0 : slot.z < 0 ? 0.45 : 0.25 }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 dark:border-slate-800/80 dark:bg-slate-900/70">
      <p className="text-xl font-extrabold leading-tight text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function GamesLikeHubView({
  heroCards,
  rows,
  themes,
  hubs,
  totalLists,
  totalGames,
}: {
  /** The faces in the hero collage — the editor's picks, as chosen by the page. */
  heroCards: GamesLikeCard[];
  /** Every row, in the order they should appear. The page owns that order. */
  rows: CategoryRow[];
  themes: RowCard[];
  hubs: HubChip[];
  totalLists: number;
  totalGames: number;
}) {
  const [query, setQuery] = useState("");

  /* Every list, once — a list sits in several rows, so the rows are not a set. */
  const all = useMemo(() => {
    const bySlug = new Map<string, GamesLikeCard>();
    for (const card of rows.flatMap((r) => r.cards)) {
      if (!bySlug.has(card.slug)) bySlug.set(card.slug, card);
    }
    return [...bySlug.values()];
  }, [rows]);

  const trimmed = query.trim().toLowerCase();
  const searching = trimmed.length > 0;

  const results = useMemo(
    () => (trimmed ? all.filter((c) => c.title.toLowerCase().includes(trimmed)) : []),
    [all, trimmed]
  );

  /* The chips under the search box. NOT "popular searches" — they are simply the
     editor's picks, and we have no search or traffic data that would let us call
     anything popular. Same rule the rows follow. */
  const suggested = useMemo(() => heroCards.slice(0, 6), [heroCards]);

  /* The wall wants far more faces than the editor's picks alone can give it: the
     picks lead, then the rest of the "games like" lists, then the themed collections
     fill what is left. The collage is decorative (aria-hidden) and links nowhere, so
     borrowing the themed art costs nothing — and it is what lets every tile be a
     different cover instead of the same 17 repeating across the wall. */
  const collage = useMemo(() => {
    const seen = new Set<string>();
    const out: RowCard[] = [];

    for (const card of [...heroCards, ...all, ...themes]) {
      if (card.image && !seen.has(card.slug)) {
        seen.add(card.slug);
        out.push(card);
      }
    }
    return out;
  }, [heroCards, all, themes]);

  return (
    <>
      {/* ─────────────── Hero ───────────────
          Deliberately NOT an AppSection: the mosaic has to reach the right edge of
          the SCREEN, and a max-w-6xl wrapper would stop it at the text column. So
          the band is full-width, the collage is absolute inside it, and only the
          copy is re-centred to the usual column width. */}
      <section className="relative z-10 overflow-hidden px-6 py-16 md:py-20">
        <HeroCollage cards={collage} />

        <div className="relative mx-auto max-w-6xl">
          {/* Half-width on lg so the copy never runs under the wall. */}
          <div className="lg:max-w-[46%]">
            <PageBreadcrumbs
              items={BREADCRUMBS}
              theme="dark"
              className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65"
            />

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl gp-home-display">
              Games like…
              <span className="mt-1 block text-[color:var(--page-accent-strong)]">
                Find your next favorite game
              </span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
              Start from a game you love and discover hand-picked collections of similar games.
            </p>

            {/* Filters the rows below in place; the button jumps straight to the
                single match when the query leaves exactly one. */}
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="mt-7 flex max-w-md items-center gap-2 rounded-full border border-slate-200/90 bg-white p-1.5 pl-4 shadow-sm focus-within:border-[color:var(--page-accent-border)] dark:border-slate-800/80 dark:bg-slate-900/70"
            >
              <span className="text-slate-400 dark:text-slate-500">
                <Magnifier />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a game you love…"
                aria-label="Search the games-like collections"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />
              {results.length === 1 ? (
                <Link href={results[0].path} className={APP_PRIMARY_CTA_ACCENT_SM}>
                  Search
                </Link>
              ) : (
                <span className={`${APP_PRIMARY_CTA_ACCENT_SM} pointer-events-none opacity-60`}>
                  Search
                </span>
              )}
            </form>

            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-400">Try one of these</p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {suggested.map((c) => (
                  <li key={c.slug}>
                    <button type="button" onClick={() => setQuery(c.title)} className={CHIP}>
                      {c.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat value={String(totalLists)} label="Curated collections" />
              <Stat value={String(totalGames)} label="Games covered" />
              <Stat value="Every pick" label="Explained by hand" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Rows ───────────────
          Its own band: a hairline and a darker plate cut the browsing area away
          from the hero, so the page reads as "land here, then browse" instead of
          one long column. */}
      <div className="relative z-10 border-t border-white/10 bg-black/25 backdrop-blur-[2px]">
        <AppSection maxWidth="max-w-6xl" className="py-14 md:py-16">
          {searching ? (
            <section aria-labelledby="games-like-results">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2
                  id="games-like-results"
                  className="text-xl font-extrabold tracking-tight text-white md:text-2xl gp-home-display"
                >
                  {results.length > 0
                    ? `${results.length} ${results.length === 1 ? "collection" : "collections"} for “${query.trim()}”`
                    : `Nothing matches “${query.trim()}”`}
                </h2>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-sm font-bold text-[color:var(--page-accent-text)] underline-offset-4 hover:underline"
                >
                  Clear search
                </button>
              </div>

              {results.length > 0 ? (
                <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {results.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={c.path}
                        className="group relative block aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200/90 bg-[#080a14] shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-border)] hover:shadow-[0_14px_36px_-16px_var(--page-accent-glow)] dark:border-slate-800/80"
                      >
                        {c.image ? (
                          <Image
                            src={c.image}
                            alt={`${c.title} key art`}
                            fill
                            sizes="(max-width: 640px) 50vw, 260px"
                            className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : null}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/45 to-transparent"
                        />
                        <span className="absolute inset-x-0 bottom-0 p-4">
                          <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
                            Games like
                          </span>
                          <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-white">
                            {c.title}
                          </h3>
                          <span className="mt-1 block text-[11px] font-medium text-white/55">
                            {c.gameCount} games
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                  We don’t have a hand-made list for that one yet. Describe what you want in your
                  own words and let GamePing AI find the matches instead.{" "}
                  <Link
                    href="/recommend"
                    className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
                  >
                    Try AI recommendations
                  </Link>
                  .
                </p>
              )}
            </section>
          ) : (
            <>
              {rows.map((row) => (
                <CollectionRow
                  key={row.id}
                  id={`row-${row.id}`}
                  title={row.label}
                  blurb={row.blurb}
                  cards={row.cards}
                  size={row.size}
                />
              ))}

              {themes.length > 0 ? (
                <CollectionRow
                  id="row-themes"
                  title="Browse by theme"
                  blurb="Not starting from one game? Start from a mood."
                  cards={themes}
                  viewAllHref="/collections"
                />
              ) : null}

              {hubs.length > 0 ? (
                <section aria-labelledby="games-like-hubs" className="mt-12">
                  <h2
                    id="games-like-hubs"
                    className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl gp-home-display"
                  >
                    Browse by genre &amp; mood
                  </h2>
                  <ul className="mt-5 flex flex-wrap gap-2.5">
                    {hubs.map((h) => (
                      <li key={h.href}>
                        <Link href={h.href} className={`${CHIP} px-4 py-2 text-sm`}>
                          {h.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href="/collections" className={`${CHIP} px-4 py-2 text-sm`}>
                        More
                      </Link>
                    </li>
                  </ul>
                </section>
              ) : null}
            </>
          )}

          <div className="mt-16 flex flex-col gap-6 rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800/80 dark:bg-slate-900/70">
            <div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                Can’t find what you’re looking for?
              </p>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                Describe the game you want in your own words and our AI will find the best matches.
              </p>
            </div>

            <Link href="/recommend" className={`${APP_PRIMARY_CTA_ACCENT_SM} shrink-0`}>
              Try AI Recommendations
            </Link>
          </div>
        </AppSection>
      </div>
    </>
  );
}
