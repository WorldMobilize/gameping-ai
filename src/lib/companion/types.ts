/** Shared types for the experimental admin-only GamePing Companion (Alpha). */

export type CompanionMode = "hint" | "guide" | "full";

export type CompanionAnswer = {
  shortAnswer: string;
  nextSteps: string[];
  dontMiss: string[];
  warnings: string[];
  extraTips: string[];
  /** True when the model is not confident; surfaced as a verify-this note in the UI. */
  uncertain: boolean;
  uncertaintyNote?: string;
};
