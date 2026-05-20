/** Form fields sent to POST /api/recommend (subset used for “has any input?” checks). */
export type RecommendInputFields = {
  userPrompt: string;
  genres: string;
  playStyles: string;
  vibes: string;
  mechanics: string;
  platform: string;
  budget: string;
};

/**
 * True when the user provided a free-text prompt or at least one advanced filter/tag.
 * Used client-side before submit and server-side before running recommend.
 */
export function hasMeaningfulRecommendInput(
  input: RecommendInputFields,
  filtersEnabled: boolean
): boolean {
  if (input.userPrompt.trim().length > 0) return true;
  if (!filtersEnabled) return false;

  return (
    Boolean(input.genres.trim()) ||
    Boolean(input.playStyles.trim()) ||
    Boolean(input.vibes.trim()) ||
    Boolean(input.mechanics.trim()) ||
    Boolean(input.platform.trim()) ||
    Boolean(input.budget.trim())
  );
}
