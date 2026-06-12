import "server-only";

import OpenAI from "openai";
import { applyTasteDnaEnrichment } from "@/lib/steam-library/taste-dna-enrichment";
import type { TasteDnaV2 } from "@/lib/steam-library/taste-dna-types";

/**
 * Optional OpenAI polish — runs only after Steam import/update, never on page loads.
 * Falls back to deterministic DNA when the API key is missing or the call fails.
 */
export async function enrichTasteDnaWithAi(base: TasteDnaV2): Promise<TasteDnaV2> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return base;

  const openai = new OpenAI({ apiKey });

  const evidencePayload = base.coreMotivations.map((motivation) => ({
    trait: motivation.trait,
    confidence: motivation.confidence,
    evidence: motivation.evidence,
    reason: motivation.reason,
  }));

  const topGames = base.favoriteSignals.slice(0, 8).map((title, index) => ({
    rank: index + 1,
    title,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You refine a player's Taste DNA for a game recommendation product.
Return ONLY valid JSON:
{
  "playerArchetype": "string",
  "summary": "string",
  "coreMotivations": [{ "trait": "string", "reason": "string" }],
  "likes": ["string"],
  "avoidLikely": ["string"],
  "recommendationHints": ["string"]
}

Rules:
- Explain WHY the player enjoys games (motivations), not just genres.
- Keep the same number and order of coreMotivations as the input evidence.
- Do not invent games or playtime that are not in the input.
- Avoid franchise-clone language; focus on motivations like agency, emergent play, progression.
- summary: 1-2 sentences, natural English.
- likes / avoidLikely / recommendationHints: short phrases, lowercase preferred.
- No markdown. No extra keys.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            stats: base.stats,
            topGames,
            deterministicArchetype: base.playerArchetype,
            deterministicSummary: base.summary,
            coreMotivations: evidencePayload,
            likes: base.likes,
            avoidLikely: base.avoidLikely,
            recommendationHints: base.recommendationHints,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return base;

    const parsed = JSON.parse(raw) as Parameters<typeof applyTasteDnaEnrichment>[1];
    return applyTasteDnaEnrichment(base, parsed);
  } catch (err) {
    console.error("[steam/taste-dna] enrich", err);
    return base;
  }
}
