import "server-only"

import { nonCanonicalSideEditionDedupePenalty } from "@/lib/canonical-title-preference"

export type RawgCandidate = {
  id: number
  name: string
  slug?: string
  background_image?: string | null
  released?: string | null
  rating?: number | null
  ratings_count?: number | null
  /** Number of text reviews (popularity signal). */
  reviews_count?: number | null
  /** RAWG "similar games" suggestion count (mainstream cross-link signal). */
  suggestions_count?: number | null
  added?: number | null
  // Optional metadata (best-effort; may be missing depending on endpoint used)
  description_raw?: string | null
  platforms?: string[]
  stores?: string[]
  genres?: { name: string }[]
  tags?: { name: string }[]
  /** Metacritic score (present on the /games list endpoint). */
  metacritic?: number | null
  /** First short screenshot URL — image fallback when background_image is missing. */
  image_fallback?: string | null
}

const RAWG_FETCH_TIMEOUT_MS = 8_500

async function fetchRawgJson(url: string, timeoutMs = RAWG_FETCH_TIMEOUT_MS) {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  })
  return res
}

type IntentBundle = {
  normalizedIntent: string
  coreKeywords: string[]
  discoveryQueries: string[]
  negativeKeywords: string[]
  preferredGenresOrTags: string[]
  /** Extra subject→context guards (e.g. deck → steam deck when handheld intent). */
  subjectContext?: Record<string, string[]>
}

function normalizeToken(s: string) {
  return s.toLowerCase().trim()
}

function tokenizeForMatch(text: string) {
  return normalizeToken(text)
    // Keep basic latin letters + digits. (RAWG names are mostly latin; this keeps matching predictable.)
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function safeIncludes(haystack: string, needle: string) {
  const h = tokenizeForMatch(haystack)
  const n = tokenizeForMatch(needle)
  return n.length > 1 && h.includes(n)
}

function titleTokens(title: string) {
  const t = tokenizeForMatch(title)
  return t ? t.split(" ").filter(Boolean) : []
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter += 1
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

// Basic low-quality / non-base-game detectors (title-based).
export const QUALITY_BAD_PATTERNS: Array<{ re: RegExp; penalty: number }> = [
  { re: /\b(dlc|season pass|expansion)\b/i, penalty: 30 },
  { re: /\b(soundtrack|ost)\b/i, penalty: 35 },
  { re: /\b(demo|prologue)\b/i, penalty: 30 },
  { re: /\b(asset pack|texture pack|skin pack|pack)\b/i, penalty: 25 },
  { re: /\b(bundle)\b/i, penalty: 20 },
  { re: /\b(vr|virtual reality)\s+experience\b/i, penalty: 38 },
  { re: /\b(indie\s+game\s+battle|game\s+battle)\b/i, penalty: 42 },
  { re: /\b(tech demo|prototype)\b/i, penalty: 35 },
]

// Edition/version markers: used for dedupe & penalties.
const EDITION_MARKERS = [
  "edition",
  "ultimate",
  "deluxe",
  "complete",
  "definitive",
  "gold",
  "goty",
  "game of the year",
  "remastered",
  "remake",
  "collection",
  "bundle",
]

function normalizeTitleForDedupe(title: string) {
  let t = tokenizeForMatch(title)
  // Remove bracketed qualifiers.
  t = t.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ")
  // Remove common separators.
  t = t.replace(/[-–—:]/g, " ")
  // Drop edition markers and noise tokens.
  const tokens = t
    .split(" ")
    .filter(Boolean)
    .filter((tok) => !EDITION_MARKERS.includes(tok))
    .filter((tok) => tok !== "vr" && tok !== "beta" && tok !== "alpha")
  return tokens.join(" ").trim()
}

function normalizeTitleForMatch(title: string) {
  return normalizeTitleForDedupe(title)
}

function dedupePreferenceScore(title: string) {
  // Lower is better.
  const t = title.toLowerCase()
  let penalty = 0
  if (t.includes(" vr")) penalty += 12
  for (const m of EDITION_MARKERS) {
    if (t.includes(m)) penalty += 6
  }
  for (const p of QUALITY_BAD_PATTERNS) {
    if (p.re.test(title)) penalty += p.penalty
  }
  penalty += nonCanonicalSideEditionDedupePenalty(title)
  return penalty
}

// Minimal subject->context heuristics to avoid title-word false positives
// (e.g. "Gold Edition" matching "gold" without any mining/prospecting intent).
const SUBJECT_CONTEXT: Record<string, string[]> = {
  gold: ["mining", "mine", "prospecting", "digging", "extraction", "resource", "quarry", "drilling"],
  oro: ["miniera", "mining", "estrazione", "prospezione", "scavo", "risorsa", "cava", "perforazione"],
}

function anyIncludes(blob: string, tokens: string[]) {
  return tokens.some((t) => safeIncludes(blob, t))
}

function notNull<T>(value: T | null): value is T {
  return value !== null
}

export function isLowQualityTitle(name: string) {
  for (const p of QUALITY_BAD_PATTERNS) {
    if (p.re.test(name)) return true
  }
  return false
}

export { titleMatchQuality } from "@/lib/title-match"

async function runPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  const worker = async () => {
    while (true) {
      const i = nextIndex++
      if (i >= items.length) break
      results[i] = await fn(items[i], i)
    }
  }
  const workers = Math.min(Math.max(1, concurrency), Math.max(1, items.length))
  await Promise.all(Array.from({ length: workers }, () => worker()))
  return results
}

/** Deduped discovery queries against RAWG search with bounded concurrency (avoid bursts). */
export async function fetchRawgCandidates(params: {
  rawgApiKey: string
  discoveryQueries: string[]
  pageSize?: number
  /** Cap parallel RAWG search queries (default 6). */
  maxQueries?: number
}) {
  const pageSize = Math.max(5, Math.min(params.pageSize ?? 20, 40))
  const maxQueries = Math.max(1, Math.min(params.maxQueries ?? 6, 6))
  const queries = params.discoveryQueries
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, maxQueries)

  const results: RawgCandidate[] = []
  const RAWG_QUERY_CONCURRENCY = 4

  await runPool(queries, RAWG_QUERY_CONCURRENCY, async (q) => {
    try {
      const url = `https://api.rawg.io/api/games?key=${params.rawgApiKey}&search=${encodeURIComponent(
        q
      )}&page_size=${pageSize}`
      const res = await fetchRawgJson(url)
      if (!res.ok) return
      const data = (await res.json()) as { results?: unknown }
      const arr = Array.isArray(data?.results) ? (data.results as unknown[]) : []
      for (const g of arr) {
        if (!g || typeof g !== "object") continue
        const rec = g as Record<string, unknown>
        if (typeof rec.id !== "number" && typeof rec.id !== "string") continue
        if (typeof rec.name !== "string") continue
        const platforms =
          Array.isArray(rec.platforms) ?
            (rec.platforms as Array<{ platform?: { name?: unknown } }>).map((p) =>
              typeof p?.platform?.name === "string" ? p.platform.name : ""
            ).filter(Boolean)
          : undefined
        const stores =
          Array.isArray(rec.stores) ?
            (rec.stores as Array<{ store?: { name?: unknown } }>).map((s) =>
              typeof s?.store?.name === "string" ? s.store.name : ""
            ).filter(Boolean)
          : undefined
        results.push({
          id: Number(rec.id),
          name: rec.name,
          slug: typeof rec.slug === "string" ? rec.slug : undefined,
          background_image:
            typeof rec.background_image === "string" ? rec.background_image : null,
          released: typeof rec.released === "string" ? rec.released : null,
          rating: typeof rec.rating === "number" ? rec.rating : null,
          ratings_count:
            typeof rec.ratings_count === "number" ? rec.ratings_count : null,
          added: typeof rec.added === "number" ? rec.added : null,
          platforms: platforms?.length ? platforms.slice(0, 8) : undefined,
          stores: stores?.length ? stores.slice(0, 8) : undefined,
          genres: Array.isArray(rec.genres) ? (rec.genres as { name: string }[]) : undefined,
          tags: Array.isArray(rec.tags) ? (rec.tags as { name: string }[]) : undefined,
        })
      }
    } catch {
      // Best-effort: skip this query.
    }
  })

  return results
}

export async function searchRawgByTitle(params: {
  rawgApiKey: string
  title: string
  pageSize?: number
}): Promise<RawgCandidate[]> {
  const q = params.title.trim()
  if (!q) return []
  const pageSize = Math.max(3, Math.min(params.pageSize ?? 8, 12))
  try {
    const url = `https://api.rawg.io/api/games?key=${params.rawgApiKey}&search=${encodeURIComponent(
      q
    )}&page_size=${pageSize}`
    const res = await fetchRawgJson(url)
    if (!res.ok) return []
    const data = (await res.json()) as { results?: unknown }
    const arr = Array.isArray(data?.results) ? (data.results as unknown[]) : []
    const mapped: Array<RawgCandidate | null> = arr.map((g) => {
      if (!g || typeof g !== "object") return null
      const rec = g as Record<string, unknown>
      if (typeof rec.id !== "number" && typeof rec.id !== "string") return null
      if (typeof rec.name !== "string") return null
      const platforms =
        Array.isArray(rec.platforms) ?
          (rec.platforms as Array<{ platform?: { name?: unknown } }>).map((p) =>
            typeof p?.platform?.name === "string" ? p.platform.name : ""
          ).filter(Boolean)
        : undefined
      const stores =
        Array.isArray(rec.stores) ?
          (rec.stores as Array<{ store?: { name?: unknown } }>).map((s) =>
            typeof s?.store?.name === "string" ? s.store.name : ""
          ).filter(Boolean)
        : undefined
      return {
        id: Number(rec.id),
        name: rec.name,
        slug: typeof rec.slug === "string" ? rec.slug : undefined,
        background_image:
          typeof rec.background_image === "string" ? rec.background_image : null,
        released: typeof rec.released === "string" ? rec.released : null,
        rating: typeof rec.rating === "number" ? rec.rating : null,
        ratings_count:
          typeof rec.ratings_count === "number" ? rec.ratings_count : null,
        added: typeof rec.added === "number" ? rec.added : null,
        platforms: platforms?.length ? platforms.slice(0, 8) : undefined,
        stores: stores?.length ? stores.slice(0, 8) : undefined,
        genres: Array.isArray(rec.genres) ? (rec.genres as { name: string }[]) : undefined,
        tags: Array.isArray(rec.tags) ? (rec.tags as { name: string }[]) : undefined,
      } satisfies RawgCandidate
    })

    return mapped.filter(notNull)
  } catch {
    return []
  }
}

/**
 * Query the RAWG `/games` LIST endpoint with arbitrary filters (ordering, dates,
 * metacritic, genres, tags, …). Same RAWG integration/key as the rest of this
 * module — no new client. Used by the admin discovery pages to pull real
 * candidates (Hidden Gems / Games of the Week). Best-effort: returns [] on any
 * failure so callers can fall back to static data.
 */
export async function fetchRawgGamesList(params: {
  rawgApiKey: string
  query: Record<string, string>
  timeoutMs?: number
}): Promise<RawgCandidate[]> {
  try {
    const qs = new URLSearchParams({ key: params.rawgApiKey, ...params.query }).toString()
    const url = `https://api.rawg.io/api/games?${qs}`
    const res = await fetchRawgJson(url, params.timeoutMs)
    if (!res.ok) return []
    const data = (await res.json()) as { results?: unknown }
    const arr = Array.isArray(data?.results) ? (data.results as unknown[]) : []
    const mapped: Array<RawgCandidate | null> = arr.map((g) => {
      if (!g || typeof g !== "object") return null
      const rec = g as Record<string, unknown>
      if (typeof rec.id !== "number" && typeof rec.id !== "string") return null
      if (typeof rec.name !== "string") return null
      const platforms =
        Array.isArray(rec.platforms) ?
          (rec.platforms as Array<{ platform?: { name?: unknown } }>).map((p) =>
            typeof p?.platform?.name === "string" ? p.platform.name : ""
          ).filter(Boolean)
        : undefined
      const stores =
        Array.isArray(rec.stores) ?
          (rec.stores as Array<{ store?: { name?: unknown } }>).map((s) =>
            typeof s?.store?.name === "string" ? s.store.name : ""
          ).filter(Boolean)
        : undefined
      const shortScreens = Array.isArray(rec.short_screenshots)
        ? (rec.short_screenshots as Array<{ image?: unknown }>)
        : []
      const firstScreen = shortScreens.find(
        (s) => typeof s?.image === "string" && (s.image as string).trim()
      )
      return {
        id: Number(rec.id),
        name: rec.name,
        slug: typeof rec.slug === "string" ? rec.slug : undefined,
        background_image:
          typeof rec.background_image === "string" ? rec.background_image : null,
        released: typeof rec.released === "string" ? rec.released : null,
        rating: typeof rec.rating === "number" ? rec.rating : null,
        ratings_count:
          typeof rec.ratings_count === "number" ? rec.ratings_count : null,
        reviews_count:
          typeof rec.reviews_count === "number" ? rec.reviews_count : null,
        suggestions_count:
          typeof rec.suggestions_count === "number" ? rec.suggestions_count : null,
        added: typeof rec.added === "number" ? rec.added : null,
        metacritic: typeof rec.metacritic === "number" ? rec.metacritic : null,
        image_fallback:
          firstScreen && typeof firstScreen.image === "string" ? firstScreen.image : null,
        platforms: platforms?.length ? platforms.slice(0, 8) : undefined,
        stores: stores?.length ? stores.slice(0, 8) : undefined,
        genres: Array.isArray(rec.genres) ? (rec.genres as { name: string }[]) : undefined,
        tags: Array.isArray(rec.tags) ? (rec.tags as { name: string }[]) : undefined,
      } satisfies RawgCandidate
    })
    return mapped.filter(notNull)
  } catch {
    return []
  }
}

export async function fetchRawgGameDetails(params: {
  rawgApiKey: string
  rawgId: number
}): Promise<Pick<RawgCandidate, "id" | "description_raw" | "platforms" | "stores"> | null> {
  try {
    const url = `https://api.rawg.io/api/games/${params.rawgId}?key=${params.rawgApiKey}`
    const res = await fetchRawgJson(url)
    if (!res.ok) return null
    const rec = (await res.json()) as Record<string, unknown>

    const description_raw =
      typeof rec.description_raw === "string" ? rec.description_raw : null

    const platforms =
      Array.isArray(rec.platforms) ?
        (rec.platforms as Array<{ platform?: { name?: unknown } }>).map((p) =>
          typeof p?.platform?.name === "string" ? p.platform.name : ""
        ).filter(Boolean)
      : undefined

    const stores =
      Array.isArray(rec.stores) ?
        (rec.stores as Array<{ store?: { name?: unknown } }>).map((s) =>
          typeof s?.store?.name === "string" ? s.store.name : ""
        ).filter(Boolean)
      : undefined

    return {
      id: params.rawgId,
      description_raw,
      platforms: platforms?.length ? platforms.slice(0, 10) : undefined,
      stores: stores?.length ? stores.slice(0, 10) : undefined,
    }
  } catch {
    return null
  }
}

/** First screenshot URL for a game (best-effort; used for card fallbacks). */
export async function fetchRawgFirstScreenshotUrl(params: {
  rawgApiKey: string
  rawgId: number
  timeoutMs?: number
}): Promise<string | null> {
  try {
    const url = `https://api.rawg.io/api/games/${params.rawgId}/screenshots?key=${encodeURIComponent(
      params.rawgApiKey
    )}`
    const res = await fetchRawgJson(url, params.timeoutMs)
    if (!res.ok) return null
    const data = (await res.json()) as { results?: unknown }
    const arr = Array.isArray(data?.results) ? (data.results as unknown[]) : []
    const first = arr[0]
    if (!first || typeof first !== "object") return null
    const img = (first as Record<string, unknown>).image
    return typeof img === "string" && img.trim() ? img : null
  } catch {
    return null
  }
}

export function dedupeCandidates(candidates: RawgCandidate[]) {
  // 1) Hard dedupe by id
  const byId = new Map<number, RawgCandidate>()
  for (const c of candidates) if (!byId.has(c.id)) byId.set(c.id, c)
  const list = Array.from(byId.values())

  // 2) Title dedupe (editions/versions/VR/bundles)
  const byBase = new Map<string, RawgCandidate>()
  for (const c of list) {
    const base = normalizeTitleForDedupe(c.name)
    const current = byBase.get(base)
    if (!current) {
      byBase.set(base, c)
      continue
    }
    // Prefer the "base" / higher-quality looking title.
    const a = dedupePreferenceScore(current.name)
    const b = dedupePreferenceScore(c.name)
    if (b < a) byBase.set(base, c)
  }

  // 3) Fuzzy dedupe very similar base titles
  const kept: RawgCandidate[] = []
  for (const c of byBase.values()) {
    const baseTokens = titleTokens(normalizeTitleForDedupe(c.name))
    let merged = false
    for (let i = 0; i < kept.length; i++) {
      const k = kept[i]
      const kTokens = titleTokens(normalizeTitleForDedupe(k.name))
      if (jaccard(baseTokens, kTokens) >= 0.9) {
        // Keep the better looking candidate.
        const a = dedupePreferenceScore(k.name)
        const b = dedupePreferenceScore(c.name)
        if (b < a) kept[i] = c
        merged = true
        break
      }
    }
    if (!merged) kept.push(c)
  }

  return kept
}

/**
 * Lightweight scoring:
 * - boost coreKeywords and preferredGenresOrTags matches
 * - penalize negativeKeywords matches
 * - penalize generic-only matches like "simulator" without a core subject
 */
export function scoreCandidates(intent: IntentBundle, candidates: RawgCandidate[]) {
  const core = intent.coreKeywords.map(normalizeToken).filter(Boolean)
  const preferred = intent.preferredGenresOrTags.map(normalizeToken).filter(Boolean)
  const negative = intent.negativeKeywords.map(normalizeToken).filter(Boolean)

  const scored = candidates.map((c) => {
    const name = c.name || ""
    const genreText = (c.genres ?? []).map((g) => g.name).join(" | ")
    const tagText = (c.tags ?? []).map((t) => t.name).join(" | ")
    const blob = `${name} | ${genreText} | ${tagText}`

    let score = 0
    let coreHits = 0

    for (const kw of core) {
      if (safeIncludes(blob, kw)) {
        score += 6
        coreHits += 1
      }
    }

    for (const kw of preferred) {
      if (safeIncludes(blob, kw)) score += 3
    }

    for (const kw of negative) {
      if (safeIncludes(blob, kw)) score -= 8
    }

    // Quality penalties (lightweight, title-based).
    for (const p of QUALITY_BAD_PATTERNS) {
      if (p.re.test(name)) score -= p.penalty
    }

    // Subject-only penalty: subject matched but no context words matched.
    // Helps avoid false positives like "Gold Edition" for "simulatore oro".
    const normalizedIntentBlob = `${intent.normalizedIntent} | ${intent.discoveryQueries.join(" | ")}`
    const subjectContext = { ...SUBJECT_CONTEXT, ...(intent.subjectContext ?? {}) }
    for (const subject of Object.keys(subjectContext)) {
      const subjectIsInIntent = core.includes(subject) || safeIncludes(normalizedIntentBlob, subject)
      if (!subjectIsInIntent) continue

      const subjectMatchedCandidate = safeIncludes(blob, subject)
      if (!subjectMatchedCandidate) continue

      const contextMatchedCandidate = anyIncludes(blob, subjectContext[subject])
      if (!contextMatchedCandidate) {
        score -= 18
      }
    }

    // Generic penalty: "simulator" matched but no other core keyword matched.
    const hasSimulator = safeIncludes(name, "simulator") || safeIncludes(name, "simulation")
    const coreNonGenericHits = core.filter((k) => k !== "simulator" && k !== "simulation").some((k) =>
      safeIncludes(blob, k)
    )
    if (hasSimulator && !coreNonGenericHits && coreHits <= 1) {
      score -= 6
    }

    return { candidate: c, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored
}

export function selectDiverseTop<T extends { candidate: RawgCandidate; score: number }>(
  scored: T[],
  limit: number
) {
  const selected: T[] = []
  const max = Math.max(0, limit)

  // Greedy MMR-like selection: score - similarity penalty to already selected items.
  while (selected.length < max && scored.length > 0) {
    let bestIdx = 0
    let bestValue = -Infinity

    for (let i = 0; i < scored.length; i++) {
      const item = scored[i]
      const baseTokens = titleTokens(normalizeTitleForDedupe(item.candidate.name))
      let similarityPenalty = 0
      for (const s of selected) {
        const sTokens = titleTokens(normalizeTitleForDedupe(s.candidate.name))
        const sim = jaccard(baseTokens, sTokens)
        // Penalize near-duplicates strongly.
        if (sim >= 0.8) similarityPenalty += 10
        else if (sim >= 0.65) similarityPenalty += 5
      }

      const value = item.score - similarityPenalty
      if (value > bestValue) {
        bestValue = value
        bestIdx = i
      }
    }

    selected.push(scored[bestIdx])
    scored.splice(bestIdx, 1)
  }

  return selected
}

