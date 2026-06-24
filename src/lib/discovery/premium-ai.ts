import "server-only";

import OpenAI from "openai";
import type { UserTasteProfile } from "@/lib/discovery/user-taste-profile";

/**
 * OpenAI layer for the personalized premium pages — NEW, self-contained prompts.
 * Does NOT touch /api/recommend, the recommendation pipeline, or any existing AI
 * prompt. OpenAI's job here is strictly: summarize, explain, and rank signals we
 * already gathered from the DB / RAWG / pricing — never to invent owned games,
 * playtime, prices, or preferences.
 *
 * Everything is best-effort: with no OPENAI_API_KEY, or on any error/timeout/bad
 * JSON, these return null and the generators fall back to deterministic copy.
 */

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 20_000;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

async function callJson<T>(system: string, user: string): Promise<T | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { timeout: TIMEOUT_MS }
    );
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("[premium:ai] call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function tasteContext(profile: UserTasteProfile): string {
  return JSON.stringify({
    likes: profile.likes.slice(0, 12),
    avoid: profile.avoid.slice(0, 8),
    favoriteGames: profile.favoriteGames.slice(0, 10).map((g) => g.title),
    preferredGenres: profile.preferredGenres.slice(0, 10),
    preferredMechanics: profile.preferredMechanics.slice(0, 10),
    archetype: profile.steamSummary?.archetype ?? null,
  });
}

// ---------------------------------------------------------------------------
// Weekly picks — explain WHY each candidate fits this user.
// ---------------------------------------------------------------------------

export type AiPickExplanation = {
  id: string;
  matchScore: number;
  category: string;
  whyPicked: string[];
  possibleConcerns: string[];
};

export type AiWeeklyResult = {
  headline: string;
  summary: string;
  picks: AiPickExplanation[];
};

export async function explainWeeklyPicksWithAi(params: {
  profile: UserTasteProfile;
  candidates: { id: string; title: string; genres: string[]; tags: string[] }[];
}): Promise<AiWeeklyResult | null> {
  const system =
    "You are GamePing's taste analyst. You are given a user's taste profile and a list of candidate games (already fetched from a game database). " +
    "For EACH candidate, explain why it might fit this specific user, grounded ONLY in the provided taste signals and the candidate's own genres/tags. " +
    "Never invent that the user owns/played a game. Keep reasons concrete and short. " +
    'Respond as JSON: {"headline": string (<=8 words), "summary": string (<=240 chars, why these picks this week), ' +
    '"picks": [{"id": string, "matchScore": number 60-97, "category": string (<=3 words), "whyPicked": string[] (2-3 short reasons), "possibleConcerns": string[] (0-2 short caveats)}]}.';
  const user = JSON.stringify({
    taste: JSON.parse(tasteContext(params.profile)),
    candidates: params.candidates.slice(0, 10),
  });
  return callJson<AiWeeklyResult>(system, user);
}

// ---------------------------------------------------------------------------
// Deals — rank real discounted offers by taste fit (NOT by biggest discount).
// ---------------------------------------------------------------------------

export type AiDealRanking = {
  headline: string;
  summary: string;
  deals: { id: string; matchScore: number; whyDealFits: string[] }[];
};

export async function rankDealsWithAi(params: {
  profile: UserTasteProfile;
  deals: { id: string; title: string; discountPercent: number; genres: string[] }[];
}): Promise<AiDealRanking | null> {
  const system =
    "You are GamePing's deal curator. You are given a user's taste profile and a list of games that are CURRENTLY ON SALE (real prices already verified). " +
    "Rank and explain them by how well each game matches the user's taste — a smaller discount on a perfect-fit game beats a huge discount on something they'd never enjoy. " +
    "Do not invent prices. Ground 'whyDealFits' in the taste signals + the game's genres. " +
    'Respond as JSON: {"headline": string (<=8 words), "summary": string (<=240 chars), ' +
    '"deals": [{"id": string, "matchScore": number 60-97, "whyDealFits": string[] (2-3 short reasons)}]} ordered best-fit first.';
  const user = JSON.stringify({
    taste: JSON.parse(tasteContext(params.profile)),
    deals: params.deals.slice(0, 12),
  });
  return callJson<AiDealRanking>(system, user);
}

// ---------------------------------------------------------------------------
// Monthly recap — name the gaming personality + a Wrapped-style narrative.
// ---------------------------------------------------------------------------

export type AiRecapResult = {
  personalityName: string;
  personalitySummary: string;
  headline: string;
  summary: string;
};

export async function narrateRecapWithAi(params: {
  profile: UserTasteProfile;
  stats: { searches: number; discovered: number; saved: number; alerts: number };
}): Promise<AiRecapResult | null> {
  const system =
    "You are GamePing's 'gaming wrapped' writer. Given a user's taste profile and their real monthly activity stats, " +
    "give them a gaming personality archetype and a warm, specific recap. Use ONLY the provided signals; never invent playtime or owned games. " +
    'Respond as JSON: {"personalityName": string (e.g. "The Explorer", <=3 words), "personalitySummary": string (<=200 chars), ' +
    '"headline": string (<=8 words), "summary": string (<=240 chars)}.';
  const user = JSON.stringify({
    taste: JSON.parse(tasteContext(params.profile)),
    stats: params.stats,
  });
  return callJson<AiRecapResult>(system, user);
}
