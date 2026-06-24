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
  WEEKLY_REASON_TYPES,
  type HiddenGemCategory,
  type HiddenGemPick,
  type WeeklyCategory,
  type WeeklyGamePick,
  type WeeklyReasonType,
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

// How many candidates we show the model. Wide enough that the model can reject
// anything too visible and still comfortably reach the minimum pick count,
// bounded so token cost stays predictable.
const MAX_CANDIDATES = 50;
// Final pick counts (featured + grid). Mirrors the deterministic generator.
const HIDDEN_GEM_MIN = 8;
const HIDDEN_GEM_MAX = 13;
const WEEKLY_MIN = 6;
const WEEKLY_MAX = 10;

// Obvious "safe picks" / high-visibility titles the AI must avoid for Hidden
// Gems (over and above the franchise/classics blocklist applied to the RAWG
// pool). These are press darlings, viral hits, and hyped recent/upcoming games.
const HIDDEN_GEM_AVOID = [
  "Split Fiction", "Clair Obscur: Expedition 33", "Ultrakill", "Pikmin 2",
  "Hollow Knight: Silksong", "Hades", "Celeste", "Hollow Knight",
  "Stardew Valley", "Undertale", "Disco Elysium", "Outer Wilds", "Firewatch",
  "Journey", "Life is Strange", "What Remains of Edith Finch", "GRIS",
  // Viral / award-winning indie darlings that are widely known — NOT hidden.
  "Inscryption", "Baba Is You", "Monument Valley", "Monument Valley 2", "Tunic",
  "Cocoon", "Animal Well", "Balatro", "Vampire Survivors", "Papers, Please",
  // Old-but-famous publisher/franchise classics — never hidden gems.
  "Bully", "Professor Layton", "Fire Emblem", "Pokémon", "Mario", "Zelda",
  "Metroid", "Kirby", "Animal Crossing", "Castlevania", "Mega Man", "Silent Hill",
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

/** AI confidence → 0–100 int; defaults to 75 (above the deterministic baseline). */
function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 75;
  return Math.max(0, Math.min(100, Math.round(n)));
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
    "THE TEST FOR EVERY PICK: if an average gamer who follows indie or gaming news has probably heard of it, REJECT it. " +
    "REJECT, no matter how good or how old: famous indies; viral hits; huge publisher/franchise games (e.g. Rockstar titles, Nintendo first-party, and ANY long-running franchise even an older entry); famous console classics that younger players merely missed; highly anticipated recent or upcoming games; mainstream award or press darlings; Nintendo/Sony/Xbox first-party classics; and anything with very high visibility even if it is not AAA. " +
    "A hidden gem is NOT 'a classic younger players missed' — it is a genuinely overlooked game from a smaller studio. " +
    `Never pick these or anything like them: ${HIDDEN_GEM_AVOID.join(", ")}. ` +
    "PREFER: overlooked games; older cult favorites; small/medium games with strong quality; titles with credible ratings but modest visibility; and variety across genres and moods. " +
    "Only select from the provided candidates — never invent a game or an id. Ground every reason in the candidate's own genres/tags/era; do not fabricate awards, sales, or studios. " +
    "Write specific, vivid copy — avoid generic filler like 'worth a look', 'great gameplay', or 'fans will enjoy'. " +
    "Order best-first (the first pick becomes the featured gem). " +
    'Respond as JSON: {"picks": [{"id": number (must match a candidate id), ' +
    '"hook": string (<=90 chars, a vivid one-line draw — REQUIRED, non-empty), ' +
    '"whyHidden": string (<=180 chars, why it is overlooked / a gem — REQUIRED, non-empty), ' +
    '"whoFor": string (<=120 chars, who will love it — REQUIRED, non-empty), ' +
    `"discoveryTag": one of [${HIDDEN_GEM_CATEGORIES.map((c) => `"${c}"`).join(", ")}] (REQUIRED), ` +
    '"confidence": number 0-100 (REQUIRED)}]}.';

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
    // Fall back to the deterministic copy (always populated) when the model omits
    // a field, so editorial fields are never empty.
    const hook = nonEmpty(sel.hook) || nonEmpty(base.hook);
    const whyHidden = nonEmpty(sel.whyHidden) || nonEmpty(base.whyHidden);
    const whoFor = nonEmpty(sel.whoFor) || nonEmpty(base.whoFor);
    const confidence = clampConfidence(sel.confidence);

    picks.push({
      ...base,
      discoveryCategory: category,
      reason: whyHidden || base.reason,
      bestFor: whoFor || base.bestFor,
      standoutElement: hook || base.standoutElement,
      // Explicit editorial fields (Fix 1).
      hook,
      whyHidden,
      whoFor,
      discoveryTag: category,
      confidence,
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
  "upcoming-watch": "New & interesting",
};

/** Validate the model's reasonType against the allowed set (fallback new-release). */
function coerceReasonType(reasonType: string): WeeklyReasonType {
  const key = reasonType.trim().toLowerCase();
  const match = WEEKLY_REASON_TYPES.find((r) => r === key);
  return match ?? "new-release";
}

function coerceWeeklyCategory(
  reasonType: WeeklyReasonType,
  candidate: RawgCandidate
): WeeklyCategory {
  return REASON_TYPE_TO_CATEGORY[reasonType] ?? assignWeeklyCategory(candidate);
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
    `Curate a varied mix of ${WEEKLY_MIN}-${WEEKLY_MAX} games that answer ONE question: 'why is this worth paying attention to THIS WEEK?' — this is NOT just a list of recent releases. ` +
    "Every 'whyThisWeek' must give a concrete, CURRENT reason: a dated release/launch, a patch or update, a deal/sale/free offer, an event or anniversary, a reason to rediscover it now, or an under-the-radar gem to catch. " +
    "VARY the reasonType across picks — do not give most picks the same reasonType. " +
    "Do NOT fill the list with upcoming/unreleased games: AT MOST about one in four picks may be 'upcoming-watch', and only when there is a concrete announced date or event — never on hype alone. " +
    "A huge franchise, sequel, or hyped IP (e.g. Resident Evil, Final Fantasy, Life is Strange, Call of Duty, Zelda, Grand Theft Auto, Assassin's Creed) may ONLY appear if there is a SPECIFIC, concrete this-week reason (a dated launch, a real patch/update, a deal, or an event). " +
    "Marketing hype is NOT a reason: BAN phrases like 'most anticipated', 'highly anticipated', 'long-awaited', 'biggest release', 'blockbuster', 'fans can't wait' — if the only reason you can give is excitement, skip the game. " +
    "Only select from the provided candidates — never invent a game or an id. Ground every reason in the candidate's own genres/tags/era; do not fabricate prices, deals, or awards. " +
    "Write specific copy — BAN generic filler like 'worth a look', 'great gameplay', 'fans will enjoy', 'worth checking out', or 'a must-play'. " +
    "Order best-first (the first pick becomes the featured pick of the week). " +
    'Respond as JSON: {"picks": [{"id": number (must match a candidate id), ' +
    '"hook": string (<=90 chars — REQUIRED, non-empty), ' +
    '"whyThisWeek": string (<=180 chars, the concrete weekly angle — REQUIRED, non-empty), ' +
    `"reasonType": one of [${WEEKLY_REASON_TYPES.map((r) => `"${r}"`).join(", ")}] (REQUIRED), ` +
    '"whoFor": string (<=120 chars — REQUIRED, non-empty), ' +
    '"confidence": number 0-100 (REQUIRED)}]}.';

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
    const reasonType = coerceReasonType(nonEmpty(sel.reasonType));
    const category = coerceWeeklyCategory(reasonType, candidate);
    // Fall back to the deterministic copy (always populated) when the model omits
    // a field, so editorial fields are never empty.
    const hook = nonEmpty(sel.hook) || nonEmpty(base.hook);
    const whyThisWeek = nonEmpty(sel.whyThisWeek) || nonEmpty(base.whyThisWeek);
    const whoFor = nonEmpty(sel.whoFor) || nonEmpty(base.whoFor);
    const confidence = clampConfidence(sel.confidence);

    picks.push({
      ...base,
      category,
      whyThisWeek,
      bestFor: whoFor || base.bestFor,
      // Explicit editorial fields (Fix 1).
      hook,
      reasonType,
      whoFor,
      confidence,
      sourceNote: "AI-curated from live RAWG candidates.",
    });

    if (picks.length >= WEEKLY_MAX) break;
  }

  if (picks.length < WEEKLY_MIN) return null;

  return { featured: picks[0], picks: picks.slice(1) };
}
