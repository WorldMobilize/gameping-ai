import "server-only";

import { getCachedRawgGame, setCachedRawgGame } from "@/lib/cache";
import type { CuratedCollection, CuratedCollectionGame } from "@/lib/curated/collections";
import { VERIFIED_TITLE_MATCH_MIN, titleMatchQuality } from "@/lib/title-match";

/**
 * Real RAWG facts for the games in a curated collection — the same data the
 * game detail page already shows (metacritic, player rating, genres, playtime).
 *
 * Read-only: this reuses the existing RAWG integration exactly as
 * `lib/personal-game-fit/load-game-metadata.ts` does — Supabase `cached_games`
 * first, RAWG search+detail only on a miss, then write back to the same cache.
 * No new client, no new key, no change to the integration itself.
 *
 * Every field is nullable and every failure is swallowed: a collection page must
 * render fine with no stats at all rather than show a number we cannot source.
 */

type RawgPayload = {
  id?: number;
  name?: string;
  metacritic?: number | null;
  rating?: number | null;
  ratings_count?: number | null;
  playtime?: number | null;
  released?: string | null;
  background_image?: string | null;
  genres?: { name?: unknown }[];
};

export type CollectionGameStat = {
  /** Metacritic score, 0–100. */
  metacritic: number | null;
  /** RAWG player rating, 0–5. */
  rating: number | null;
  ratingsCount: number | null;
  /** RAWG median playtime, in hours. */
  playtime: number | null;
  releaseYear: number | null;
  genres: string[];
};

/** The game the collection starts from — "Games like Hades" → Hades. */
export type CollectionSubject = {
  title: string;
  /** RAWG key art (landscape), or null when RAWG has none. */
  image: string | null;
  metacritic: number | null;
  rating: number | null;
  releaseYear: number | null;
};

export type CollectionStats = {
  subject: CollectionSubject | null;
  /** Keyed by the curated game title. Missing key = no data for that game. */
  byTitle: Record<string, CollectionGameStat>;
  averageMetacritic: number | null;
  averageRating: number | null;
  averagePlaytime: number | null;
  /** Genres shared across the collection, most common first. */
  sharedGenres: Array<{ name: string; count: number }>;
  releaseRange: { from: number; to: number } | null;
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function genreNames(payload: RawgPayload): string[] {
  if (!Array.isArray(payload.genres)) return [];
  return payload.genres
    .map((g) => (typeof g?.name === "string" ? g.name : null))
    .filter((n): n is string => Boolean(n));
}

/**
 * A RAWG hit is only usable if it is actually the game we asked for. Taking
 * `results[0]` on faith is how you end up showing another game's Metacritic —
 * worse than showing none. Same gate the discovery pipeline uses.
 */
function isSameGame(title: string, payload: RawgPayload | null): boolean {
  if (!payload?.id || typeof payload.name !== "string") return false;
  return titleMatchQuality(title, payload.name) >= VERIFIED_TITLE_MATCH_MIN;
}

async function loadGamePayload(title: string): Promise<RawgPayload | null> {
  const slugKey = encodeURIComponent(title.trim().toLowerCase());

  try {
    const cached = await getCachedRawgGame<RawgPayload>(slugKey);
    if (cached?.id) return isSameGame(title, cached) ? cached : null;
  } catch {
    return null;
  }

  const apiKey = process.env.RAWG_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    // Ask for several candidates, then keep the best-matching one — RAWG's first
    // result is not reliably the right game for short or common titles.
    const searchRes = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(title)}&page_size=5`,
      { cache: "no-store" }
    );
    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as {
      results?: { id?: number; name?: string }[];
    };

    const best = (searchData.results ?? [])
      .filter((r): r is { id: number; name: string } =>
        typeof r?.id === "number" && typeof r?.name === "string"
      )
      .map((r) => ({ r, score: titleMatchQuality(title, r.name) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < VERIFIED_TITLE_MATCH_MIN) return null;

    const detailRes = await fetch(`https://api.rawg.io/api/games/${best.r.id}?key=${apiKey}`, {
      cache: "no-store",
    });
    if (!detailRes.ok) return null;

    const payload = (await detailRes.json()) as RawgPayload;
    if (!isSameGame(title, payload)) return null;

    try {
      await setCachedRawgGame({ slug: slugKey, title, rawgPayload: payload });
    } catch {}

    return payload;
  } catch {
    return null;
  }
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * The title to look the subject up by: "Games like Hades" → "Hades".
 *
 * `subjectTitle` overrides it, because the name people search for is not always
 * the name RAWG stores. "GTA V" scores 0.20 against "Grand Theft Auto V" and is
 * rejected outright, and a bare "Sekiro" matches a rating-0 duplicate entry
 * exactly (1.0), beating the real "Sekiro: Shadows Die Twice" (0.93). The h1
 * keeps the keyword; the lookup gets the name that resolves.
 */
function subjectTitleOf(collection: CuratedCollection): string | null {
  if (collection.subjectTitle?.trim()) return collection.subjectTitle.trim();
  const match = /^games\s+like\s+(.+)$/i.exec(collection.h1.trim());
  return match ? match[1].trim() : null;
}

async function loadSubject(collection: CuratedCollection): Promise<CollectionSubject | null> {
  const title = subjectTitleOf(collection);
  if (!title) return null;

  const payload = await loadGamePayload(title);
  const year = payload?.released
    ? Number.parseInt(String(payload.released).slice(0, 4), 10)
    : NaN;

  return {
    title,
    image:
      typeof payload?.background_image === "string" && payload.background_image
        ? payload.background_image
        : null,
    metacritic: num(payload?.metacritic),
    rating: num(payload?.rating),
    releaseYear: Number.isFinite(year) ? year : null,
  };
}

/**
 * The list, ordered by score instead of by editorial whim.
 *
 * The numbers down the left are read as a ranking whether we mean them that way
 * or not, so they had better agree with the scores next to them: an 86 sitting
 * below an 82 just looks broken. Player rating leads (RAWG always has it),
 * Metacritic breaks ties, and games RAWG knows nothing about sink to the bottom
 * rather than claiming a position they cannot justify. Ties keep their original
 * editorial order, since `sort` is stable.
 */
export function rankGamesByScore(
  games: CuratedCollectionGame[],
  stats: CollectionStats
): CuratedCollectionGame[] {
  const key = (game: CuratedCollectionGame) => {
    const stat = stats.byTitle[game.title];
    return {
      rating: stat?.rating ?? -1,
      metacritic: stat?.metacritic ?? -1,
    };
  };

  return [...games].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return kb.rating - ka.rating || kb.metacritic - ka.metacritic;
  });
}

/** What a "games like X" card shows: X itself, not one of the games inside it. */
export type CollectionSubjectArt = {
  /** The subject game's own title — "Games like Disco Elysium" → "Disco Elysium". */
  title: string;
  /** RAWG key art for that game, or null when RAWG has none. */
  image: string | null;
};

/**
 * Subject art for a batch of collections, keyed by slug. Used by the carousel so
 * a "Games like Disco Elysium" card shows Disco Elysium — showing the first game
 * *inside* the list instead is a small lie about what the card links to.
 */
export async function loadCollectionSubjectArt(
  collections: CuratedCollection[]
): Promise<Record<string, CollectionSubjectArt>> {
  const entries = await Promise.all(
    collections.map(async (c) => {
      const title = subjectTitleOf(c);
      if (!title) return null;

      const payload = await loadGamePayload(title);
      const image =
        typeof payload?.background_image === "string" && payload.background_image
          ? payload.background_image
          : null;

      return [c.slug, { title, image }] as const;
    })
  );

  return Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null));
}

export async function loadCollectionStats(
  collection: CuratedCollection
): Promise<CollectionStats> {
  const [subject, payloads] = await Promise.all([
    loadSubject(collection),
    Promise.all(
      collection.games.map(async (game) => ({
        title: game.title,
        payload: await loadGamePayload(game.title),
      }))
    ),
  ]);

  const byTitle: Record<string, CollectionGameStat> = {};
  const genreCounts = new Map<string, number>();
  const years: number[] = [];

  for (const { title, payload } of payloads) {
    if (!payload) continue;

    const genres = genreNames(payload);
    const releasedYear = payload.released
      ? Number.parseInt(String(payload.released).slice(0, 4), 10)
      : NaN;
    const releaseYear = Number.isFinite(releasedYear) ? releasedYear : null;

    byTitle[title] = {
      metacritic: num(payload.metacritic),
      rating: num(payload.rating),
      ratingsCount: num(payload.ratings_count),
      playtime: num(payload.playtime),
      releaseYear,
      genres,
    };

    for (const g of new Set(genres)) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
    if (releaseYear) years.push(releaseYear);
  }

  const stats = Object.values(byTitle);

  return {
    subject,
    byTitle,
    averageMetacritic: average(
      stats.map((s) => s.metacritic).filter((v): v is number => v !== null)
    ),
    averageRating: average(stats.map((s) => s.rating).filter((v): v is number => v !== null)),
    averagePlaytime: average(stats.map((s) => s.playtime).filter((v): v is number => v !== null)),
    sharedGenres: [...genreCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    releaseRange: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
  };
}
