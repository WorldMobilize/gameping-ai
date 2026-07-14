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

export type CompanionMediaType = "video" | "image" | "music";

/**
 * Optional highlight marker for map results. Coordinates are normalized (0..1)
 * relative to the displayed image. Only emitted when they can be determined
 * confidently — we never invent coordinates (a wrong marker is worse than none).
 */
export type CompanionMediaMarker = {
  x: number;
  y: number;
  label: string;
};

export type CompanionMediaResult = {
  type: CompanionMediaType;
  /** "map" for map/location results; omitted for generic images/videos. */
  variant?: "map";
  title?: string;
  url: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  caption?: string;
  /** Optional, map-only. Omitted unless coordinates are confidently known. */
  marker?: CompanionMediaMarker;
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

/**
 * One game-music result for the query, or null. Music lives on YouTube (tracks,
 * OST uploads), so this reuses the video lookup and re-tags the result as
 * `type: "music"` — the desktop renders it as an audio/track card. Never throws.
 */
export async function findCompanionMusic(query: string): Promise<CompanionMediaResult | null> {
  const base = await findCompanionVideo(query);
  if (!base) return null;
  return { ...base, type: "music" };
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

/** Model-suggested wiki hosts are fetched ONLY when they are a Fandom wiki. */
const FANDOM_HOST_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)?\.fandom\.com$/;

/**
 * Minimum share of the SPECIFIC relevance terms that must appear in a candidate
 * page (title/description/filename) before we attach its image. For a two-word
 * subject like "stone axe" this requires BOTH words — so a generic page (the
 * Minecraft main page, a "Pyramid", a "Stone" block) is rejected and the ask
 * degrades to answer-only rather than showing a random image.
 */
const IMAGE_RELEVANCE_THRESHOLD = 0.6;

/**
 * The specific things the user asked about, MINUS the (too-generic) game name.
 * Scoring on "stone axe" — not "minecraft" — is what stops the search matching
 * an unrelated page just because it mentions the game.
 */
export function imageRelevanceTerms(
  subject?: string,
  searchQuery?: string,
  game?: string
): string[] {
  const gameTokens = new Set(contentTokens(game ?? ""));
  const raw = [...contentTokens(subject ?? ""), ...contentTokens(searchQuery ?? "")];
  const specific = raw.filter((t) => !gameTokens.has(t));
  return Array.from(new Set(specific.length ? specific : raw));
}

/** Share (0..1) of `terms` found in a page's title/description/image filename. */
function scoreImagePage(page: MediaWikiImagePage, terms: string[]): number {
  if (!terms.length) return 0;
  const haystack = contentTokens(
    `${page.title ?? ""} ${page.description ?? ""} ${page.original?.source ?? ""} ${page.thumbnail?.source ?? ""}`
  );
  let matched = 0;
  for (const term of terms) {
    if (haystack.some((t) => t.startsWith(term) || term.startsWith(t))) matched += 1;
  }
  return matched / terms.length;
}

/** Highest-scoring page above the relevance threshold, or null. */
function bestScoredImage(
  pages: MediaWikiImagePage[],
  terms: string[]
): { result: CompanionMediaResult; score: number; title?: string } | null {
  let best: { result: CompanionMediaResult; score: number; title?: string } | null = null;
  for (const page of pages) {
    const result = imageResultFromPage(page);
    if (!result) continue;
    const score = scoreImagePage(page, terms);
    if (score >= IMAGE_RELEVANCE_THRESHOLD && (!best || score > best.score)) {
      best = { result, score, title: page.title };
    }
  }
  return best;
}

/** Server-side debug line so we can iterate on relevance from the logs. */
function logImageChoice(
  query: string,
  terms: string[],
  host: string,
  chosen: { title?: string; url: string; score: number } | null
) {
  console.log(
    "[companion:image]",
    JSON.stringify({
      query,
      terms,
      host,
      result: chosen ? "image" : "text-only",
      chosen: chosen
        ? { title: chosen.title, url: chosen.url, score: Number(chosen.score.toFixed(2)) }
        : null,
    })
  );
}

/**
 * One RELEVANT image, or null. Scores each candidate page against the specific
 * relevance `terms` (item/location the user asked about) and only returns one
 * that clears IMAGE_RELEVANCE_THRESHOLD — picking the best score, not just the
 * first search hit. Tries the game's Fandom wiki first (best source for
 * items/recipes/locations), then Wikipedia. Never throws; returns null so the
 * caller degrades to answer-only rather than showing an unrelated image.
 */
export async function findCompanionImage(
  query: string,
  wikiHost?: string,
  terms?: string[]
): Promise<CompanionMediaResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const scoreTerms = terms && terms.length ? terms : contentTokens(trimmed);

  const fandomHost = wikiHost?.trim().toLowerCase();
  if (fandomHost && FANDOM_HOST_RE.test(fandomHost)) {
    const pages = await mediaWikiImagePages(fandomHost, "/api.php", trimmed);
    const best = bestScoredImage(pages, scoreTerms);
    if (best) {
      logImageChoice(trimmed, scoreTerms, fandomHost, {
        title: best.title,
        url: best.result.url,
        score: best.score,
      });
      return best.result;
    }
  }

  const wikiPages = await mediaWikiImagePages("en.wikipedia.org", "/w/api.php", trimmed);
  const best = bestScoredImage(wikiPages, scoreTerms);
  if (best) {
    logImageChoice(trimmed, scoreTerms, "en.wikipedia.org", {
      title: best.title,
      url: best.result.url,
      score: best.score,
    });
    return best.result;
  }

  // Nothing relevant → answer-only (never a random image).
  logImageChoice(trimmed, scoreTerms, fandomHost || "wikipedia", null);
  return null;
}

/** True when a wiki page/image is actually a map (title or image filename). */
function looksLikeMap(page: MediaWikiImagePage): boolean {
  const haystack = `${page.title ?? ""} ${page.original?.source ?? ""} ${page.thumbnail?.source ?? ""}`.toLowerCase();
  return /\bmap\b|\bmaps\b|world[_\s-]?map|region[_\s-]?map|\bmappa\b|\bmapa\b/.test(haystack);
}

/**
 * A MAP image for a location/"where is" question. Prefers the game's Fandom
 * wiki (the reliable source for game maps) and only returns a result that is
 * genuinely a map — otherwise null, so the caller can fall back to answer-only
 * rather than showing a generic place photo for a location question.
 *
 * Result carries `variant: "map"`. A `marker` is intentionally NOT attached:
 * we have no reliable per-image coordinates and never invent them (a wrong
 * marker is worse than none). The shape supports one for future sources.
 */
export async function findCompanionMapImage(opts: {
  query: string;
  wikiHost?: string;
  mapLabel?: string;
  game?: string;
}): Promise<CompanionMediaResult | null> {
  const trimmed = opts.query.trim();
  if (!trimmed) return null;

  const fandomHost = opts.wikiHost?.trim().toLowerCase();
  // Without a known game wiki we cannot reliably find a *game* map. Prefer
  // answer-only over a misleading generic image for a location question.
  if (!fandomHost || !FANDOM_HOST_RE.test(fandomHost)) return null;

  const mapQuery = /\bmap\b/i.test(trimmed) ? trimmed : `${trimmed} map`;
  const pages = await mediaWikiImagePages(fandomHost, "/api.php", mapQuery);

  const mapPage = pages.find(
    (p) => looksLikeMap(p) && (p.original?.source ?? p.thumbnail?.source)
  );
  if (!mapPage) return null;

  const base = imageResultFromPage(mapPage);
  if (!base) return null;

  const label = opts.mapLabel?.trim();
  const game = opts.game?.trim();
  const caption =
    label && game
      ? `${label} on the ${game} map`
      : label
        ? `${label} — map`
        : base.caption;

  return {
    ...base,
    variant: "map",
    title: label ? `${label} location` : base.title,
    caption,
    // marker omitted by design — see the doc comment above.
  };
}
