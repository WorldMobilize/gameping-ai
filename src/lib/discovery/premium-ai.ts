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

/**
 * Compact, provenance-rich taste context for the model. Crucially it labels
 * WHERE each signal came from (played-with-hours vs tracked vs saved) so the
 * model can write reasons grounded in specific user behavior instead of generic
 * "highly rated" filler.
 */
function tasteContext(profile: UserTasteProfile) {
  const mostPlayed = profile.favoriteGames
    .filter((g) => g.source === "steam" && (g.playtimeMin ?? 0) > 0)
    .slice(0, 8)
    .map((g) => ({ title: g.title, hours: Math.round((g.playtimeMin ?? 0) / 60) }));
  const owned = profile.favoriteGames
    .filter((g) => g.source === "steam")
    .slice(0, 10)
    .map((g) => g.title);
  const tracked = profile.favoriteGames.filter((g) => g.source === "tracked").slice(0, 6).map((g) => g.title);
  const saved = profile.favoriteGames.filter((g) => g.source === "saved").slice(0, 6).map((g) => g.title);
  return {
    archetype: profile.steamSummary?.archetype ?? null,
    likes: profile.likes.slice(0, 12),
    avoid: profile.avoid.slice(0, 8),
    preferredGenres: profile.preferredGenres.slice(0, 10),
    preferredMechanics: profile.preferredMechanics.slice(0, 10),
    mostPlayedOnSteam: mostPlayed, // [{title, hours}] — strongest signal
    ownedOnSteam: owned,
    trackedGames: tracked,
    savedGames: saved,
  };
}

// Generic, reputation-based filler the model must never use — these say nothing
// about THIS user. The prompts ban them explicitly.
const BANNED_REASON_PHRASES =
  "'highly rated by players', 'critically acclaimed', 'fan favorite', 'a must-play', 'worth a look', 'great gameplay', 'popular game'";

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

/** Per-candidate anchor hint: the user's own game whose gameplay most resembles
 *  this candidate, precomputed from taste clusters. The model should prefer this
 *  anchor (or another clearly better-matching played game) and VARY it across the
 *  list instead of citing one game for everything. */
export type AiAnchorHint = { title: string; hours: number; facets: string[] };

export async function explainWeeklyPicksWithAi(params: {
  profile: UserTasteProfile;
  candidates: {
    id: string;
    title: string;
    genres: string[];
    tags: string[];
    anchorHint?: AiAnchorHint;
  }[];
}): Promise<AiWeeklyResult | null> {
  const system =
    "You are GamePing's premium taste analyst. You are given a user's taste profile (with the games they've PLAYED on Steam and how many hours, plus games they track/save, and their preferred genres/mechanics) and a list of candidate games. " +
    "The user's library spans SEVERAL distinct taste clusters (e.g. survival, RPG, simulation, horror, shooter). For EACH candidate, FIRST decide which of the user's own games is the closest match by GAMEPLAY — mechanics, progression style, player agency, pacing, long-term goals, exploration, emergent gameplay, survival systems, or simulation depth — NOT by shared marketing tags or popularity. " +
    "Each candidate may include an 'anchorHint' (the precomputed best-matching played game and the gameplay facets they share). Prefer it, unless another played game is clearly a better gameplay match. " +
    "CRITICAL: do NOT anchor most picks to the same game. A soulslike must not be justified by a survival sandbox; a horror game should reference their horror games; an RPG should reference their RPGs. If a candidate matches NONE of their games well, ground the reason in a preferred genre/mechanic instead — never force an unrelated game. " +
    "Then write 2-3 reasons it fits THIS user, each naming the concrete signal (the matched played game + the shared gameplay emphasis, or a preferred genre/mechanic) and what specifically carries over. " +
    `BAN generic, reputation-based phrases that say nothing about this user, e.g. ${BANNED_REASON_PHRASES}. ` +
    "Never claim the user owns/played a game that isn't in the provided signals. Keep each reason one short sentence, and make every pick's reasons feel individually written. " +
    'Respond as JSON: {"headline": string (<=8 words), "summary": string (<=240 chars, why these picks for this user this week), ' +
    '"picks": [{"id": string, "matchScore": number 60-97, "category": string (<=3 words), "whyPicked": string[] (2-3 personalized reasons), "possibleConcerns": string[] (0-2 short caveats)}]}.';
  const user = JSON.stringify({
    taste: tasteContext(params.profile),
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
  deals: {
    id: string;
    matchScore: number;
    whyDealFits: string[];
    whyNow?: string;
    confidence?: "high" | "medium" | "low";
  }[];
};

export async function rankDealsWithAi(params: {
  profile: UserTasteProfile;
  deals: {
    id: string;
    title: string;
    discountPercent: number;
    genres: string[];
    anchorHint?: AiAnchorHint;
    hasRealDeal?: boolean;
  }[];
}): Promise<AiDealRanking | null> {
  const system =
    "You are GamePing's premium deal curator. You are given a user's taste profile (played-with-hours, tracked, saved, preferred genres/mechanics) and games with their best current price (some are genuinely discounted; some are merely priced). " +
    "Write copy ONLY — the final ordering is decided by the app from taste fit + real-deal quality, so you do not need to reorder, but you must keep reasons honest about whether a real discount exists ('hasRealDeal'). " +
    "For 'whyDealFits' (2-3 reasons): match each game to the user's CLOSEST game by GAMEPLAY — mechanics, progression, player agency, pacing, survival/simulation depth — not by tags or popularity; prefer the provided 'anchorHint', and VARY the anchor across deals (don't cite one game for everything). If nothing matches well, ground it in a preferred genre/mechanic. " +
    "'whyNow' = one short sentence: if hasRealDeal, name the discount/why it's worth acting on; if not, be honest (e.g. 'priced low' or 'track it for the next drop') — never imply a sale that isn't there. 'confidence' = how sure the taste fit is. " +
    `Do not invent prices. BAN generic phrases like ${BANNED_REASON_PHRASES}. ` +
    'Respond as JSON: {"headline": string (<=8 words), "summary": string (<=240 chars), ' +
    '"deals": [{"id": string, "matchScore": number 60-97, "whyDealFits": string[] (2-3 personalized reasons), "whyNow": string (<=90 chars), "confidence": "high"|"medium"|"low"}]}.';
  const user = JSON.stringify({
    taste: tasteContext(params.profile),
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
    "You are GamePing's 'gaming wrapped' writer — think Spotify Wrapped for gaming taste, personal and identity-driven, NOT an analytics dashboard. " +
    "Given a user's taste profile (the games they've PLAYED with hours, what they track/save, preferred genres/mechanics) and real activity stats, name their gaming personality and write a warm, specific recap. " +
    "Choose the archetype that best fits their behavior — prefer one of: The Explorer, The Strategist, The Story Hunter, The Completionist, The Challenge Seeker (or a close variant if clearly better). " +
    "Ground the summary in their actual most-played games and dominant genres (you may name a game and its hours). Use ONLY provided signals; never invent playtime or owned games. " +
    'Respond as JSON: {"personalityName": string (e.g. "The Explorer", <=3 words), "personalitySummary": string (<=200 chars, references their real patterns), ' +
    '"headline": string (<=8 words), "summary": string (<=240 chars)}.';
  const user = JSON.stringify({
    taste: tasteContext(params.profile),
    stats: params.stats,
  });
  return callJson<AiRecapResult>(system, user);
}
