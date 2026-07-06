/**
 * Minimal server-side media lookup for the Companion's media response modes.
 *
 * MVP scope — ONE best-effort result, never a list, never a hard failure:
 *   - Video: YouTube Data API v3 when YOUTUBE_API_KEY is configured; otherwise
 *     a keyless fallback that reads the public YouTube results page. Thumbnail
 *     and embed URLs are derived from the video id, so both paths return the
 *     full shape.
 *   - Image: the game's Fandom wiki (MediaWiki page-image search, keyless) when
 *     the model can name it, falling back to Wikipedia with a relevance guard.
 *
 * Every lookup returns `null` on any failure (timeout, parse, no result) so the
 * ask route can always fall back to an answer-only response. Server-side only —
 * no keys or upstream URLs are ever sent to the desktop client.
 */

export type CompanionMediaType = "video" | "image";

export type CompanionMediaResult = {
  type: CompanionMediaType;
  title?: string;
  url: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  caption?: string;
};

const FETCH_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

function youTubeResultFromId(id: string, title?: string): CompanionMediaResult {
  return {
    type: "video",
    title,
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${id}`,
  };
}

/** YouTube Data API v3 search (requires YOUTUBE_API_KEY). */
async function youTubeApiSearch(query: string, apiKey: string): Promise<CompanionMediaResult | null> {
  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  try {
    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string };
      }>;
    };
    const item = data.items?.[0];
    const id = item?.id?.videoId;
    if (!id) return null;
    return youTubeResultFromId(id, item?.snippet?.title);
  } catch {
    return null;
  }
}

/**
 * Keyless fallback: read the first video id off the public YouTube results
 * page. Best-effort by design — if YouTube changes its markup this returns
 * null and the Companion answers text-only, so nothing user-facing breaks.
 */
async function youTubeScrapeSearch(query: string): Promise<CompanionMediaResult | null> {
  const res = await fetchWithTimeout(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res) return null;
  try {
    const html = await res.text();
    const idMatch = /"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"/.exec(html);
    const id = idMatch?.[1];
    if (!id) return null;

    // Title lives shortly after the video id in the same renderer blob.
    let title: string | undefined;
    const nearby = html.slice(idMatch.index, idMatch.index + 4_000);
    const titleMatch = /"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/.exec(nearby);
    if (titleMatch?.[1]) {
      try {
        title = JSON.parse(`"${titleMatch[1]}"`) as string;
      } catch {
        title = undefined;
      }
    }
    return youTubeResultFromId(id, title);
  } catch {
    return null;
  }
}

/** One relevant video for the query, or null. Never throws. */
export async function findCompanionVideo(query: string): Promise<CompanionMediaResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (apiKey) {
    const viaApi = await youTubeApiSearch(trimmed, apiKey);
    if (viaApi) return viaApi;
  }
  return youTubeScrapeSearch(trimmed);
}

type MediaWikiImagePage = {
  index?: number;
  title?: string;
  description?: string;
  original?: { source?: string };
  thumbnail?: { source?: string };
};

/**
 * MediaWiki page-image search, shared by Fandom game wikis and Wikipedia (same
 * API, different api.php path). Returns result pages sorted by search rank.
 */
async function mediaWikiImagePages(
  host: string,
  apiPath: string,
  query: string
): Promise<MediaWikiImagePage[]> {
  const url =
    `https://${host}${apiPath}` +
    "?action=query&format=json&generator=search" +
    `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5` +
    "&prop=pageimages%7Cdescription&piprop=original%7Cthumbnail&pithumbsize=640";
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "GamePingCompanion/1.0 (https://gamepingai.com)" },
  });
  if (!res) return [];
  try {
    const data = (await res.json()) as {
      query?: { pages?: Record<string, MediaWikiImagePage> };
    };
    return Object.values(data.query?.pages ?? {}).sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0)
    );
  } catch {
    return [];
  }
}

function imageResultFromPage(page: MediaWikiImagePage): CompanionMediaResult | null {
  const imageUrl = page.original?.source ?? page.thumbnail?.source;
  if (!imageUrl) return null;
  return {
    type: "image",
    title: page.title,
    url: imageUrl,
    thumbnailUrl: page.thumbnail?.source,
    caption: page.description,
  };
}

function contentTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Loose query↔title overlap (prefix-tolerant, so "map" matches "Maps"). Guards
 * the general-encyclopedia fallback against confidently irrelevant results.
 */
function titleMatchesQuery(title: string, query: string): boolean {
  const titleTokens = contentTokens(title);
  return contentTokens(query).some((q) =>
    titleTokens.some((t) => t.startsWith(q) || q.startsWith(t))
  );
}

/** Model-suggested wiki hosts are fetched ONLY when they are a Fandom wiki. */
const FANDOM_HOST_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)?\.fandom\.com$/;

/**
 * One relevant image, or null. Tries the game's Fandom wiki first (best source
 * for locations/items/maps), then Wikipedia — where a relevance guard drops
 * results whose title shares nothing with the query. Never throws.
 */
export async function findCompanionImage(
  query: string,
  wikiHost?: string
): Promise<CompanionMediaResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const fandomHost = wikiHost?.trim().toLowerCase();
  if (fandomHost && FANDOM_HOST_RE.test(fandomHost)) {
    const pages = await mediaWikiImagePages(fandomHost, "/api.php", trimmed);
    for (const page of pages) {
      const result = imageResultFromPage(page);
      if (result) return result;
    }
  }

  const pages = await mediaWikiImagePages("en.wikipedia.org", "/w/api.php", trimmed);
  for (const page of pages) {
    if (!page.title || !titleMatchesQuery(page.title, trimmed)) continue;
    const result = imageResultFromPage(page);
    if (result) return result;
  }
  return null;
}
