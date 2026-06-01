export type RecommendMatchTier = "best_match" | "good_alternative" | "partial_match"

export function recommendMatchTierLabel(
  tier: RecommendMatchTier | undefined
): string | null {
  if (tier === "best_match") return "Best match"
  if (tier === "good_alternative") return "Good alternative"
  if (tier === "partial_match") return "Partial match"
  return null
}
