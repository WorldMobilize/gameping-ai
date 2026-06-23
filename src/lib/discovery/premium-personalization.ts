import type { TasteDna } from "@/lib/steam-library/taste-dna-types";

/**
 * Premium personalization — DATA SHAPES + ADAPTER POINTS ONLY (not built yet).
 *
 * Weekly Picks / Deals For You / Monthly Recap will eventually be personal,
 * per-user features. This module defines the single place each page will read
 * its personal context from, plus the shape of that context, so the AI/Steam
 * pipeline can be plugged in later WITHOUT touching the page UI.
 *
 * Hard rules honored here:
 *  - No AI jobs, no OpenAI calls, no Supabase/Steam reads, no fakery.
 *  - The current signal we already have is the Steam-import taste profile
 *    (`TasteDna`). Everything else is future and optional.
 *  - With no real context wired yet, the resolver returns "needs-steam-import",
 *    so pages render a clearly-labeled empty/demo state instead of fake data.
 *
 * Long-term access rule (prepared, NOT enforced here yet):
 *   premium/admin → full personal access · free/anon → locked preview / upgrade.
 * For now, the route-level AdminOnlyPageGate makes these admin-only.
 */

/** A saved / tracked / history game reference (future signal — shape only). */
export type PersonalGameRef = {
  title: string;
  slug?: string;
};

/** Reserved output of a FUTURE AI analysis pass. Not produced anywhere today. */
export type PersonalDiscoveryAiAnalysis = {
  summary: string;
  picks: Array<{ title: string; slug?: string; reason: string }>;
};

/**
 * Everything a personalized premium discovery page will eventually receive.
 * ALL fields are optional/future — this is the adapter INPUT shape. A page
 * builds whatever it can and passes it to `resolvePremiumPersonalizationStatus`.
 */
export type PersonalDiscoveryContext = {
  userId?: string;
  /** Steam import → taste profile (the one signal that already exists today). */
  tasteDna?: TasteDna | null;
  /** Whether the user has a usable Steam import (drives empty vs. personal). */
  steamImportAvailable?: boolean;
  /** Future signals — shapes only, not wired yet. */
  savedGames?: PersonalGameRef[];
  trackedGames?: PersonalGameRef[];
  recommendationHistory?: PersonalGameRef[];
  ignoredGames?: PersonalGameRef[];
  priceAlertHistory?: PersonalGameRef[];
  /** Reserved for a future AI analysis pass (NOT built now). */
  aiAnalysis?: PersonalDiscoveryAiAnalysis;
};

export type PremiumPersonalizationStatus =
  /** Real personal data is available — render personalized content (future). */
  | "personalized"
  /** Premium/admin user, but no Steam/taste data yet → Steam-import empty state. */
  | "needs-steam-import"
  /** Clearly-labeled preview/demo content. */
  | "demo";

/**
 * Decide how a premium discovery page should render. Pure + deterministic; no
 * I/O, no auth, no fakery. Today pages pass no real context, so this returns
 * "needs-steam-import" and the page shows the Steam-import empty state next to
 * clearly-labeled demo previews. When the Steam→taste pipeline is wired, pass a
 * real `PersonalDiscoveryContext` and this flips to "personalized".
 */
export function resolvePremiumPersonalizationStatus(
  ctx?: PersonalDiscoveryContext
): PremiumPersonalizationStatus {
  if (!ctx) return "needs-steam-import";
  const hasPersonalSignal =
    ctx.steamImportAvailable === true ||
    Boolean(ctx.tasteDna) ||
    Boolean(ctx.aiAnalysis);
  return hasPersonalSignal ? "personalized" : "needs-steam-import";
}

/**
 * Read-only owned/played summary from the Steam taste profile, when present.
 * Returns null when there's no Steam data — never invents numbers.
 */
export function personalLibrarySummary(
  ctx?: PersonalDiscoveryContext
): { ownedCount: number; playedCount: number } | null {
  const stats = ctx?.tasteDna?.stats;
  if (!stats) return null;
  return { ownedCount: stats.ownedCount, playedCount: stats.playedCount };
}
