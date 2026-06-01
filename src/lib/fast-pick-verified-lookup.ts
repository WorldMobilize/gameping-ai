import { titleMatchQuality, VERIFIED_TITLE_MATCH_MIN } from "@/lib/title-match"

/** Same normalization as Fast Mode pick join in recommend route. */
export function normalizeFastPickTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export type VerifiedPickLookupCandidate = {
  name: string
  _suggested?: { title: string; titleMatch?: number } | null
}

/** Index verified RAWG hits by the original AI suggested title. */
export function buildVerifiedBySuggestedTitle<T extends VerifiedPickLookupCandidate>(
  verified: T[]
): Map<string, T> {
  const map = new Map<string, T>()
  for (const c of verified) {
    const key = normalizeFastPickTitle(c._suggested?.title ?? c.name)
    if (!key || map.has(key)) continue
    map.set(key, c)
  }
  return map
}

/** Resolve a fast pick to its verified RAWG candidate (suggested-title map, then fuzzy title match). */
export function lookupVerifiedForFastPickTitle<T extends VerifiedPickLookupCandidate>(
  fastPickTitle: string,
  verified: T[],
  bySuggestedTitle: Map<string, T>
): T | undefined {
  const key = normalizeFastPickTitle(fastPickTitle)
  if (!key) return undefined

  const direct = bySuggestedTitle.get(key)
  if (direct) return direct

  let best: T | undefined
  let bestTm = -1
  for (const c of verified) {
    const tm = titleMatchQuality(fastPickTitle, c.name)
    if (tm < VERIFIED_TITLE_MATCH_MIN) continue
    if (!best || tm > bestTm) {
      best = c
      bestTm = tm
    }
  }
  return best
}

/** Unified id lookup for AI-verified and RAWG fallback candidates in Fast Mode. */
export function buildFastPickCandidateById<T extends { id: number }>(
  verified: T[],
  fallback: T[] = []
): Map<number, T> {
  const map = new Map<number, T>()
  for (const c of verified) map.set(c.id, c)
  for (const c of fallback) {
    if (!map.has(c.id)) map.set(c.id, c)
  }
  return map
}
