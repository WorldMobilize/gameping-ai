import "server-only";

import type { RawgCandidate } from "@/lib/rawg-discovery";

/**
 * Conservative diversity / discovery rerank tuning.
 * Does not ban popular games — only nudges ranking so abstract prompts do not
 * always surface the same "safe anchor" titles when strong alternatives exist.
 */

export const CANONICAL_SOFT_PENALTY = 4;
export const DISCOVERY_SOFT_BOOST = 5;
/** Discovery boost only applies when the candidate already has decent semantic fit. */
export const DISCOVERY_MIN_BASE_SCORE = 34;
/** Skip canonical penalty when the title leads the pool by this margin (obvious best fit). */
export const CANONICAL_CLEAR_LEAD_MARGIN = 14;

export const MAX_DISCOVERY_PICKS_IN_RESPONSE = 2;
export const RECOVERY_MAX_TOTAL_PICKS = 4;
export const RECOVERY_MAX_ADDITIONS = 2;

/** Well-known titles that often dominate abstract / vibe prompts. Not banned. */
const CANONICAL_ANCHOR_KEYS = new Set(
  [
    "journey",
    "stardew valley",
    "what remains of edith finch",
    "firewatch",
    "inside",
    "gris",
    "the witness",
    "the witcher 3 wild hunt",
    "the witcher 3",
    "the elder scrolls v skyrim",
    "skyrim",
    "red dead redemption 2",
    "animal crossing new horizons",
    "hollow knight",
    "celeste",
    "undertale",
    "portal 2",
    "disco elysium",
    "breath of the wild",
    "the legend of zelda breath of the wild",
  ].map(normalizeTitleKey)
);

/** Cult / hidden-gem style titles — boost only when already semantically relevant. */
const DISCOVERY_GEM_KEYS = new Set(
  [
    "tunic",
    "animal well",
    "dredge",
    "citizen sleeper",
    "norco",
    "signalis",
    "sunless sea",
    "sable",
    "eastshade",
    "rain world",
    "noita",
    "outer wilds",
    "return of the obra dinn",
    "kentucky route zero",
    "hypnospace outlaw",
    "stories untold",
    "infra",
    "pathologic 2",
    "void stranger",
    "hyper light drifter",
    "la mulana",
    "kenshi",
    "caves of qud",
    "pentiment",
    "chants of sennaar",
    "the forgotten city",
  ].map(normalizeTitleKey)
);

export function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCanonicalAnchorTitle(title: string): boolean {
  return CANONICAL_ANCHOR_KEYS.has(normalizeTitleKey(title));
}

export function isDiscoveryGemTitle(title: string): boolean {
  return DISCOVERY_GEM_KEYS.has(normalizeTitleKey(title));
}

export function isRecoveryFillerReason(reason: string): boolean {
  return (
    /non era nel top stretto/i.test(reason) ||
    /didn't make the tightest/i.test(reason) ||
    /didn.t make the tightest/i.test(reason)
  );
}

export type ScoredCandidate = { candidate: RawgCandidate; score: number };

/**
 * Adjust pre-rerank heuristic scores: soft canonical penalty + discovery boost.
 */
export function applyDiversityScoreAdjustments(
  scored: ScoredCandidate[]
): ScoredCandidate[] {
  if (scored.length === 0) return scored;

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  const second = sorted[1]?.score ?? 0;
  const topMargin = top - second;

  const adjusted = sorted.map((row, index) => {
    let score = row.score;
    const title = row.candidate.name;

    if (isCanonicalAnchorTitle(title)) {
      const isClearLeader = index === 0 && topMargin >= CANONICAL_CLEAR_LEAD_MARGIN;
      if (!isClearLeader) {
        score -= CANONICAL_SOFT_PENALTY;
      }
    }

    if (
      isDiscoveryGemTitle(title) &&
      row.score >= DISCOVERY_MIN_BASE_SCORE
    ) {
      score += DISCOVERY_SOFT_BOOST;
    }

    return { candidate: row.candidate, score };
  });

  adjusted.sort((a, b) => b.score - a.score);
  return adjusted;
}

export type DiversityPick = {
  id: number;
  title: string;
  slug: string | null;
  image: string | null;
  match: number;
  reason: string;
  matchTier: "best_match" | "good_alternative" | "partial_match";
  matchNote: string;
};

function effectivePickSortScore(pick: DiversityPick): number {
  let s = pick.match;
  if (isCanonicalAnchorTitle(pick.title)) s -= CANONICAL_SOFT_PENALTY;
  if (isDiscoveryGemTitle(pick.title)) s += 2;
  if (pick.matchTier === "partial_match") s -= 4;
  if (isRecoveryFillerReason(pick.reason)) s -= 8;
  return s;
}

/**
 * Re-order final picks: cap discovery gems, trim weak recovery filler, keep 3–4 when pool is weak.
 */
export function balanceFinalPicksDiversity(picks: DiversityPick[]): DiversityPick[] {
  if (picks.length === 0) return picks;

  const nonFiller = picks.filter((p) => !isRecoveryFillerReason(p.reason));
  const filler = picks.filter((p) => isRecoveryFillerReason(p.reason));
  const base = nonFiller.length >= 2 ? nonFiller : [...nonFiller, ...filler];

  const ordered = [...base].sort(
    (a, b) => effectivePickSortScore(b) - effectivePickSortScore(a)
  );

  const out: DiversityPick[] = [];
  let discoveryCount = 0;

  for (const pick of ordered) {
    if (out.length >= 6) break;
    if (isDiscoveryGemTitle(pick.title)) {
      if (discoveryCount >= MAX_DISCOVERY_PICKS_IN_RESPONSE) continue;
      discoveryCount += 1;
    }
    out.push(pick);
  }

  const mostlyWeak =
    out.length > 0 && out.every((p) => p.match <= 66 || p.matchTier === "partial_match");
  if (mostlyWeak && out.length > RECOVERY_MAX_TOTAL_PICKS) {
    return out.slice(0, RECOVERY_MAX_TOTAL_PICKS);
  }

  if (out.length > 5 && out.filter((p) => p.match >= 80).length <= 1) {
    return out.slice(0, 4);
  }

  return out;
}

export function buildRecoveryReason(params: {
  overlapping: string[];
  locale: "it" | "en";
  title: string;
}): string {
  const themes =
    params.overlapping.slice(0, 3).join(", ") ||
    (params.locale === "it" ? "la tua richiesta" : "your request");
  const variantsIt = [
    `Alternativa valida su ${themes}: non era il match più stretto, ma resta coerente con quello che cerchi.`,
    `Pick di supporto legato a ${themes} — utile se vuoi un’opzione in più oltre ai titoli principali.`,
    `C’entra con ${themes} con un taglio leggermente diverso rispetto ai match più in alto.`,
  ];
  const variantsEn = [
    `A solid extra for ${themes} — not the tightest fit, but still aligned with what you asked for.`,
    `Support pick tied to ${themes}; worth a look if you want another angle beside the top matches.`,
    `Touches ${themes} with a slightly different flavor than the main recommendations.`,
  ];
  const variants = params.locale === "it" ? variantsIt : variantsEn;
  const idx =
    Math.abs(params.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
    variants.length;
  return variants[idx] ?? variants[0]!;
}

export function buildDeterministicFallbackPicks(params: {
  scoredFinal: ScoredCandidate[];
  isExcluded: (title: string) => boolean;
  locale: "it" | "en";
  max?: number;
  mapCandidate: (c: RawgCandidate) => {
    id: number;
    title: string;
    slug: string | null;
    image: string | null;
  };
}): DiversityPick[] {
  const max = params.max ?? 4;
  const out: DiversityPick[] = [];

  for (const row of params.scoredFinal) {
    if (out.length >= max) break;
    if (params.isExcluded(row.candidate.name)) continue;
    const mapped = params.mapCandidate(row.candidate);
    const match = Math.min(92, Math.max(72, 68 + Math.floor(row.score / 2)));
    const reason =
      params.locale === "it"
        ? `Match forte sulla tua richiesta (${mapped.title}) — selezionato quando il rerank non ha restituito risultati.`
        : `Strong fit for your request (${mapped.title}) — selected when rerank returned no games.`;
    out.push({
      ...mapped,
      match,
      reason,
      matchTier: row.score >= 12 ? "good_alternative" : "partial_match",
      matchNote: "",
    });
  }

  return balanceFinalPicksDiversity(out);
}
