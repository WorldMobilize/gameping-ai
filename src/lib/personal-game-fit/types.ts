export const PERSONAL_GAME_FIT_PROMPT_VERSION = 1;

export const PERSONAL_GAME_FIT_TIERS = [
  "great_fit",
  "good_fit",
  "partial_fit",
  "different_but_worth_trying",
  "weak_fit",
  "owned",
] as const;

export type PersonalGameFitTier = (typeof PERSONAL_GAME_FIT_TIERS)[number];

export type PersonalGameFit = {
  fitTier: PersonalGameFitTier;
  fitScore: number;
  headline: string;
  whyYouMayLike: string[];
  potentialConcerns: string[];
};

export type PersonalGameFitGameMetadata = {
  rawgId: number;
  title: string;
  genres: string[];
  tags: string[];
  description: string;
};
