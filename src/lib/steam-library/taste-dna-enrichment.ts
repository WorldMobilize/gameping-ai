import type { TasteDnaMotivation, TasteDnaV2 } from "@/lib/steam-library/taste-dna-types";

export type AiTasteDnaEnrichment = {
  playerArchetype?: string;
  summary?: string;
  coreMotivations?: Array<{
    trait?: string;
    reason?: string;
  }>;
  likes?: string[];
  avoidLikely?: string[];
  recommendationHints?: string[];
};

const MAX_SUMMARY_CHARS = 320;
const MAX_ARCHETYPE_CHARS = 64;
const MAX_REASON_CHARS = 220;
const MAX_PHRASE_CHARS = 80;
const MAX_PHRASES = 5;

function trimText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trim()}…` : trimmed;
}

function trimPhraseList(values: unknown, maxItems: number): string[] | null {
  if (!Array.isArray(values)) return null;
  const out: string[] = [];
  for (const value of values) {
    const phrase = trimText(value, MAX_PHRASE_CHARS);
    if (!phrase) continue;
    out.push(phrase);
    if (out.length >= maxItems) break;
  }
  return out.length > 0 ? out : null;
}

function mergeMotivations(
  base: TasteDnaMotivation[],
  aiMotivations: AiTasteDnaEnrichment["coreMotivations"]
): TasteDnaMotivation[] {
  if (!Array.isArray(aiMotivations) || aiMotivations.length === 0) return base;

  return base.map((motivation, index) => {
    const ai = aiMotivations[index];
    if (!ai || typeof ai !== "object") return motivation;

    const trait = trimText(ai.trait, 64) ?? motivation.trait;
    const reason = trimText(ai.reason, MAX_REASON_CHARS) ?? motivation.reason;

    return {
      ...motivation,
      trait,
      reason,
    };
  });
}

export function applyTasteDnaEnrichment(
  base: TasteDnaV2,
  enrichment: AiTasteDnaEnrichment
): TasteDnaV2 {
  const playerArchetype =
    trimText(enrichment.playerArchetype, MAX_ARCHETYPE_CHARS) ?? base.playerArchetype;
  const summary = trimText(enrichment.summary, MAX_SUMMARY_CHARS) ?? base.summary;
  const likes = trimPhraseList(enrichment.likes, MAX_PHRASES) ?? base.likes;
  const avoidLikely =
    trimPhraseList(enrichment.avoidLikely, MAX_PHRASES) ?? base.avoidLikely;
  const recommendationHints =
    trimPhraseList(enrichment.recommendationHints, MAX_PHRASES) ?? base.recommendationHints;

  return {
    ...base,
    playerArchetype,
    summary,
    coreMotivations: mergeMotivations(base.coreMotivations, enrichment.coreMotivations),
    likes,
    avoidLikely,
    recommendationHints,
    enrichedByAi: true,
  };
}
