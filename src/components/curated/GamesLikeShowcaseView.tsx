import Image from "next/image";
import Link from "next/link";
import CuratedGameArt from "@/components/CuratedGameArt";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import CollectionStructuredData from "@/components/curated/CollectionStructuredData";
import GamesLikeCarousel from "@/components/curated/GamesLikeCarousel";
import { APP_PRIMARY_CTA_ACCENT_SM, APP_SECONDARY_CTA } from "@/components/app/app-styles";
import { GAMES_LIKE_INDEX } from "@/lib/curated/collection-kinds";
import {
  rankGamesByScore,
  type CollectionStats,
  type CollectionSubjectArt,
} from "@/lib/curated/collection-game-stats";
import type { CuratedCollection } from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

/**
 * Design trial layout for ONE collection (/games-like/hades).
 *
 * Every number on this page comes from RAWG via `loadCollectionStats` — the same
 * source the game detail page uses. Nothing is invented: when RAWG has no value
 * for a game (or the whole collection), the element is simply not rendered.
 */

const ACCENT_TEXT = "text-[color:var(--page-accent-text)]";

const SURFACE =
  "rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70";

const HOVER_LIFT =
  "transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-border)] hover:shadow-[0_14px_36px_-16px_var(--page-accent-glow)]";

const TAG =
  "inline-flex items-center rounded-md border border-[color:var(--page-accent-border)] bg-[color:var(--page-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--page-accent-text)]";

/**
 * Ordinal bar down the left edge of the row, flush against the art. Deliberately
 * NOT a podium: the order is editorial, not a ranking by score, and a gold/silver/
 * bronze tile would promise a merit order the numbers next to it can contradict.
 * Same neutral treatment for every position.
 */
const RANK_BAR =
  "bg-slate-100 text-slate-500 dark:bg-slate-800/70 dark:text-slate-400";

function Icon({ name, className }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "gamepad":
      return (
        <svg {...common}>
          <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" />
          <rect x="2" y="6" width="20" height="12" rx="5" />
        </svg>
      );
    case "medal":
      return (
        <svg {...common}>
          <circle cx="12" cy="15" r="6" />
          <path d="M12 12.5 13 15h-2l1-2.5zM8.5 9 6 3h12l-2.5 6" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M17 4.5a3.5 3.5 0 0 1 0 6.9M22 20v-1.5a4 4 0 0 0-3-3.8" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.2 1.8" />
        </svg>
      );
    case "swords":
      return (
        <svg {...common}>
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M4 21l6-6M7 17l-4 4M3 19l2 2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5 5-2z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Metacritic band — the green/yellow/red convention Metacritic itself uses. */
function metacriticTone(score: number): string {
  if (score >= 75)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (score >= 50)
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-slate-400 dark:text-slate-600"
          }`}
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 16.8 6.7 19.7l1.1-6.1L3.4 9.4l6-.8L12 3z" />
        </svg>
      ))}
    </span>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--page-accent-border)] bg-[color:var(--page-accent-soft)] ${ACCENT_TEXT}`}
      >
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </span>
    </div>
  );
}

export default function GamesLikeShowcaseView({
  collection,
  others,
  stats,
  relatedArt,
}: {
  collection: CuratedCollection;
  others: CuratedCollection[];
  stats: CollectionStats;
  relatedArt: Record<string, CollectionSubjectArt>;
}) {
  const breadcrumbs: GameBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Games like…", href: GAMES_LIKE_INDEX },
    { label: collection.h1 },
  ];

  const related = others;
  const subject = stats.subject;
  const rankedGames = rankGamesByScore(collection.games, stats);

  /* Hero = RAWG key art for the game the list starts from (Hades itself), with
     the first pick's Steam header as the fallback when RAWG has no art. */
  const heroImage = subject?.image ?? collection.games[0]?.image ?? null;
  const heroIsRawgArt = Boolean(subject?.image);

  /* ---- Stats bar: only the facts RAWG actually returned. ---- */
  const statTiles: Array<{ icon: string; value: string; label: string }> = [
    { icon: "gamepad", value: String(collection.games.length), label: "Games" },
  ];

  if (stats.averageMetacritic !== null) {
    statTiles.push({
      icon: "medal",
      value: String(Math.round(stats.averageMetacritic)),
      label: "Avg. Metacritic",
    });
  }
  if (stats.averageRating !== null) {
    statTiles.push({
      icon: "users",
      value: `${stats.averageRating.toFixed(1)}/5`,
      label: "Avg. player rating",
    });
  }
  if (stats.averagePlaytime !== null) {
    statTiles.push({
      icon: "clock",
      value: `${Math.round(stats.averagePlaytime)}h`,
      label: "Avg. playtime",
    });
  }
  if (stats.sharedGenres[0]) {
    statTiles.push({ icon: "swords", value: stats.sharedGenres[0].name, label: "Main genre" });
  }
  if (stats.releaseRange) {
    const { from, to } = stats.releaseRange;
    statTiles.push({
      icon: "calendar",
      value: from === to ? String(from) : `${from}–${to}`,
      label: "Released",
    });
  }

  /* ---- "What these games share": genres held by at least two of them. ---- */
  const total = collection.games.length;
  const sharedGenres = stats.sharedGenres.filter((g) => g.count >= 2).slice(0, 6);

  return (
    <AppPageShell hideAmbient>
      <article className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <CollectionStructuredData collection={collection} stats={stats} />
        <div aria-hidden className="gp-curated-bg" />

        <AppSection maxWidth="max-w-6xl">
          <PageBreadcrumbs
            items={breadcrumbs}
            theme="dark"
            className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65"
          />

          {/* ---------- Hero ---------- */}
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:items-center">
            {heroImage ? (
              heroIsRawgArt ? (
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-[#080a14] shadow-[0_40px_90px_-35px_rgba(2,6,23,0.85)]">
                  <Image
                    src={heroImage}
                    alt={`${stats.subject?.title ?? collection.h1} — key art`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f]/90 via-[#05060f]/20 to-transparent"
                  />

                  {/* The visitor is here because they love this game — name it, show its
                      numbers, and give them a way into its page. */}
                  {subject ? (
                    <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                          Starting from
                        </p>
                        <p className="mt-1 truncate text-xl font-extrabold text-white">
                          {subject.title}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-white/70">
                          {subject.rating ? <span>{subject.rating.toFixed(1)}/5</span> : null}
                          {subject.rating && subject.metacritic ? <span>·</span> : null}
                          {subject.metacritic ? <span>Metacritic {subject.metacritic}</span> : null}
                          {subject.releaseYear && (subject.rating || subject.metacritic) ? (
                            <span>·</span>
                          ) : null}
                          {subject.releaseYear ? <span>{subject.releaseYear}</span> : null}
                        </p>
                      </div>

                      <Link
                        href={`${gameDetailPath(subject.title)}?from=curated`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20"
                      >
                        View {subject.title}
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl shadow-[0_40px_90px_-35px_rgba(2,6,23,0.85)]">
                  <CuratedGameArt
                    src={heroImage}
                    alt={`${collection.h1} — key art`}
                    sizes="(max-width: 768px) 100vw, 640px"
                    priority
                    variant="carousel"
                  />
                </div>
              )
            ) : null}

            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${ACCENT_TEXT}`}>
                Games like…
              </p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl gp-home-display">
                {collection.h1}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                {stats.averageRating !== null ? (
                  <>
                    <Stars rating={stats.averageRating} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-500">
                      average player rating
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                  </>
                ) : null}
                <span className="text-slate-600 dark:text-slate-400">
                  {collection.games.length} games
                </span>
              </div>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-700 dark:text-slate-300">
                {collection.intro}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/discover" className={APP_PRIMARY_CTA_ACCENT_SM}>
                  Open in Discovery
                </Link>
                <Link href={GAMES_LIKE_INDEX} className={APP_SECONDARY_CTA}>
                  All “games like” lists
                </Link>
              </div>
            </div>
          </div>

          {/* ---------- Stats bar (real RAWG aggregates) ---------- */}
          {statTiles.length > 1 ? (
            <div
              className={`mt-10 ${SURFACE} grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}
            >
              {statTiles.map((s) => (
                <Stat key={s.label} icon={s.icon} value={s.value} label={s.label} />
              ))}
            </div>
          ) : null}

          {/* ---------- What these games share (real shared RAWG genres) ---------- */}
          {sharedGenres.length > 0 ? (
            <section className="mt-14">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">
                What these games share
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                The genres these {total} picks have in common, straight from their store data.
              </p>

              <ul className="mt-6 flex flex-wrap gap-3">
                {sharedGenres.map((g) => (
                  <li
                    key={g.name}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {g.name}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {g.count} of {total}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ---------- Ranked list ---------- */}
          <section className="mt-14">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">
              The picks
            </h2>
            {/* Say what the numbers mean. An unlabelled 1-5 next to a score column is
                a promise, and the reader is entitled to know which one we kept. */}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Ranked by player rating{stats.averageMetacritic !== null ? ", Metacritic breaks ties" : ""}.
            </p>
          </section>

          <ul className="mt-6 space-y-4">
            {rankedGames.map((game, i) => {
              const stat = stats.byTitle[game.title];
              const genres = stat?.genres.slice(0, 3) ?? [];

              return (
                <li
                  key={game.title}
                  className={`group flex flex-col overflow-hidden sm:flex-row sm:items-center ${SURFACE} ${HOVER_LIFT}`}
                >
                  {/* `self-stretch` — the row is centre-aligned (the art sets its height),
                      so the bar has to opt into filling that height on its own. */}
                  <span
                    className={`flex shrink-0 items-center justify-center self-stretch py-2 text-xl font-extrabold sm:w-14 sm:py-0 ${RANK_BAR}`}
                  >
                    {i + 1}
                  </span>

                  <CuratedGameArt
                    src={game.image}
                    alt={`${game.title} header art`}
                    sizes="(max-width: 640px) 100vw, 420px"
                    variant="row"
                  />

                  <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {game.title}
                      </h3>

                      {genres.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {genres.map((g) => (
                            <span key={g} className={TAG}>
                              {g}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* The editorial "why it fits" is the whole reason this page beats
                          an auto-generated list — 3 lines, not 2. The art is 420px wide,
                          so its height (~196px) leaves room for exactly that. */}
                      <p className="mt-3 line-clamp-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {game.whyItFits}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                      {/* One unit for every row — the player rating, which RAWG always
                          has. Metacritic rides along as a badge ONLY where it exists,
                          so a gap never turns the column into a mix of scales. */}
                      {stat?.rating ? (
                        <span className="text-center">
                          <span className="block text-2xl font-extrabold text-slate-900 dark:text-white">
                            {stat.rating.toFixed(1)}
                            <span className="text-base font-bold text-slate-400 dark:text-slate-500">
                              /5
                            </span>
                          </span>
                          <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                            Player rating
                          </span>
                          {stat.metacritic ? (
                            <span
                              className={`mt-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${metacriticTone(stat.metacritic)}`}
                            >
                              <span className="font-semibold opacity-70">MC</span>
                              {stat.metacritic}
                            </span>
                          ) : null}
                        </span>
                      ) : null}

                      <Link
                        href={`${gameDetailPath(game.title)}?from=curated`}
                        className={APP_SECONDARY_CTA}
                      >
                        View game
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ---------- More "games like" lists (carousel) ---------- */}
          <GamesLikeCarousel collections={related} subjectArt={relatedArt} />

          {/* ---------- Closing CTA ---------- */}
          <div
            className={`mt-16 flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between ${SURFACE}`}
          >
            <div className="flex items-center gap-5">
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--page-accent-border)] bg-[color:var(--page-accent-soft)] ${ACCENT_TEXT}`}
              >
                <Icon name="compass" className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Still haven’t found your perfect game?
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Describe what you’re looking for and let GamePing AI find the best matches.
                </p>
              </div>
            </div>

            <Link href="/recommend" className={`${APP_PRIMARY_CTA_ACCENT_SM} shrink-0`}>
              Start a Discovery Search
            </Link>
          </div>
        </AppSection>
      </article>
    </AppPageShell>
  );
}
