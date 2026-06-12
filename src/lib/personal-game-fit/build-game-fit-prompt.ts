import type { PersonalGameFitGameMetadata } from "@/lib/personal-game-fit/types";
import type { TasteDnaV2 } from "@/lib/steam-library/taste-dna-types";

const MAX_DESCRIPTION_CHARS = 420;
const MAX_TAGS = 16;

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactGameDescription(description: string): string {
  const text = stripHtmlToText(description);
  if (text.length <= MAX_DESCRIPTION_CHARS) return text;
  return `${text.slice(0, MAX_DESCRIPTION_CHARS - 1).trim()}…`;
}

export function buildPersonalGameFitPromptPayload(params: {
  tasteDna: TasteDnaV2;
  game: PersonalGameFitGameMetadata;
}) {
  const { tasteDna, game } = params;

  return {
    playerProfile: {
      archetype: tasteDna.playerArchetype,
      summary: tasteDna.summary,
      coreMotivations: tasteDna.coreMotivations.slice(0, 4).map((motivation) => ({
        trait: motivation.trait,
        confidence: motivation.confidence,
        evidenceGames: motivation.evidence.slice(0, 3),
        reason: motivation.reason,
      })),
      likes: tasteDna.likes.slice(0, 5),
      avoidLikely: tasteDna.avoidLikely.slice(0, 4),
      topPlayedGames: tasteDna.favoriteSignals.slice(0, 5),
    },
    game: {
      rawgId: game.rawgId,
      title: game.title,
      genres: game.genres.slice(0, 8),
      tags: game.tags.slice(0, MAX_TAGS),
      description: compactGameDescription(game.description),
    },
  };
}

export const PERSONAL_GAME_FIT_SYSTEM_PROMPT = `You explain whether a specific game fits a player's Taste DNA for GamePing AI.
Return ONLY valid JSON:
{
  "fitTier": "great_fit" | "good_fit" | "partial_fit" | "different_but_worth_trying" | "weak_fit",
  "fitScore": 0,
  "headline": "string",
  "whyYouMayLike": ["string"],
  "potentialConcerns": ["string"]
}

Rules:
- Answer for THIS game and THIS player profile only.
- Explain motivations (freedom, sandbox, progression, atmosphere), not generic genre labels like "you like RPGs".
- Use evidence games only as bridges ("Your Fallout playtime suggests..."), never recommend franchise clones.
- whyYouMayLike: 1-3 concise bullets. potentialConcerns: 0-3 bullets; include honest mismatches when relevant.
- different_but_worth_trying when the game may appeal despite being unlike their top-played games.
- weak_fit when alignment is low; still be respectful and specific.
- fitScore 0-100 reflects overall personal fit, not review score.
- headline: one short sentence the user sees first.
- No markdown. No extra keys.`;
