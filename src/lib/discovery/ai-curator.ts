import "server-only";

import OpenAI from "openai";
import {
  assignHiddenCategory,
  assignWeeklyCategory,
  isBlockedTitle,
  toHiddenGemPick,
  toWeeklyGamePick,
} from "@/lib/discovery/live-discovery";
import {
  HIDDEN_GEM_CATEGORIES,
  type HiddenGemCategory,
  type HiddenGemPick,
  type WeeklyCategory,
  type WeeklyGamePick,
} from "@/lib/discovery/curated-picks";
import type { RawgCandidate } from "@/lib/rawg-discovery";

/**
 * AI CURATION layer for /hidden-gems and /games-of-the-week.
 *
 * This is a NEW, self-contained curation engine — it is NOT the recommendation
 * pipeline and does NOT touch /api/recommend or any existing AI prompt. It also
 * never invents games, images, or ids: the model only *selects* from and writes
 * editorial copy about a RAWG candidate pool we already fetched. The pick id /
 * image / slug always come from the real RAWG candidate, never from the model.
 *
 * Everything is best-effort: with no OPENAI_API_KEY, or on any error / timeout /
 * bad JSON / too few usable picks, these return null and the caller falls back
 * to the deterministic RAWG generator (live-discovery.ts).
 */

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 30_000;

// How many candidates we show the model (kept small to bound tokens/cost).
const MAX_CANDIDATES = 40;
// Final pick counts (featured + grid). Mirrors the deterministic generator.
const HIDDEN_GEM_MIN = 8;
const HIDDEN_GEM_MAX = 13;
const WEEKLY_MIN = 6;
const WEEKLY_MAX = 10;

// Obvious "safe picks" the AI should avoid for Hidden Gems (over and above the
// franchise/classics blocklist already applied to the RAWG pool).
const HIDDEN_GEM_AVOID = [
  "Hades", "Hollow Knight", "Celeste", "Disco Elysium", "Undertale",
  "Stardew Valley", "Outer Wilds", "Firewatch", "Journey", "Life is Strange",
  "What Remains of Edith Finch", "GRIS",
];

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
        temperature: 0.5,
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
    console.warn("[discovery:ai-curator] call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** Compact candidate summary fed to the model (no images, bounded size). */
function summarizeCandidate(c: RawgCandidate) {
  return {
    id: c.id,
    title: c.name,
    released: c.released ?? null,
    rating: typeof c.rating === "number" ? c.rating : null,
    ratingsCount: typeof c.ratings_count === "number" ? c.ratings_count : null,
    popularity: typeof c.added === "number" ? c.added : null,
    metacritic: typeof c.metacritic === "number" ? c.metacritic : null,
    genres: (c.genres ?? []).map((g) => g.name).slice(0, 5),
    tags: (c.tags ?? []).map((t) => t.name).slice(0, 8),
  };
}

function nonEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// ---------------------------------------------------------------------------
// Hidden Gems
// ---------------------------------------------------------------------------

type AiHiddenGemSelection = {
  picks: Array<{
    id: number | string;
    hook?: string;
    whyHidden?: string;
    whoFor?: string;
    discoveryTag?: string;
    confidence?: number;
  }>;
};

function coerceHiddenCategory(
  tag: string,
  candidate: RawgCandidate
): HiddenGemCategory {
  const match = HIDDEN_GEM_CATEGORIES.find(
    (cat) => cat.toLowerCase() === tag.trim().toLowerCase()
  );
  return match ?? assignHiddenCategory(candidate);
}

/**
 * Ask the model to curate the final Hidden Gems list from the RAWG pool. Returns
 * null (→ deterministic fallback) if OpenAI is unavailable or too few picks map
 * back to real candidates.
 */
export async function curateHiddenGemsWithAi(
  pool: RawgCandidate[]
): Promise<{ featured: HiddenGemPick; picks: HiddenGemPick[] } | null> {
  if (pool.length < HIDDEN_GEM_MIN) return null;

  const byId = new Map<number, RawgCandidate>();
  for (const c of pool) byId.set(c.id, c);

  const system =
    "You are GamePing's hidden-gems editor — a sharp, opinionated gaming curator, NOT a search engine. " +
    "You are given a pre-filtered pool of overlooked games (already fetched from a game database). " +
    `Choose the ${HIDDEN_GEM_MIN}-${HIDDEN_GEM_MAX} BEST genuine hidden gems: underplayed, under-discussed, high-quality games with a strong identity. ` +
    "Prefer variety across genres/moods. " +
    `Avoid obvious 'safe picks' even if present: ${HIDDEN_GEM_AVOID.join(", ")}. ` +
    "Only select from the provided candidates — never invent a game or an id. Ground every reason in the candidate's own genres/tags/era; do not fabricate awards, sales, or studios. " +
    "Order best-first (the first pick becomes the featured gem). " +
    'Respond as JSON: {"picks": [{"id": number (must match a candidate id), ' +
    '"hook": string (<=90 chars, a vivid one-line draw), ' +
    '"whyHidden": string (<=180 chars, why it is overlooked / a gem), ' +
    '"whoFor": string (<=120 chars, who will love it), ' +
    `"discoveryTag": one of [${HIDDEN_GEM_CATEGORIES.map((c) => `"${c}"`).join(", ")}], ` +
    '"confidence": number 0-100}]}.';

  const user = JSON.stringify({
    candidates: pool.slice(0, MAX_CANDIDATES).map(summarizeCandidate),
  });

  const result = await callJson<AiHiddenGemSelection>(system, user);
  if (!result || !Array.isArray(result.picks)) return null;

  const seen = new Set<number>();
  const picks: HiddenGemPick[] = [];

  for (const sel of result.picks) {
    const id = Number(sel.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    const candidate = byId.get(id);
    if (!candidate) continue; // model hallucinated an id → skip
    if (isBlockedTitle(candidate.name)) continue;

    const base = toHiddenGemPick(candidate);
    if (!base) continue; // no usable image → skip

    seen.add(id);
    const category = coerceHiddenCategory(nonEmpty(sel.discoveryTag), candidate);
    const hook = nonEmpty(sel.hook);
    const whyHidden = nonEmpty(sel.whyHidden);
    const whoFor = nonEmpty(sel.whoFor);

    picks.push({
      ...base,
      discoveryCategory: category,
      reason: whyHidden || base.reason,
      bestFor: whoFor || base.bestFor,
      standoutElement: hook || base.standoutElement,
      sourceNote: "AI-curated from live RAWG candidates.",
    });

    if (picks.length >= HIDDEN_GEM_MAX) break;
  }

  if (picks.length < HIDDEN_GEM_MIN) return null;

  return { featured: picks[0], picks: picks.slice(1) };
}

// ---------------------------------------------------------------------------
// Games of the Week
// ---------------------------------------------------------------------------

type WeeklyReasonType =
  | "new-release"
  | "rediscovered"
  | "trending"
  | "hidden-pick"
  | "timeless-pick";

type AiWeeklySelection = {
  picks: Array<{
    id: number | string;
    hook?: string;
    whyThisWeek?: string;
    reasonType?: string;
    whoFor?: string;
    confidence?: number;
  }>;
};

const REASON_TYPE_TO_CATEGORY: Record<WeeklyReasonType, WeeklyCategory> = {
  "new-release": "New & interesting",
  rediscovered: "Worth replaying",
  trending: "New & interesting",
  "hidden-pick": "Hidden pick",
  "timeless-pick": "Worth replaying",
};

function coerceWeeklyCategory(
  reasonType: string,
  candidate: RawgCandidate
): WeeklyCategory {
  const key = reasonType.trim().toLowerCase() as WeeklyReasonType;
  return REASON_TYPE_TO_CATEGORY[key] ?? assignWeeklyCategory(candidate);
}

/**
 * Ask the model to curate the weekly mix from the RAWG pool. Returns null (→
 * deterministic fallback) if OpenAI is unavailable or too few picks map back.
 */
export async function curateWeeklyWithAi(
  pool: RawgCandidate[]
): Promise<{ featured: WeeklyGamePick; picks: WeeklyGamePick[] } | null> {
  if (pool.length < WEEKLY_MIN) return null;

  const byId = new Map<number, RawgCandidate>();
  for (const c of pool) byId.set(c.id, c);

  const system =
    "You are GamePing's weekly games editor. You are given a pool of recent and notable games (already fetched from a game database). " +
    `Curate a varied mix of ${WEEKLY_MIN}-${WEEKLY_MAX} games 'worth paying attention to this week' — not just a list of new releases. ` +
    "Blend new releases, rediscovered older games, trending picks, and a hidden pick or two. " +
    "Only select from the provided candidates — never invent a game or an id. Ground every reason in the candidate's own genres/tags/era; do not fabricate prices, deals, or awards. " +
    "Order best-first (the first pick becomes the featured pick of the week). " +
    'Respond as JSON: {"picks": [{"id": number (must match a candidate id), ' +
    '"hook": string (<=90 chars), ' +
    '"whyThisWeek": string (<=180 chars, why it deserves attention now), ' +
    '"reasonType": one of ["new-release","rediscovered","trending","hidden-pick","timeless-pick"], ' +
    '"whoFor": string (<=120 chars), ' +
    '"confidence": number 0-100}]}.';

  const user = JSON.stringify({
    candidates: pool.slice(0, MAX_CANDIDATES).map(summarizeCandidate),
  });

  const result = await callJson<AiWeeklySelection>(system, user);
  if (!result || !Array.isArray(result.picks)) return null;

  const seen = new Set<number>();
  const picks: WeeklyGamePick[] = [];

  for (const sel of result.picks) {
    const id = Number(sel.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    const candidate = byId.get(id);
    if (!candidate) continue;

    const base = toWeeklyGamePick(candidate);
    if (!base) continue;

    seen.add(id);
    const category = coerceWeeklyCategory(nonEmpty(sel.reasonType), candidate);
    const whyThisWeek = nonEmpty(sel.whyThisWeek);
    const whoFor = nonEmpty(sel.whoFor);

    picks.push({
      ...base,
      category,
      whyThisWeek: whyThisWeek || base.whyThisWeek,
      bestFor: whoFor || base.bestFor,
      sourceNote: "AI-curated from live RAWG candidates.",
    });

    if (picks.length >= WEEKLY_MAX) break;
  }

  if (picks.length < WEEKLY_MIN) return null;

  return { featured: picks[0], picks: picks.slice(1) };
}
