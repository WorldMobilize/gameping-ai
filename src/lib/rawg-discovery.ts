import "server-only"

export type RawgCandidate = {
  id: number
  name: string
  slug?: string
  genres?: { name: string }[]
  tags?: { name: string }[]
}

type IntentBundle = {
  normalizedIntent: string
  coreKeywords: string[]
  discoveryQueries: string[]
  negativeKeywords: string[]
  preferredGenresOrTags: string[]
}

function normalizeToken(s: string) {
  return s.toLowerCase().trim()
}

function tokenizeForMatch(text: string) {
  return normalizeToken(text)
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
const QUALITY_BAD_PATTERNS: Array<{ re: RegExp; penalty: number }> = [
  { re: /\b(dlc|season pass|expansion)\b/i, penalty: 30 },
  { re: /\b(soundtrack|ost)\b/i, penalty: 35 },
  { re: /\b(demo|prologue)\b/i, penalty: 30 },
  { re: /\b(asset pack|texture pack|skin pack|pack)\b/i, penalty: 25 },
  { re: /\b(bundle)\b/i, penalty: 20 },
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

export async function fetchRawgCandidates(params: {
  rawgApiKey: string
  discoveryQueries: string[]
  pageSize?: number
}) {
  const pageSize = Math.max(5, Math.min(params.pageSize ?? 20, 40))
  const queries = params.discoveryQueries
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 6)

  const results: RawgCandidate[] = []

  await Promise.all(
    queries.map(async (q) => {
      try {
        const url = `https://api.rawg.io/api/games?key=${params.rawgApiKey}&search=${encodeURIComponent(
          q
        )}&page_size=${pageSize}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { results?: unknown }
        const arr = Array.isArray(data?.results) ? (data.results as unknown[]) : []
        for (const g of arr) {
          if (!g || typeof g !== "object") continue
          const rec = g as Record<string, unknown>
          if (typeof rec.id !== "number" && typeof rec.id !== "string") continue
          if (typeof rec.name !== "string") continue
          results.push({
            id: Number(rec.id),
            name: rec.name,
            slug: typeof rec.slug === "string" ? rec.slug : undefined,
            genres: Array.isArray(rec.genres) ? (rec.genres as { name: string }[]) : undefined,
            tags: Array.isArray(rec.tags) ? (rec.tags as { name: string }[]) : undefined,
          })
        }
      } catch {
        // Best-effort: skip this query.
      }
    })
  )

  return results
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
    for (const subject of Object.keys(SUBJECT_CONTEXT)) {
      const subjectIsInIntent = core.includes(subject) || safeIncludes(normalizedIntentBlob, subject)
      if (!subjectIsInIntent) continue

      const subjectMatchedCandidate = safeIncludes(blob, subject)
      if (!subjectMatchedCandidate) continue

      const contextMatchedCandidate = anyIncludes(blob, SUBJECT_CONTEXT[subject])
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

