/** Display-only helpers for recommendation-context fit copy (not pipeline logic). */

const PIPELINE_STYLE_PATTERNS = [
  /\brerank\b/i,
  /\bfallback\b/i,
  /returned no games/i,
  /selected when/i,
  /selected by pipeline/i,
  /\bsemantic filter\b/i,
  /\bretrieval\b/i,
  /selezionato quando/i,
  /non ha restituito/i,
  /non ha restituito risultati/i,
];

export const RECOMMEND_FIT_TRANSPARENCY_NOTE =
  "Based on your latest recommendation search — not a persistent taste profile yet.";

export const RECOMMEND_FIT_DEFAULT_BODY =
  "This pick matches the mood, pacing, and gameplay style from your latest search. It was selected because it lines up with the kind of experience you asked for — not because of a saved taste profile yet.";

export function isPipelineStyleFitCopy(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return PIPELINE_STYLE_PATTERNS.some((pattern) => pattern.test(t));
}

/** Returns human-safe fit copy, or null if the string looks like internal pipeline/debug text. */
export function sanitizeRecommendFitCopy(text: string | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  if (isPipelineStyleFitCopy(trimmed)) return null;
  return trimmed;
}

/** Prefer AI/search explanation when safe; otherwise use the default search-context body. */
export function resolveRecommendFitBody(reason: string): string {
  return sanitizeRecommendFitCopy(reason) ?? RECOMMEND_FIT_DEFAULT_BODY;
}
