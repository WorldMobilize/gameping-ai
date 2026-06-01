import type { ResultCountPolicy } from "@/lib/intent-normalization"

export const FAST_MODE_SCREENSHOT_MAX_FETCHES = 2
export const FAST_MODE_SCREENSHOT_TIMEOUT_MS = 4_500

export const FAST_MODE_FALLBACK_QUERY_LIMIT_FULL = 6
export const FAST_MODE_FALLBACK_QUERY_LIMIT_PARTIAL = 3

/** Fast picks with clear AI confidence — used only for fallback/screenshot budgeting. */
export function countHighConfidenceFastPicks(
  picks: ReadonlyArray<{ match: number; matchTier: string }>
): number {
  return picks.filter((p) => {
    if (p.matchTier === "best_match") return true
    if (p.match >= 80) return true
    if (p.matchTier === "good_alternative" && p.match >= 72) return true
    return false
  }).length
}

/** Skip expensive RAWG search fallback when quality/refine already has enough strong picks. */
export function shouldSkipFastModeRawgFallback(params: {
  resultCountPolicy: ResultCountPolicy
  isRefineRequest: boolean
  pickedCount: number
  highConfidenceCount: number
}): boolean {
  const { resultCountPolicy, isRefineRequest, pickedCount, highConfidenceCount } = params

  if (resultCountPolicy === "quality_first" && pickedCount >= 2) return true
  if (
    (resultCountPolicy === "quality_first" || isRefineRequest) &&
    highConfidenceCount >= 2
  ) {
    return true
  }
  return false
}

/**
 * Broad prompts keep full fallback breadth; quality/refine runs with partial signal use fewer RAWG queries.
 */
export function fastModeFallbackQueryLimit(params: {
  resultCountPolicy: ResultCountPolicy
  highConfidenceCount: number
  pickedCount: number
}): number {
  if (params.resultCountPolicy === "broad") {
    return FAST_MODE_FALLBACK_QUERY_LIMIT_FULL
  }
  if (params.highConfidenceCount >= 1 && params.pickedCount >= 1) {
    return FAST_MODE_FALLBACK_QUERY_LIMIT_PARTIAL
  }
  return FAST_MODE_FALLBACK_QUERY_LIMIT_FULL
}
