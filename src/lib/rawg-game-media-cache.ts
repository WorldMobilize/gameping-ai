import "server-only";

import {
  getCachedRawgGame,
  setCachedRawgGame,
} from "@/lib/cache";

const RAWG_MEDIA_KEY = "_gameping_media";
const RAWG_FETCH_REVALIDATE_SEC = 86_400;

export type RawgScreenshot = {
  id: number;
  image: string;
};

export type RawgMovie = {
  id: number;
  name: string;
  data?: {
    max?: string;
    "480"?: string;
  };
  preview?: string;
};

type EmbeddedRawgMedia = {
  screenshots: RawgScreenshot[];
  movies: RawgMovie[];
  cachedAt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function readEmbeddedRawgMedia(payload: unknown): EmbeddedRawgMedia | null {
  if (!isRecord(payload)) return null;
  const raw = payload[RAWG_MEDIA_KEY];
  if (!isRecord(raw)) return null;
  const cachedAt = typeof raw.cachedAt === "string" ? raw.cachedAt : "";
  if (!cachedAt) return null;
  const screenshots = Array.isArray(raw.screenshots)
    ? (raw.screenshots as RawgScreenshot[])
    : [];
  const movies = Array.isArray(raw.movies) ? (raw.movies as RawgMovie[]) : [];
  return { screenshots, movies, cachedAt };
}

function stripEmbeddedMedia<T>(payload: T): T {
  if (!isRecord(payload)) return payload;
  if (!(RAWG_MEDIA_KEY in payload)) return payload;
  const copy = { ...payload };
  delete copy[RAWG_MEDIA_KEY];
  return copy as T;
}

async function fetchRawgScreenshotsFromApi(gameId: number): Promise<RawgScreenshot[]> {
  const key = process.env.RAWG_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}/screenshots?key=${key}`,
      { next: { revalidate: RAWG_FETCH_REVALIDATE_SEC } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RawgScreenshot[] };
    return data.results?.slice(0, 8) ?? [];
  } catch {
    return [];
  }
}

async function fetchRawgMoviesFromApi(gameId: number): Promise<RawgMovie[]> {
  const key = process.env.RAWG_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}/movies?key=${key}`,
      { next: { revalidate: RAWG_FETCH_REVALIDATE_SEC } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RawgMovie[] };
    return data.results?.slice(0, 2) ?? [];
  } catch {
    return [];
  }
}

async function persistEmbeddedRawgMedia(params: {
  slug: string;
  title: string;
  rawgPayload: unknown;
  screenshots: RawgScreenshot[];
  movies: RawgMovie[];
}): Promise<void> {
  if (!isRecord(params.rawgPayload)) return;

  const merged = {
    ...params.rawgPayload,
    [RAWG_MEDIA_KEY]: {
      screenshots: params.screenshots,
      movies: params.movies,
      cachedAt: new Date().toISOString(),
    } satisfies EmbeddedRawgMedia,
  };

  try {
    await setCachedRawgGame({
      slug: params.slug,
      title: params.title,
      rawgPayload: merged,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Returns screenshots/movies, reusing Supabase cached_games payload when present.
 * On miss, fetches once and embeds media beside the RAWG game JSON (no schema change).
 */
export async function getRawgGameMedia(params: {
  title: string;
  gameId?: number;
  rawgPayload: unknown | null;
}): Promise<{ screenshots: RawgScreenshot[]; movies: RawgMovie[] }> {
  const empty = { screenshots: [] as RawgScreenshot[], movies: [] as RawgMovie[] };
  if (!params.gameId) return empty;

  const slug = encodeURIComponent(params.title.trim().toLowerCase());
  const embedded =
    readEmbeddedRawgMedia(params.rawgPayload) ??
    readEmbeddedRawgMedia(await getCachedRawgGame<Record<string, unknown>>(slug));

  if (embedded) {
    return {
      screenshots: embedded.screenshots,
      movies: embedded.movies,
    };
  }

  const [screenshots, movies] = await Promise.all([
    fetchRawgScreenshotsFromApi(params.gameId),
    fetchRawgMoviesFromApi(params.gameId),
  ]);

  const basePayload = params.rawgPayload ?? (await getCachedRawgGame(slug));
  if (basePayload) {
    await persistEmbeddedRawgMedia({
      slug,
      title: params.title,
      rawgPayload: stripEmbeddedMedia(basePayload),
      screenshots,
      movies,
    });
  }

  return { screenshots, movies };
}
