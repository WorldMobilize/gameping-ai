import {
  extractRecommendResultTitles,
  logRecommendRun,
} from "@/lib/recommend-runs";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getCachedAiRecommendation,
  hashNormalizedInput,
  setCachedAiRecommendation,
} from "@/lib/cache";
import { hasMeaningfulRecommendInput } from "@/lib/recommend-input";
import { PROMPT_MAX_DEFAULT } from "@/lib/recommend-limits";
import {
  getPromptMaxChars,
  getRecommendDailyLimit,
  shouldBypassRecommendLimits,
  tryConsumeRecommendDailySlot,
} from "@/lib/recommend-usage";
import { buildLimitErrorPayload } from "@/lib/product-copy";
import {
  applyDiversityScoreAdjustments,
  balanceFinalPicksDiversity,
  buildDeterministicFallbackPicks,
  buildRecoveryReason,
  RECOVERY_MAX_ADDITIONS,
  RECOVERY_MAX_TOTAL_PICKS,
} from "@/lib/recommend-diversity-rerank";
import { blockUnverifiedLoggedInUser } from "@/lib/require-verified-email";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import {
  buildFastPickCandidateById,
  buildVerifiedBySuggestedTitle,
  lookupVerifiedForFastPickTitle,
} from "@/lib/fast-pick-verified-lookup";
import {
  dedupeCandidates,
  fetchRawgFirstScreenshotUrl,
  fetchRawgGameDetails,
  fetchRawgCandidates,
  isLowQualityTitle,
  searchRawgByTitle,
  scoreCandidates,
  selectDiverseTop,
  titleMatchQuality,
  type RawgCandidate,
} from "@/lib/rawg-discovery";
import {
  aiFirstDiscovery,
  isAbortLikeError,
  aiSingleCallFastDiscovery,
  minimalDiscoveryFallback,
  type AiSuggestedTitle,
} from "@/lib/ai-game-discovery";
import {
  extractMustHaveConstraints,
  isFantasyRaceStrategyMustHave,
  shouldRejectFastPickForMustHave,
  buildDisambiguationRules,
  buildSubjectContextForIntent,
  detectIntentSignals,
  detectResultCountPolicy,
  enrichPromptForDiscovery,
  mergeIntentAugmentation,
  reorderFastPicksByRelevance,
  trimFastPicksToConfidence,
  promptForRetrievalKeywords,
  sanitizeCoreKeywordsForSignals,
  sanitizeDiscoveryQueries,
  sanitizeIntentKeywordSet,
  scoreCandidateRelevanceBoost,
  shouldAdmitRawgFallbackCandidate,
  shouldRejectCandidateForSignals,
  isHorrorKeywordShovelwareTitle,
  isSteamDeckTitleKeywordSpam,
  isDiscoveryShovelwareTitle,
  EMPTY_INTENT_SIGNALS,
  type IntentSignals,
} from "@/lib/intent-normalization";
import { scoreCanonicalTitlePreference } from "@/lib/canonical-title-preference";

type VerifiedCandidate = RawgCandidate & {
  _suggested?: {
    title: string;
    confidence: number;
    expectedMatch: string;
    reason: string;
    titleMatch: number;
  };
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type RecommendDebug = {
  cacheHit: boolean;
  cacheHitSource?: "early" | "full";
  inputHash: string;
  resolvedInput?: string;
  noCache?: boolean;
  cacheReadSkipped?: boolean;
  cacheWriteSkipped?: boolean;
  pricingMode?: "details_only" | "live" | "cards_only_no_live_pricing";
  recommendLivePrices?: boolean;
  models: {
    discovery: string;
    relevance: string;
    rerank: string;
  };
  env: {
    hasOpenAiKey: boolean;
    hasRawgKey: boolean;
    nodeEnv?: string;
    siteUrl?: string;
  };
  candidates: {
    beforeAiFilter: number;
    afterAiFilter: number;
  };
  selected: {
    titles: string[];
  };
  finalResponse: {
    count: number;
    titles: string[];
  };
  cheapSharkProbe?: {
    rawgTitle: string;
    cheapsharkQuery: string;
    cheapsharkUrl: string;
    rawCheapSharkResults: string[];
    scores: Array<{ title: string; score: number; rejected?: string }>;
    selectedCheapSharkTitle?: string;
    selectedDealId?: string;
    selectedPrice?: string;
    rejectedReason?: string;
  };
  filtersEnabled?: boolean;
  usageLimit?: {
    plan: string | null;
    bypass: boolean;
    used: number;
    /** Null when limits are bypassed (admin / dev); otherwise daily slot limit. */
    limit: number | null;
    allowed?: boolean;
    dailyCap?: number;
  };
  cheapShark: Array<{
    game: string;
    query: string;
    matched: boolean;
    matchedTitle?: string;
    cheapest?: string;
    dealId?: string;
    storeId?: string;
    reason?: string;
    debug?: {
      cheapsharkUrl: string;
      rawResults: Array<{ title: string; cheapest?: string; dealId?: string; storeId?: string }>;
      scores: Array<{ title: string; score: number; rejected?: string }>;
      selectedScore?: number;
    };
  }>;
};

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function nowMs() {
  return performance.now();
}

function scheduleRecommendRunLog(params: {
  promptText: string;
  routeStarted: number;
  games?: unknown[];
  success: boolean;
  errorCode?: string | null;
}) {
  const titles =
    params.success && params.games
      ? extractRecommendResultTitles(params.games)
      : [];
  void logRecommendRun({
    promptText: params.promptText,
    latencyMs: Math.round(nowMs() - params.routeStarted),
    resultsCount: params.success ? titles.length : 0,
    resultTitles: params.success ? titles : [],
    success: params.success,
    errorCode: params.errorCode ?? null,
  });
}

async function timed<T>(label: string, fn: () => Promise<T>) {
  const start = nowMs();
  try {
    const value = await fn();
    return { value, ms: nowMs() - start };
  } catch (error) {
    const ms = nowMs() - start;
    const err = error as unknown as { name?: unknown; message?: unknown };
    console.warn("[recommend:timing:error]", {
      label,
      ms: Math.round(ms),
      name: typeof err?.name === "string" ? err.name : undefined,
      message: typeof err?.message === "string" ? err.message.slice(0, 160) : undefined,
    });
    throw error;
  }
}

type CheapSharkRow = {
  cheapest?: unknown;
  cheapestDealID?: unknown;
  external?: unknown;
  storeID?: unknown;
};

const CHEAPSHARK_BAD_WORDS = [
  "dlc",
  "soundtrack",
  "ost",
  "demo",
  "expansion",
  "pack",
  "bundle",
] as const;

const TITLE_NOISE_WORDS = [
  "edition",
  "definitive",
  "remastered",
  "goty",
  "game",
  "of",
  "the",
  "year",
  "complete",
  "ultimate",
  "deluxe",
  "collection",
  "bundle",
  "pack",
] as const;

function normalizeTitleForMatch(title: string) {
  return title
    .toLowerCase()
    .replace(/[\u2019']/g, "") // quotes/apostrophes
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokensForMatch(title: string) {
  const t = normalizeTitleForMatch(title);
  if (!t) return [];
  return t
    .split(" ")
    .filter(Boolean)
    .filter((tok) => !TITLE_NOISE_WORDS.includes(tok as (typeof TITLE_NOISE_WORDS)[number]));
}

function jaccardTokens(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function containsBadWords(title: string) {
  const t = normalizeTitleForMatch(title);
  return CHEAPSHARK_BAD_WORDS.some((w) => t.includes(w));
}

type MatchTier = "best_match" | "good_alternative" | "partial_match";

function extractReferenceTitlesFromPrompt(prompt: string): string[] {
  const out = new Set<string>();
  const patterns: RegExp[] = [
    /\btipo\s+(.+?)(?:[.!?]|$)/i,
    /\bsimili?\s+a\s+(.+?)(?:[.!?]|$)/i,
    /\bcome\s+(.+?)(?:[.!?]|$)/i,
    /\balternative?\s+a\s+(.+?)(?:[.!?]|$)/i,
    /\bsimilar\s+to\s+(.+?)(?:[.!?]|$)/i,
    /\bgames?\s+like\s+(.+?)(?:[.!?]|$)/i,
    /\blike\s+(.+?)(?:[.!?]|$)/i,
  ];
  for (const re of patterns) {
    const m = prompt.match(re);
    if (m?.[1]) {
      let t = m[1].trim();
      t = t.replace(/^["'«»]+|["'«»]+$/g, "").trim();
      t = t.replace(/\s+(for|per|on|su)\s+.*$/i, "").trim();
      if (t.length >= 2) out.add(t);
    }
  }
  return [...out];
}

function isExplicitTitleLookupQuery(prompt: string): boolean {
  const q = prompt.trim();
  if (
    /^(trova|cerca|find|search|show\s+me|mostrami|dammi|give\s+me)\s+/i.test(q)
  ) {
    return true;
  }
  if (
    /\b(prezzo|price|sconto|discount|deal|quanto\s+costa|how\s+much)\b/i.test(q)
  ) {
    return true;
  }
  return false;
}

function ingestTagLikeField(acc: Set<string>, v: unknown) {
  if (v == null) return;
  if (typeof v === "string") {
    for (const part of v.split(",")) {
      const t = part.trim().toLowerCase();
      if (t) acc.add(t);
    }
    return;
  }
  if (Array.isArray(v)) {
    for (const x of v) {
      if (typeof x === "string" && x.trim()) acc.add(x.trim().toLowerCase());
    }
  }
}

/**
 * Merges explicit selectedTags + genre/playstyle/vibes/mechanics from raw JSON and normalized strings.
 */
function resolveSelectedTagsList(
  rawBody: unknown,
  normalized: {
    selectedTags: string;
    genres: string;
    playStyles: string;
    vibes: string;
    mechanics: string;
  }
): string[] {
  const b = (rawBody ?? {}) as Record<string, unknown>;
  const acc = new Set<string>();

  ingestTagLikeField(acc, b.selectedTags);
  ingestTagLikeField(acc, b.genres);
  ingestTagLikeField(acc, b.playStyles);
  ingestTagLikeField(acc, b.vibes);
  ingestTagLikeField(acc, b.mechanics);
  ingestTagLikeField(acc, b.tags);

  ingestTagLikeField(acc, normalized.selectedTags);
  ingestTagLikeField(acc, normalized.genres);
  ingestTagLikeField(acc, normalized.playStyles);
  ingestTagLikeField(acc, normalized.vibes);
  ingestTagLikeField(acc, normalized.mechanics);

  return [...acc].sort();
}

function augmentIslandSurvivalFallbackQueries(params: {
  queries: string[];
  userPrompt: string;
  normalizedIntent: string;
  coreNeeds: string[];
  resolvedTags: string[];
}): string[] {
  const existing = new Set(params.queries.map((q) => q.trim().toLowerCase()));
  const out = [...params.queries];
  const blob = [
    params.userPrompt,
    params.normalizedIntent,
    ...params.coreNeeds,
    ...params.resolvedTags,
  ]
    .join(" ")
    .toLowerCase();

  const islandish = /\b(island|isola|isole|desert|deserta|beach|ocean|raft|shore|strand|sea)\b/i.test(
    blob
  );
  const buildCraft =
    /\b(survival|sopravvivenza|craft|crafting|build|building|costru|gather)\b/i.test(blob);

  if (islandish && buildCraft) {
    const extra = [
      "deserted island survival crafting",
      "island survival building",
      "ocean survival crafting",
      "survival crafting island",
    ];
    for (const q of extra) {
      const k = q.trim().toLowerCase();
      if (!existing.has(k)) {
        out.push(q);
        existing.add(k);
      }
    }
  }
  return out.slice(0, 14);
}

function titleMatchScore(rawgTitle: string, cheapTitle: string) {
  const aNorm = normalizeTitleForMatch(rawgTitle);
  const bNorm = normalizeTitleForMatch(cheapTitle);
  if (!aNorm || !bNorm) return 0;
  if (aNorm === bNorm) return 1;
  if (aNorm.length >= 4 && (aNorm.includes(bNorm) || bNorm.includes(aNorm))) return 0.93;

  const aTok = titleTokensForMatch(rawgTitle);
  const bTok = titleTokensForMatch(cheapTitle);
  const ja = jaccardTokens(aTok, bTok);

  // Require at least 2 shared tokens for multi-word titles.
  const shared = aTok.filter((t) => bTok.includes(t)).length;
  if (aTok.length >= 3 && shared < 2) return Math.min(ja, 0.45);
  return ja;
}

async function _getCheapSharkEnrichment(rawgTitle: string): Promise<{
  matched: boolean;
  price: string;
  buyLink: string | null;
  matchedTitle?: string;
  dealId?: string;
  storeId?: string;
  reason?: string;
  debug?: {
    cheapsharkUrl: string;
    rawResults: Array<{ title: string; cheapest?: string; dealId?: string; storeId?: string }>;
    scores: Array<{ title: string; score: number; rejected?: string }>;
    selectedScore?: number;
  };
}> {
  const query = rawgTitle;
  const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
    query
  )}&limit=5`;

  const fetchOnce = async () => fetch(url);

  let res = await fetchOnce();

  // CheapShark can rate-limit Vercel IPs. One retry with a short backoff.
  if (res.status === 429) {
    await sleep(800);
    res = await fetchOnce();
    if (res.status === 429) {
      return {
        matched: false,
        price: "N/A",
        buyLink: null,
        reason: "CheapShark HTTP 429 after retry",
        debug: {
          cheapsharkUrl: url,
          rawResults: [],
          scores: [],
        },
      };
    }
  }

  if (!res.ok) {
    return {
      matched: false,
      price: "N/A",
      buyLink: null,
      reason: `CheapShark HTTP ${res.status}`,
      debug: {
        cheapsharkUrl: url,
        rawResults: [],
        scores: [],
      },
    };
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || data.length === 0) {
    return {
      matched: false,
      price: "N/A",
      buyLink: null,
      reason: "No CheapShark results",
      debug: {
        cheapsharkUrl: url,
        rawResults: [],
        scores: [],
      },
    };
  }

  let best: { score: number; row: CheapSharkRow } | null = null;
  const debugRawResults: Array<{
    title: string;
    cheapest?: string;
    dealId?: string;
    storeId?: string;
  }> = [];
  const debugScores: Array<{ title: string; score: number; rejected?: string }> = [];

  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as CheapSharkRow;
    const ext = typeof row.external === "string" ? row.external : "";
    if (!ext) continue;
    const cheapest = typeof row.cheapest === "string" ? row.cheapest : undefined;
    const dealId =
      typeof row.cheapestDealID === "string" ? row.cheapestDealID : undefined;
    const storeId = typeof row.storeID === "string" ? row.storeID : undefined;
    debugRawResults.push({ title: ext, cheapest, dealId, storeId });

    if (containsBadWords(ext)) {
      debugScores.push({ title: ext, score: 0, rejected: "bad_words" });
      continue;
    }

    const score = titleMatchScore(rawgTitle, ext);
    debugScores.push({ title: ext, score });
    if (!best || score > best.score) {
      best = { score, row };
    }
  }

  if (!best) {
    return {
      matched: false,
      price: "N/A",
      buyLink: null,
      reason: "No acceptable match",
      debug: {
        cheapsharkUrl: url,
        rawResults: debugRawResults.slice(0, 5),
        scores: debugScores.slice(0, 5),
      },
    };
  }

  // Threshold: avoid obvious mismatches.
  if (best.score < 0.62) {
    return {
      matched: false,
      price: "N/A",
      buyLink: null,
      matchedTitle: typeof best.row.external === "string" ? best.row.external : undefined,
      reason: `Match score too low (${best.score.toFixed(2)})`,
      debug: {
        cheapsharkUrl: url,
        rawResults: debugRawResults.slice(0, 5),
        scores: debugScores.slice(0, 5),
        selectedScore: best.score,
      },
    };
  }

  const cheapest = typeof best.row.cheapest === "string" ? best.row.cheapest : "N/A";
  const dealId = typeof best.row.cheapestDealID === "string" ? best.row.cheapestDealID : undefined;
  const storeId = typeof best.row.storeID === "string" ? best.row.storeID : undefined;

  return {
    matched: cheapest !== "N/A" && Boolean(dealId),
    price: cheapest !== "N/A" ? cheapest : "N/A",
    buyLink: dealId ? `https://www.cheapshark.com/redirect?dealID=${dealId}` : null,
    matchedTitle: typeof best.row.external === "string" ? best.row.external : undefined,
    dealId,
    storeId,
    reason: dealId ? undefined : "No dealId on best match",
    debug: {
      cheapsharkUrl: url,
      rawResults: debugRawResults.slice(0, 5),
      scores: debugScores.slice(0, 5),
      selectedScore: best.score,
    },
  };
}

// Keep the helper for future pricing-cache work without enabling live lookups in /api/recommend.
// Referenced to avoid unused warnings.
void _getCheapSharkEnrichment;

type AiRelevanceResult = {
  rawgId: number;
  name: string;
  relevant: boolean;
  confidence: number; // 0..1
  reason: string;
  matchedNeeds: string[];
  missingNeeds: string[];
};

async function enrichWithRawgDetails(params: {
  rawgKey: string;
  candidates: VerifiedCandidate[];
  maxToFetch: number;
}) {
  const { rawgKey, candidates, maxToFetch } = params;
  const slice = candidates.slice(0, Math.max(0, maxToFetch));
  const RAWG_DETAIL_CONCURRENCY = 4;
  const details = await mapPool(slice, RAWG_DETAIL_CONCURRENCY, async (c) => {
    const d = await fetchRawgGameDetails({ rawgApiKey: rawgKey, rawgId: c.id });
    return d ? ([c.id, d] as const) : null;
  });
  const byId = new Map<number, NonNullable<(typeof details)[number]>[1]>();
  for (const item of details) {
    if (!item) continue;
    byId.set(item[0], item[1]);
  }

  return candidates.map((c) => {
    const d = byId.get(c.id);
    if (!d) return c;
    return {
      ...c,
      description_raw: d.description_raw ?? c.description_raw ?? null,
      platforms: d.platforms ?? c.platforms,
      stores: d.stores ?? c.stores,
    };
  });
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Bounded concurrency for RAWG calls (avoid serial stalls without bursting the API). */
async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  };
  const workers = Math.min(Math.max(1, concurrency), Math.max(1, items.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

/** Deterministic pre-rerank pool cap (diversity-preserving trim happens via selectDiverseTop). */
const PRERANK_POOL_MAX = 22;

function normalizeRelevanceResults(v: unknown): AiRelevanceResult[] {
  if (!Array.isArray(v)) return [];
  const out: AiRelevanceResult[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const rawgId =
      typeof rec.rawgId === "number"
        ? rec.rawgId
        : typeof rec.rawgId === "string"
          ? Number(rec.rawgId)
          : NaN;
    if (!Number.isFinite(rawgId)) continue;
    const name = typeof rec.name === "string" ? rec.name : "";
    const relevant = rec.relevant === true;
    const confRaw =
      typeof rec.confidence === "number"
        ? rec.confidence
        : typeof rec.confidence === "string"
          ? Number(rec.confidence)
          : 0;
    const confidence = clamp(Number.isFinite(confRaw) ? confRaw : 0, 0, 1);
    const reason = typeof rec.reason === "string" ? rec.reason : "";
    const matchedNeeds = Array.isArray(rec.matchedNeeds)
      ? (rec.matchedNeeds as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 8)
      : [];
    const missingNeeds = Array.isArray(rec.missingNeeds)
      ? (rec.missingNeeds as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 8)
      : [];
    out.push({
      rawgId: Number(rawgId),
      name,
      relevant,
      confidence,
      reason,
      matchedNeeds,
      missingNeeds,
    });
  }
  return out;
}

function trimDescription(raw: string | null | undefined, maxChars: number): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}

/** Slim RAWG rows for semantic relevance — descriptions truncated; stores omitted (low signal vs cost). */
function buildSemanticFilterCandidatePayload(
  c: VerifiedCandidate,
  compact: boolean
): Record<string, unknown> {
  const descLimit = compact ? 120 : 240;
  const desc = trimDescription(c.description_raw ?? null, descLimit);
  const row: Record<string, unknown> = {
    rawgId: c.id,
    name: c.name,
    genres: (c.genres ?? []).map((g) => g.name).slice(0, compact ? 5 : 7),
    tags: (c.tags ?? []).map((t) => t.name).slice(0, compact ? 8 : 12),
    platforms: (c.platforms ?? []).slice(0, compact ? 4 : 6),
    released: c.released ?? null,
    rating: typeof c.rating === "number" ? c.rating : null,
  };
  if (c.slug) row.slug = c.slug;
  if (desc) row.desc = desc;
  return row;
}

/** Slim pool JSON for final rerank — shorter descriptions and compact aiHint. */
function buildRerankCandidatePayload(
  c: VerifiedCandidate,
  compact: boolean
): Record<string, unknown> {
  const descLimit = compact ? 100 : 220;
  const desc = trimDescription(c.description_raw ?? null, descLimit);
  const sug = (c as VerifiedCandidate)._suggested;
  const row: Record<string, unknown> = {
    id: c.id,
    name: c.name,
    genres: (c.genres ?? []).map((g) => g.name).slice(0, compact ? 5 : 7),
    tags: (c.tags ?? []).map((t) => t.name).slice(0, compact ? 8 : 10),
    released: c.released ?? null,
    rating: typeof c.rating === "number" ? c.rating : null,
  };
  if (desc) row.desc = desc;
  if (sug) {
    row.aiHint = {
      c: sug.confidence,
      m: (sug.expectedMatch || "").slice(0, 72),
    };
  }
  return row;
}

/**
 * Extra instructions when the prompt implies concrete requirements (combat, multiplayer, etc.).
 * Does not log — text is only embedded in model prompts.
 */
/** Italian vs English for user-facing reason / matchNote copy. */
function inferRecommendCopyLocale(text: string): "it" | "en" {
  const t = (text || "").trim();
  if (!t) return "en";
  if (/[àèéìòù]/i.test(t)) return "it";
  if (
    /\b(vorrei|cioè|però|anche|giochi|gioco|simile|simili|tipo|sera|amici|cozy|quando|questo|quella|più|meno|lungo|breve|costruire|combatti|progressione|rilassante|storia|pve|pvp)\b/i.test(
      t
    )
  ) {
    return "it";
  }
  return "en";
}

function rerankCopyStyleBlock(locale: "it" | "en"): string {
  const langLabel = locale === "it" ? "Italian" : "English";
  return `
Voice for "reason" and "matchNote" (user-facing copy in ${langLabel}):
- Sound like a knowledgeable gamer explaining why this pick fits the user's mood/request — not a store listing or Wikipedia summary.
- Personalize to the user's prompt (experience, loop, pacing, co-op/solo, vibe). Do not recite generic genre features.

AVOID in "reason":
- "This game is an open-world RPG that…" / "It offers features such as…" / "Matches because…"
- Feature-list intros, marketing hype, cringe slang, overly formal tone

PREFER (natural ${langLabel}, adapt freely):
${
  locale === "it"
    ? `- "Perfetto se vuoi…" / "Funziona bene quando cerchi…" / "Rispetto agli altri pick, questo è più…" / "Ha quella sensazione da 'ancora una run e poi smetto' se ti piace…"`
    : `- "Great if you want…" / "Works well when you're after…" / "Compared to the other picks, this leans more…" / "Has that 'one more run' pull if you like…"`
}

"matchNote": one short sentence (same language). Tradeoffs for good_alternative/partial_match; for best_match use "" or a tiny fit hook.
${
  locale === "it"
    ? `Examples: "Più crafting e progressione, meno cozy puro." / "Più PvE e loot, meno caos stile Splatoon."`
    : `Examples: "More crafting grind, less pure cozy." / "More PvE loot, less Splatoon-style chaos."`
}

Result discipline:
- Prefer 3–4 excellent picks over 6 mediocre ones.
- Do not write confident "reason" text for weak fits; use partial_match / good_alternative honestly or omit the game.
`;
}

function explicitRequirementPenaltyBlock(params: {
  userQuery: string;
  coreNeeds: string[];
  mechanicsLine: string;
  vibesLine: string;
}): string {
  const hints = new Set<string>();
  const q = params.userQuery;

  const pairs: Array<{ re: RegExp; tag: string }> = [
    {
      re: /\b(co[-\s]?op|coop|multi(player)?|online\s+multi|pvp\s+online)\b/i,
      tag: "multiplayer/co-op",
    },
    { re: /\b(with\s+)?combat\b|\bcombat[-\s]?heavy\b|\baction\s+combat\b/i, tag: "combat" },
    {
      re: /\bhard(mode)?\b|\bdifficult\b|\bchallenging\b|\bsouls(like)?\b|\broguelike\b/i,
      tag: "difficulty/challenge",
    },
    {
      re: /\bstor(y|ies|ytelling)\b|\bnarrative\b|\bdialogue\b|\bemotional\b|\bcharacter[-\s]driven\b/i,
      tag: "story/narrative",
    },
    { re: /\bfarm(ing)?\b|\bcozy\b|\bwholesome\b/i, tag: "cozy/farming tone" },
    { re: /\bsingle[-\s]?player\b|\bsolo\b/i, tag: "single-player" },
    { re: /\bopen\s+world\b|\bexploration\b/i, tag: "exploration" },
    { re: /\bfps\b|\bshooter\b|\bfirst[-\s]person\b/i, tag: "shooting/FPS" },
    { re: /\bpuzzle\b|\bplatformer\b/i, tag: "puzzle/platforming" },
  ];
  for (const { re, tag } of pairs) {
    if (re.test(q)) hints.add(tag);
  }
  for (const n of params.coreNeeds) {
    const t = n.trim();
    if (t.length > 2 && t.length < 48) hints.add(t);
  }
  const mech = params.mechanicsLine.trim();
  if (mech.length > 2 && mech.length < 120 && !/^not specified$/i.test(mech)) {
    hints.add(`mechanics:${mech.slice(0, 56)}`);
  }
  const vibes = params.vibesLine.trim();
  if (vibes.length > 2 && vibes.length < 120 && !/^not specified$/i.test(vibes)) {
    hints.add(`vibes:${vibes.slice(0, 56)}`);
  }

  if (hints.size === 0) return "";

  const summary = [...hints].slice(0, 12).join("; ");
  return `
Explicit asks inferred from user signal: ${summary}
When an ask above is substantive (e.g. combat, multiplayer, narrative depth, difficulty) and a candidate only pays lip service—or contradicts it—set relevant=false for filtering. For reranking, assign partial_match or good_alternative with candid, human matchNotes (not robotic labels) and modest match scores; do not use best_match for weak alignment. Prefer three or four excellent fits over five or six mediocre ones.
`;
}

async function aiSemanticRelevanceFilter(params: {
  openai: OpenAI;
  userQuery: string;
  normalizedIntent: string;
  coreNeeds: string[];
  avoid: string[];
  candidates: VerifiedCandidate[];
  budgetHint: string;
  selectedTagsLine: string;
  filtersEnabled: boolean;
  mechanicsLine: string;
  vibesLine: string;
}) {
  const {
    openai,
    userQuery,
    normalizedIntent,
    coreNeeds,
    avoid,
    candidates,
    budgetHint,
    selectedTagsLine,
    filtersEnabled,
    mechanicsLine,
    vibesLine,
  } = params;

  if (candidates.length === 0) return { kept: [] as VerifiedCandidate[], usage: null as unknown };

  const constraintRule = filtersEnabled
    ? `- Weight selected tags and budget seriously: a candidate that ignores stated genres/tags or clearly violates budget spirit should be marked relevant=false unless it is an exceptional semantic fit.`
    : `- Discovery mode (structured filters OFF): judge relevance primarily from the user query and intent. Do NOT reject candidates for missing optional tags/platform/budget unless the user explicitly demanded them in the query.`;

  const explicitBlock = explicitRequirementPenaltyBlock({
    userQuery,
    coreNeeds,
    mechanicsLine,
    vibesLine,
  });

  const budgetLine =
    filtersEnabled && budgetHint.trim()
      ? budgetHint
      : filtersEnabled
        ? "not specified"
        : "not specified — discovery mode (ignore numeric budget unless clearly stated in the user query)";
  const tagsLine =
    filtersEnabled && selectedTagsLine.trim()
      ? selectedTagsLine
      : filtersEnabled
        ? "none"
        : "none — discovery mode (prioritize query/intent; no structured tag constraints)";

  // Keep calls bounded: judge at most 40 candidates total (top-scored pool).
  const toJudge = candidates.slice(0, 40);
  const batches = chunk(toJudge, 20);
  const compactPayload = toJudge.length <= 5;

  const allResults: AiRelevanceResult[] = [];
  let totalUsage: unknown = null;

  const SEMANTIC_FILTER_TIMEOUT_MS = 12_000;
  const runBatch = async (batch: VerifiedCandidate[], batchIndex: number) => {
    const batchStarted = performance.now();
    const retries = 0;

    const messages = [
      {
        role: "system" as const,
        content: `
You are a strict relevance judge for video game recommendations.

Input: the user's request + a list of RAWG-verified candidate games with metadata.
Task: for each candidate, decide if it is ACTUALLY relevant to the request.

Return ONLY strict JSON:
{
  "results": [
    {
      "rawgId": 123,
      "name": "Game name",
      "relevant": true,
      "confidence": 0.0,
      "reason": "short reason",
      "matchedNeeds": ["..."],
      "missingNeeds": ["..."]
    }
  ]
}

Rules:
- If unsure, set relevant=false.
- relevant MUST be false if the match is based only on a generic word (e.g. \"simulator\", \"online\", \"game\").
- relevant MUST be false if genres/tags/platforms clearly contradict the request.
- relevant MUST be false if the game looks like filler or unrelated.
- Prefer fewer accurate results over many weak results.
- confidence is 0.0..1.0.
- Do not invent games. Only judge the provided candidates.
- Return one result per input candidate (same rawgId), in the same order.
${explicitBlock}
${constraintRule}
`,
      },
      {
        role: "user" as const,
        content: `
User query: ${userQuery || "not specified"}
Normalized intent: ${normalizedIntent || "not specified"}
Core needs: ${coreNeeds.length ? coreNeeds.join(", ") : "none"}
Avoid: ${avoid.length ? avoid.join(", ") : "none"}
Selected tags (user-selected, high priority): ${tagsLine}
Maximum budget (numeric cap): ${budgetLine}

Candidates:
${JSON.stringify(
          batch.map((c) => buildSemanticFilterCandidatePayload(c, compactPayload)),
          null,
          0
        )}
`,
      },
    ];

    const promptCharLength = messages.reduce((acc, m) => acc + (m.content as string).length, 0);

    const resp = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0,
        messages,
      },
      { signal: AbortSignal.timeout(SEMANTIC_FILTER_TIMEOUT_MS) }
    );

    const text = resp.choices[0].message.content || '{"results":[]}';
    const executionMs = performance.now() - batchStarted;

    if (process.env.NODE_ENV === "development") {
      console.log("[recommend:semanticFilter]", {
        model: resp.model ?? "gpt-4o-mini",
        candidateCount: batch.length,
        promptCharLength,
        responseCharLength: text.length,
        executionMs: Math.round(executionMs),
        retries,
        batchIndex,
      });
    } else if (executionMs > 8000) {
      console.warn("[recommend:timing:slow]", {
        label: "semanticFilterBatch",
        ms: Math.round(executionMs),
        model: resp.model ?? "gpt-4o-mini",
        candidateCount: batch.length,
        batchIndex,
      });
    }

    const parsed = safeParseJson<{ results?: unknown }>(text) || { results: [] };
    const normalized = normalizeRelevanceResults(parsed.results);
    return {
      normalized,
      usage: resp.usage,
      model: resp.model ?? "gpt-4o-mini",
      promptCharLength,
      responseCharLength: text.length,
      executionMs,
      batchIndex,
      retries,
    };
  };

  // Run up to 2 semantic-filter batches concurrently to reduce tail latency.
  let anyFailed = false;
  const results = await mapPool(batches, 2, async (batch, i) => {
    try {
      return await runBatch(batch, i);
    } catch (err) {
      anyFailed = true;
      const e = err as unknown as { name?: unknown; message?: unknown };
      console.warn("[recommend:semanticFilter:fallback]", {
        reason: "batch_failed_or_timed_out",
        batchIndex: i,
        name: typeof e?.name === "string" ? e.name : undefined,
        message: typeof e?.message === "string" ? e.message.slice(0, 140) : undefined,
        timeoutMs: SEMANTIC_FILTER_TIMEOUT_MS,
      });
      return null;
    }
  });

  for (const r of results) {
    if (!r) continue;
    totalUsage = totalUsage ? totalUsage : r.usage;
    allResults.push(...r.normalized);
  }

  // Safety fallback: if any batch failed, skip filtering (keep candidates) rather than
  // accidentally dropping good games due to missing judgments.
  if (anyFailed) {
    return { kept: toJudge, usage: totalUsage };
  }

  const keepById = new Map<number, AiRelevanceResult>();
  for (const r of allResults) {
    keepById.set(r.rawgId, r);
  }

  let kept = toJudge.filter((c) => {
    const r = keepById.get(c.id);
    if (!r) return false;
    return r.relevant === true && r.confidence >= 0.7;
  });

  if (kept.length < 3) {
    const have = new Set(kept.map((c) => c.id));
    const relaxed: VerifiedCandidate[] = [...kept];
    for (const c of toJudge) {
      if (have.size >= 18) break;
      if (have.has(c.id)) continue;
      const r = keepById.get(c.id);
      if (!r || r.relevant !== true || r.confidence < 0.55) continue;
      relaxed.push(c);
      have.add(c.id);
    }
    kept = relaxed;
  }

  return { kept, usage: totalUsage };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeInput(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const {
    userPrompt,
    query,
    prompt,
    input,
    message,
    taste,
    preferences,
    genres,
    playStyles,
    vibes,
    mechanics,
    platform,
    budget,
    maxPrice,
    selectedTags,
    platforms,
  } = b;

  const resolvedUserPrompt =
    (typeof userPrompt === "string" && userPrompt.trim()) ||
    (typeof query === "string" && query.trim()) ||
    (typeof prompt === "string" && prompt.trim()) ||
    (typeof input === "string" && input.trim()) ||
    (typeof message === "string" && message.trim()) ||
    (typeof taste === "string" && taste.trim()) ||
    (typeof preferences === "string" && preferences.trim()) ||
    "";

  const budgetFromField =
    typeof budget === "string" ? budget.trim() : String(budget ?? "").trim();
  const maxPriceStr =
    typeof maxPrice === "number" && Number.isFinite(maxPrice)
      ? String(maxPrice)
      : typeof maxPrice === "string"
        ? maxPrice.trim()
        : "";
  const budgetResolved = budgetFromField || maxPriceStr;

  let platformStr = typeof platform === "string" ? platform.trim() : "";
  if (Array.isArray(platforms)) {
    const joined = platforms
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", ");
    if (joined) platformStr = platformStr ? `${platformStr}, ${joined}` : joined;
  }

  let selectedTagsStr = "";
  if (Array.isArray(selectedTags)) {
    selectedTagsStr = selectedTags
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", ");
  } else if (typeof selectedTags === "string") {
    selectedTagsStr = selectedTags.trim();
  }

  return {
    userPrompt: resolvedUserPrompt,
    genres: typeof genres === "string" ? genres.trim() : "",
    playStyles: typeof playStyles === "string" ? playStyles.trim() : "",
    vibes: typeof vibes === "string" ? vibes.trim() : "",
    mechanics: typeof mechanics === "string" ? mechanics.trim() : "",
    platform: platformStr,
    budget: budgetResolved,
    selectedTags: selectedTagsStr,
  };
}

/** API clients that omit the field keep legacy “filtered search” behavior. */
function parseFiltersEnabled(body: unknown): boolean {
  const b = body as Record<string, unknown>;
  if (typeof b.filtersEnabled === "boolean") return b.filtersEnabled;
  return true;
}

function effectiveNormalizedInput(
  base: ReturnType<typeof normalizeInput>,
  filtersEnabled: boolean
) {
  if (filtersEnabled) return base;
  return {
    ...base,
    genres: "",
    playStyles: "",
    vibes: "",
    mechanics: "",
    platform: "",
    budget: "",
    selectedTags: "",
  };
}

function inputBlob(input: {
  userPrompt: string;
  genres: string;
  playStyles: string;
  vibes: string;
  mechanics: string;
  platform: string;
  budget: string;
  selectedTags: string;
}) {
  return [
    input.userPrompt,
    input.selectedTags,
    input.genres,
    input.playStyles,
    input.vibes,
    input.mechanics,
    input.platform,
    input.budget ? `max ${input.budget}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildRawgScoreBundle(params: {
  intent: {
    normalizedIntent: string;
    coreNeeds?: string[];
    avoid?: string[];
  };
  fallbackQueries: string[];
  tagTokens: string[];
  userPrompt: string;
  intentSignals: IntentSignals;
}) {
  const intentBlob = [
    params.userPrompt,
    params.intent.normalizedIntent,
    ...(params.intent.coreNeeds ?? []),
  ].join(" ");
  const queries = sanitizeDiscoveryQueries(
    params.fallbackQueries,
    params.intentSignals,
    params.userPrompt
  );
  const mustHave = extractMustHaveConstraints(
    params.userPrompt,
    params.intentSignals
  );
  const mustHaveKeywords = mustHave.active
    ? [
        ...mustHave.settings,
        ...mustHave.races.filter((r) => r !== "fantasy-races"),
        ...(mustHave.races.includes("fantasy-races") ? ["fantasy races"] : []),
        ...mustHave.mechanics.map((m) => m.replace(/-/g, " ")),
      ]
    : [];
  const mustHaveAvoid = mustHave.active && mustHave.settings.includes("fantasy")
    ? ["sci-fi only", "planetfall", "space strategy without fantasy"]
    : [];

  return {
    normalizedIntent: params.intent.normalizedIntent,
    coreKeywords: sanitizeCoreKeywordsForSignals(
      [...(params.intent.coreNeeds ?? []), ...mustHaveKeywords],
      params.intentSignals
    ),
    discoveryQueries: queries,
    negativeKeywords: [...(params.intent.avoid ?? []), ...mustHaveAvoid],
    preferredGenresOrTags: params.tagTokens,
    subjectContext: buildSubjectContextForIntent(
      intentBlob,
      params.intentSignals
    ),
  };
}

function isProbablyBaseGame(c: RawgCandidate) {
  return !isLowQualityTitle(c.name);
}

function popularityScore(c: RawgCandidate) {
  const added = typeof c.added === "number" ? c.added : 0;
  const ratings = typeof c.ratings_count === "number" ? c.ratings_count : 0;
  const rating = typeof c.rating === "number" ? c.rating : 0;
  const pop = Math.log10(1 + added) * 3 + Math.log10(1 + ratings) * 2 + rating;
  return clamp(pop, 0, 25);
}

function metadataQualityScore(c: RawgCandidate) {
  let s = 0;
  if (c.background_image) s += 10;
  if (c.released) s += 2;
  if ((c.genres ?? []).length > 0) s += 2;
  if ((c.tags ?? []).length > 0) s += 2;
  if (typeof c.rating === "number" && c.rating > 0) s += 2;
  return clamp(s, 0, 20);
}

function semanticHeuristicScore(params: {
  normalizedIntent: string;
  coreNeeds: string[];
  avoid: string[];
  userBlob: string;
  tagTokens: string[];
  candidate: RawgCandidate;
}) {
  const { normalizedIntent, coreNeeds, avoid, userBlob, tagTokens, candidate } = params;
  const genreText = (candidate.genres ?? []).map((g) => g.name).join(" | ");
  const tagText = (candidate.tags ?? []).map((t) => t.name).join(" | ");
  const blob = `${candidate.name} | ${genreText} | ${tagText}`.toLowerCase();
  const intent = `${normalizedIntent} | ${userBlob}`.toLowerCase();

  let s = 0;

  for (const tok of tagTokens) {
    const t = (tok || "").trim().toLowerCase();
    if (t.length < 2) continue;
    if (blob.includes(t)) s += 5;
  }

  for (const need of coreNeeds) {
    const n = (need || "").toLowerCase().trim();
    if (n.length < 2) continue;
    if (intent.includes(n) && blob.includes(n)) s += 6;
  }

  for (const a of avoid) {
    const n = (a || "").toLowerCase().trim();
    if (n.length < 2) continue;
    if (blob.includes(n)) s -= 10;
  }

  if (!isProbablyBaseGame(candidate)) s -= 25;
  if (!candidate.background_image) s -= 12;

  return clamp(s, -60, 60);
}

async function verifySuggestedTitles(params: {
  rawgKey: string;
  suggestedTitles: AiSuggestedTitle[];
  excludeNormalized: Set<string>;
  /** Cap parallel RAWG title lookups (default 12; fast mode uses 8). */
  maxTitles?: number;
  intentSignals?: IntentSignals;
  normalizedIntent?: string;
  coreNeeds?: string[];
  userPrompt?: string;
}) {
  const {
    rawgKey,
    suggestedTitles,
    excludeNormalized,
    intentSignals = EMPTY_INTENT_SIGNALS,
    normalizedIntent = "",
    coreNeeds = [],
    userPrompt = "",
  } = params;
  const maxTitles = params.maxTitles ?? 12;
  // Trim RAWG fan-out: top titles only (keeps quality while reducing worst-case latency).
  const slice = suggestedTitles.slice(0, maxTitles);
  const RAWG_VERIFY_CONCURRENCY = 4;

  const resolved = await mapPool(slice, RAWG_VERIFY_CONCURRENCY, async (s) => {
    const title = s.title.trim();
    if (!title) return null;
    if (excludeNormalized.has(normalizeTitleForMatch(title))) return null;
    if (intentSignals.steamDeck && isSteamDeckTitleKeywordSpam(title)) return null;
    if (
      intentSignals.psychologicalHorror &&
      isHorrorKeywordShovelwareTitle(title)
    ) {
      return null;
    }
    if (
      (intentSignals.memorableDiscovery || intentSignals.cozyShortSession) &&
      isDiscoveryShovelwareTitle(title)
    ) {
      return null;
    }

    const results = await searchRawgByTitle({
      rawgApiKey: rawgKey,
      title,
      pageSize: 8,
    });

    if (!results.length) return null;

    let best: RawgCandidate | null = null;
    let bestScore = -Infinity;
    let bestMatch = 0;
    const mustHaveForVerify = extractMustHaveConstraints(userPrompt, intentSignals);
    const preferFranchiseMainline = isFantasyRaceStrategyMustHave(mustHaveForVerify);

    for (const c of results) {
      const tm = titleMatchQuality(title, c.name);
      if (tm < 0.74) continue;
      if (!isProbablyBaseGame(c)) continue;
      if (shouldRejectCandidateForSignals(c, intentSignals, userPrompt)) continue;

      const relevanceBoost = scoreCandidateRelevanceBoost({
        signals: intentSignals,
        userPrompt,
        normalizedIntent,
        coreNeeds,
        candidate: c,
      });

      const canonicalBoost = scoreCanonicalTitlePreference({
        suggestedTitle: title,
        candidateName: c.name,
        userPrompt,
        preferFranchiseMainline,
      });

      const score =
        tm * 100 +
        metadataQualityScore(c) +
        popularityScore(c) * 0.35 +
        relevanceBoost +
        canonicalBoost;
      if (score > bestScore) {
        bestScore = score;
        best = c;
        bestMatch = tm;
      }
    }

    if (!best) return null;
    if (excludeNormalized.has(normalizeTitleForMatch(best.name))) return null;

    return {
      ...best,
      _suggested: {
        title: s.title,
        confidence: s.confidence,
        expectedMatch: s.expectedMatch,
        reason: s.reason,
        titleMatch: bestMatch,
      },
    } as VerifiedCandidate;
  });

  const verified = resolved.filter((x): x is VerifiedCandidate => x != null);
  return dedupeCandidates(verified);
}

function scoreVerifiedCandidates(params: {
  normalizedIntent: string;
  coreNeeds: string[];
  avoid: string[];
  userBlob: string;
  tagTokens: string[];
  candidates: VerifiedCandidate[];
  intentSignals: IntentSignals;
  userPrompt: string;
}) {
  const {
    normalizedIntent,
    coreNeeds,
    avoid,
    userBlob,
    tagTokens,
    candidates,
    intentSignals,
    userPrompt,
  } = params;

  const scored = candidates.map((c) => {
    const heuristic = semanticHeuristicScore({
      normalizedIntent,
      coreNeeds,
      avoid,
      userBlob,
      tagTokens,
      candidate: c,
    });

    const relevanceBoost = scoreCandidateRelevanceBoost({
      signals: intentSignals,
      userPrompt,
      normalizedIntent,
      coreNeeds,
      candidate: c,
    });

    const titleMatch = c._suggested?.titleMatch ?? 0;
    const conf = c._suggested?.confidence ?? 0;
    const titleBoost = titleMatch > 0 ? titleMatch * 18 : 0;
    const confBoost = titleMatch > 0 ? (conf / 100) * 10 : 0;
    const meta = metadataQualityScore(c);
    const pop = popularityScore(c);

    return {
      candidate: c,
      score: heuristic + relevanceBoost + titleBoost + confBoost + meta + pop,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function filterCandidatesByExclude(
  pool: VerifiedCandidate[],
  excludeNormalized: Set<string>
) {
  if (excludeNormalized.size === 0) return pool;
  return pool.filter((c) => !excludeNormalized.has(normalizeTitleForMatch(c.name)));
}

type PreEnrichPick = {
  id: number;
  title: string;
  slug: string | null;
  image: string | null;
  match: number;
  reason: string;
  matchTier: MatchTier;
  matchNote: string;
};

const RECOVERY_SEMANTIC_SCORE_FLOOR = 28;
const RECOVERY_AI_CONF_FLOOR = 45;

const INTENT_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "you",
  "your",
  "game",
  "games",
  "giochi",
  "gioco",
  "una",
  "uno",
  "degli",
  "della",
  "that",
  "with",
  "from",
  "this",
  "like",
  "are",
  "want",
  "looking",
  "find",
]);

function buildIntentKeywordSet(params: {
  userPrompt: string;
  normalizedIntent: string;
  coreNeeds: string[];
  tagTokens: string[];
  fallbackQueries: string[];
  intentSignals?: IntentSignals;
}) {
  const set = new Set<string>();
  const addPhrase = (phrase: string) => {
    const normalized = phrase
      .toLowerCase()
      .replace(/[^a-z0-9àèéìòù\s]/gi, " ");
    for (const w of normalized.split(/\s+/)) {
      const t = w.trim();
      if (t.length >= 3 && !INTENT_STOPWORDS.has(t)) set.add(t);
    }
  };
  addPhrase(
    promptForRetrievalKeywords(
      params.userPrompt,
      params.intentSignals ?? EMPTY_INTENT_SIGNALS
    )
  );
  addPhrase(params.normalizedIntent);
  params.coreNeeds.forEach((x) => addPhrase(x));
  params.tagTokens.forEach((x) => addPhrase(x));
  params.fallbackQueries.forEach((x) => addPhrase(x));
  return sanitizeIntentKeywordSet(set, params.intentSignals ?? EMPTY_INTENT_SIGNALS);
}

function listOverlappingKeywords(c: RawgCandidate, keywords: Set<string>) {
  const blob = `${c.name} ${(c.genres ?? []).map((g) => g.name).join(" ")} ${(c.tags ?? []).map((t) => t.name).join(" ")}`.toLowerCase();
  const out: string[] = [];
  for (const kw of keywords) {
    if (blob.includes(kw)) out.push(kw);
  }
  return out;
}

function buildIntentPhraseChunks(params: {
  userPrompt: string;
  normalizedIntent: string;
  coreNeeds: string[];
  resolvedTags?: string[];
}) {
  const chunks = new Set<string>();
  const ingest = (text: string) => {
    const t = text.trim().toLowerCase();
    if (t.length >= 5 && t.length <= 90) chunks.add(t);
    for (const seg of t.split(/[,;.]+/)) {
      const s = seg.trim();
      if (s.length >= 5 && s.length <= 90) chunks.add(s);
    }
    for (const w of t.split(/\s+/)) {
      if (w.length >= 5) chunks.add(w);
    }
  };
  ingest(params.normalizedIntent);
  ingest(params.userPrompt);
  (params.coreNeeds ?? []).forEach(ingest);
  (params.resolvedTags ?? []).forEach((x) => ingest(x));
  return [...chunks].slice(0, 48);
}

function listRecoveryOverlaps(
  c: RawgCandidate,
  keywords: Set<string>,
  phraseChunks: string[]
) {
  const blob = `${c.name} ${(c.genres ?? []).map((g) => g.name).join(" ")} ${(c.tags ?? []).map((t) => t.name).join(" ")}`.toLowerCase();
  const kwHits = listOverlappingKeywords(c, keywords);
  if (kwHits.length > 0) {
    return { overlapping: kwHits, overlap: kwHits.length };
  }
  const chunkHits = phraseChunks.filter((ch) => ch.length >= 4 && blob.includes(ch));
  return {
    overlapping: chunkHits.slice(0, 6),
    overlap: chunkHits.length,
  };
}

function buildRecoveryPick(params: {
  c: VerifiedCandidate;
  semanticScore: number;
  overlap: number;
  overlapping: string[];
  locale: "it" | "en";
}): PreEnrichPick {
  const { c, semanticScore, overlap, overlapping, locale } = params;
  const tier: MatchTier = overlap >= 2 ? "good_alternative" : "partial_match";
  const match = clamp(
    50 + Math.min(14, Math.floor((semanticScore - RECOVERY_SEMANTIC_SCORE_FLOOR) / 3)),
    48,
    66
  );
  const themes = overlapping.slice(0, 4).join(", ") || (locale === "it" ? "la tua richiesta" : "your request");
  const matchNote =
    locale === "it"
      ? tier === "good_alternative"
        ? `Alternativa più ampia: c’entra con ${themes}, ma meno precisa dei pick migliori.`
        : `Match parziale — utile se vuoi esplorare oltre i titoli più stretti.`
      : tier === "good_alternative"
        ? `Broader alternative: touches ${themes}, but less exact than top picks.`
        : `Partial match — worth a look if you want options beyond the tightest fits.`;
  const reason = buildRecoveryReason({
    overlapping,
    locale,
    title: c.name,
  });
  return {
    id: c.id,
    title: c.name,
    slug: c.slug ?? null,
    image: c.background_image ?? null,
    match,
    reason,
    matchTier: tier,
    matchNote,
  };
}

function augmentPicksWithRecovery(params: {
  primaryPicks: PreEnrichPick[];
  candidatePool: VerifiedCandidate[];
  scoredFinal: Array<{ candidate: VerifiedCandidate; score: number }>;
  intent: {
    normalizedIntent: string;
    coreNeeds: string[];
    fallbackDiscoveryQueries: string[];
  };
  normalizedInput: { userPrompt: string };
  tagTokens: string[];
  excludeNormalized: Set<string>;
  filtersEnabled: boolean;
  locale: "it" | "en";
  intentSignals: IntentSignals;
}): PreEnrichPick[] {
  const {
    primaryPicks,
    candidatePool,
    scoredFinal,
    intent,
    normalizedInput,
    tagTokens,
    excludeNormalized,
    filtersEnabled,
    locale,
    intentSignals,
  } = params;

  const merged: PreEnrichPick[] = [...primaryPicks];
  const usedIds = new Set(merged.map((p) => p.id));
  const scoreById = new Map(scoredFinal.map((x) => [x.candidate.id, x.score]));

  const keywords = buildIntentKeywordSet({
    userPrompt: normalizedInput.userPrompt,
    normalizedIntent: intent.normalizedIntent,
    coreNeeds: intent.coreNeeds ?? [],
    tagTokens,
    fallbackQueries: intent.fallbackDiscoveryQueries ?? [],
    intentSignals,
  });

  const phraseChunks = buildIntentPhraseChunks({
    userPrompt: normalizedInput.userPrompt,
    normalizedIntent: intent.normalizedIntent,
    coreNeeds: intent.coreNeeds ?? [],
    resolvedTags: tagTokens,
  });

  const extras: Array<{
    c: VerifiedCandidate;
    score: number;
    overlap: number;
    overlapping: string[];
  }> = [];

  for (const c of candidatePool) {
    if (usedIds.has(c.id)) continue;
    if (excludeNormalized.has(normalizeTitleForMatch(c.name))) continue;
    if (!isProbablyBaseGame(c)) continue;
    const sc = scoreById.get(c.id);
    if (sc === undefined) continue;
    const conf = c._suggested?.confidence ?? 0;
    if (sc < RECOVERY_SEMANTIC_SCORE_FLOOR && conf < RECOVERY_AI_CONF_FLOOR) continue;
    const { overlapping, overlap } = listRecoveryOverlaps(c, keywords, phraseChunks);
    if (overlap < 1) continue;
    extras.push({ c, score: sc, overlap, overlapping });
  }

  extras.sort((a, b) => b.score - a.score);

  for (const extra of extras) {
    if (merged.length >= RECOVERY_MAX_TOTAL_PICKS) break;
    if (
      primaryPicks.length > 0 &&
      merged.length >= primaryPicks.length + RECOVERY_MAX_ADDITIONS
    ) {
      break;
    }
    if (merged.length >= 3) {
      const minOverlap = filtersEnabled ? 2 : 1;
      const minScore = filtersEnabled ? 42 : 34;
      if (extra.overlap < minOverlap && extra.score < minScore) continue;
    }
    merged.push(
      buildRecoveryPick({
        c: extra.c,
        semanticScore: extra.score,
        overlap: extra.overlap,
        overlapping: extra.overlapping,
        locale,
      })
    );
    usedIds.add(extra.c.id);
  }

  return merged;
}

const FINAL_PICK_SCREENSHOT_CONCURRENCY = 3;

async function enrichFinalPicksWithScreenshotFallback(params: {
  rawgKey: string;
  picks: PreEnrichPick[];
}): Promise<PreEnrichPick[]> {
  const { rawgKey, picks } = params;
  const missing = picks
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => !p.image && Number.isFinite(p.id));

  if (missing.length === 0) return picks;

  const fetched = await mapPool(
    missing,
    FINAL_PICK_SCREENSHOT_CONCURRENCY,
    async (entry) => {
      const url = await fetchRawgFirstScreenshotUrl({
        rawgApiKey: rawgKey,
        rawgId: entry.p.id,
      });
      return { index: entry.index, url };
    }
  );

  const next = [...picks];
  for (const row of fetched) {
    const url = row.url;
    if (typeof url === "string" && url.trim()) {
      const cur = next[row.index];
      if (cur && !cur.image) {
        next[row.index] = { ...cur, image: url };
      }
    }
  }
  return next;
}

export async function POST(req: Request) {
  let url: URL | null = null;
  let debugEnabled = false;
  let noCache = false;
  try {
    url = new URL(req.url);
    debugEnabled = url.searchParams.get("debug") === "1";
    noCache = url.searchParams.get("nocache") === "1";
  } catch {}

  let stage: "discovery" | "relevance" | "rerank" | "unknown" = "unknown";
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
  const routeStarted = nowMs();
  const stageMs: Record<string, number> = {};
  let recommendLogPrompt = "";

  try {

    let userId: string | null = null;
    let plan: string | null = null;
    try {
      const supabase = await createCookieClient();
      const authRes = await timed("auth.getUser", () => supabase.auth.getUser());
      stageMs["auth.getUser"] = authRes.ms;
      const {
        data: { user },
      } = authRes.value;
      if (user) {
        const blockedRes = await timed("auth.blockUnverified", () =>
          blockUnverifiedLoggedInUser(supabase, user)
        );
        stageMs["auth.blockUnverified"] = blockedRes.ms;
        if (blockedRes.value) return blockedRes.value;
        userId = user.id;
        const profileRes = await timed("auth.profilePlan", async () => {
          return await supabase
            .from("profiles")
            .select("plan")
            .eq("user_id", userId)
            .maybeSingle();
        });
        stageMs["auth.profilePlan"] = profileRes.ms;
        const { data: profile } = profileRes.value;
        plan = profile?.plan ?? "free";
      }
    } catch {}

    let body: unknown;
    try {
      const bodyRes = await timed("request.json", () => req.json());
      stageMs["request.json"] = bodyRes.ms;
      body = bodyRes.value;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const filtersEnabled = parseFiltersEnabled(body);
    const normalizedInput = effectiveNormalizedInput(
      normalizeInput(body),
      filtersEnabled
    );
    if (!hasMeaningfulRecommendInput(normalizedInput, filtersEnabled)) {
      return NextResponse.json(
        { error: "Missing recommendation query" },
        { status: 400 }
      );
    }

    recommendLogPrompt = normalizedInput.userPrompt.trim();

    const bypassLimits = shouldBypassRecommendLimits(plan);
    const promptMax = getPromptMaxChars(plan, bypassLimits);
    const promptLen = normalizedInput.userPrompt.trim().length;
    if (promptLen > promptMax) {
      return NextResponse.json(
        {
          error: "prompt_too_long",
          message:
            promptMax <= PROMPT_MAX_DEFAULT
              ? "Prompt too long. Please keep it under 500 characters."
              : `Prompt too long. Keep it under ${promptMax} characters.`,
        },
        { status: 400 }
      );
    }

    const dailyLimitValue = getRecommendDailyLimit({ plan, userId });
    /** Set after early-cache miss; cache hits must not increment daily usage. */
    let usageAfter = { allowed: true as boolean, used: 0, limit: dailyLimitValue };

    const resolvedSelectedTags = filtersEnabled
      ? resolveSelectedTagsList(body, normalizedInput)
      : [];
    if (process.env.NODE_ENV === "development") {
      console.log("[recommend:selectedTagsResolved]", resolvedSelectedTags);
    }

    const tagTokens = resolvedSelectedTags;
    const selectedTagsLine = resolvedSelectedTags.join(", ");

    const userBlob = inputBlob({
      userPrompt: normalizedInput.userPrompt,
      genres: normalizedInput.genres,
      playStyles: normalizedInput.playStyles,
      vibes: normalizedInput.vibes,
      mechanics: normalizedInput.mechanics,
      platform: normalizedInput.platform,
      budget: normalizedInput.budget,
      selectedTags: resolvedSelectedTags.join(", "),
    });

    /** User-visible inputs only (no AI intent) — must match row stored at end via `earlyHash`. */
    const earlyCacheKeyInput = {
      schemaVersion: 1 as const,
      filtersEnabled,
      prompt: normalizedInput.userPrompt.trim(),
      genres: normalizedInput.genres.trim(),
      playStyles: normalizedInput.playStyles.trim(),
      vibes: normalizedInput.vibes.trim(),
      mechanics: normalizedInput.mechanics.trim(),
      platform: normalizedInput.platform.trim(),
      budget: normalizedInput.budget.trim(),
      resolvedSelectedTags: [...resolvedSelectedTags].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      ),
    };
    const earlyHash = hashNormalizedInput(earlyCacheKeyInput);

    const perfRouteStart = nowMs();
    const timing = {
      aiDiscoveryMs: 0,
      rawgVerificationMs: 0,
      rawgFallbackMs: 0,
      rawgDetailsMs: 0,
      semanticJudgeMs: 0,
      semanticFilterMs: 0,
      rerankMs: 0,
      recoveryMs: 0,
      screenshotFallbackMs: 0,
      cacheMs: 0,
      earlyCacheMs: 0,
      fullCacheMs: 0,
    };

    let cacheHitSource: "early" | "full" | null = null;
    let quotaConsumed = false;

    const earlyCacheRes = await timed("cache.earlyRead", async () => {
      if (debugEnabled || noCache) return null;
      return await getCachedAiRecommendation<{
        games: unknown[];
        usage?: unknown;
      }>(earlyHash);
    });
    stageMs["cache.earlyRead"] = earlyCacheRes.ms;
    const cachedEarly = earlyCacheRes.value;
    timing.earlyCacheMs = earlyCacheRes.ms;

    if (cachedEarly && !debugEnabled && !noCache) {
      cacheHitSource = "early";
      timing.cacheMs = timing.earlyCacheMs;
      if (process.env.NODE_ENV !== "development") {
        console.log("[recommend:cache]", {
          requestId,
          cacheHit: "early",
          ms: Math.round(timing.earlyCacheMs),
          quotaConsumed: false,
        });
      }
      if (process.env.NODE_ENV === "development") {
        const games = Array.isArray((cachedEarly as { games?: unknown }).games)
          ? (cachedEarly as { games: unknown[] }).games
          : [];
        console.log("[recommend:timing]", {
          totalMs: performance.now() - perfRouteStart,
          aiDiscoveryMs: 0,
          rawgVerificationMs: 0,
          rawgFallbackMs: 0,
          semanticFilterMs: 0,
          rerankMs: 0,
          recoveryMs: 0,
          cacheMs: timing.cacheMs,
          earlyCacheMs: timing.earlyCacheMs,
          fullCacheMs: 0,
          cacheHit: "early",
          candidatePoolSize: games.length,
          finalCount: games.length,
        });
      }
      scheduleRecommendRunLog({
        promptText: recommendLogPrompt,
        routeStarted,
        games: Array.isArray((cachedEarly as { games?: unknown }).games)
          ? (cachedEarly as { games: unknown[] }).games
          : [],
        success: true,
      });
      return NextResponse.json(cachedEarly);
    }

    if (process.env.RECOMMEND_SINGLE_CALL_FAST === "1" && !debugEnabled && !noCache) {
      console.log("[recommend:single-call-fast]", { enabled: true });
    } else if (!debugEnabled) {
      console.log("[recommend:single-call-fast]", { enabled: false });
    }

    // Quota runs only after early-cache miss (see recommend-quota-cache-order.ts).
    if (!bypassLimits) {
      const quotaRes = await timed("quota.consumeDailySlot", () =>
        tryConsumeRecommendDailySlot({
          req,
          userId,
          dailyLimit: dailyLimitValue,
        })
      );
      stageMs["quota.consumeDailySlot"] = quotaRes.ms;
      usageAfter = quotaRes.value;
      quotaConsumed = true;

      if (process.env.NODE_ENV === "development") {
        console.log("[recommend:usage-limit]", {
          userId,
          isAdmin: plan === "admin",
          plan: plan ?? "anon",
          used: usageAfter.used,
          limit: usageAfter.limit,
          allowed: usageAfter.allowed,
          afterEarlyCacheMiss: true,
        });
      }

      if (!usageAfter.allowed) {
        scheduleRecommendRunLog({
          promptText: recommendLogPrompt,
          routeStarted,
          success: false,
          errorCode: "daily_limit",
        });
        return NextResponse.json(
          buildLimitErrorPayload({
            error: "daily_limit",
            limitType: "daily_recommendations",
            plan: userId ? plan : null,
            limit: usageAfter.limit,
            anonymous: !userId,
          }),
          { status: 429 }
        );
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log("[recommend:usage-limit]", {
        userId,
        isAdmin: plan === "admin",
        plan: plan ?? "anon",
        used: 0,
        limit: "bypass",
        allowed: true,
        afterEarlyCacheMiss: true,
      });
    }

    const regexRefsFromPrompt = extractReferenceTitlesFromPrompt(
      normalizedInput.userPrompt
    );

    const intentSignals = detectIntentSignals(normalizedInput.userPrompt);
    const disambiguationRules = buildDisambiguationRules(
      intentSignals,
      normalizedInput.userPrompt
    );
    const discoveryNormalizedInput = {
      ...normalizedInput,
      userPrompt: enrichPromptForDiscovery(
        normalizedInput.userPrompt,
        intentSignals
      ),
      selectedTags: resolvedSelectedTags.join(", "),
    };

    const singleCallFastEnabled =
      process.env.RECOMMEND_SINGLE_CALL_FAST === "1" && !debugEnabled && !noCache;
    const fastStarted = nowMs();

    // 1) AI-first discovery (titles + intent).
    stage = "discovery";

    const tDiscovery = performance.now();
    let aiDiscovery: Awaited<ReturnType<typeof aiFirstDiscovery>>;
    let fastPicks: Awaited<
      ReturnType<typeof aiSingleCallFastDiscovery>
    >["fastPicks"] | null = null;
    let fastGeneratedPickCount = 0;
    try {
      if (singleCallFastEnabled) {
        const fast = await aiSingleCallFastDiscovery({
          openai,
          filtersEnabled,
          normalizedInput: discoveryNormalizedInput,
          disambiguationRules,
        });
        // Reuse the same intent shape for cache keys + downstream RAWG logic.
        aiDiscovery = { intent: fast.intent, usage: fast.usage } as Awaited<
          ReturnType<typeof aiFirstDiscovery>
        >;
        fastPicks = fast.fastPicks;
        fastGeneratedPickCount = fast.generatedPickCount;
        stageMs["ai.singleCallFastDiscovery"] = fast.aiMs;
      } else {
        aiDiscovery = await aiFirstDiscovery({
          openai,
          filtersEnabled,
          normalizedInput: discoveryNormalizedInput,
          disambiguationRules,
        });
      }
    } catch (err) {
      if (isAbortLikeError(err)) {
        console.warn(
          "[recommend:route] aiDiscovery timeout or abort — minimalDiscoveryFallback (no prompt logged)"
        );
        aiDiscovery = minimalDiscoveryFallback({
          normalizedInput: {
            ...normalizedInput,
            selectedTags: resolvedSelectedTags.join(", "),
          },
          filtersEnabled,
          referenceTitlesFromPrompt: regexRefsFromPrompt,
        });
      } else {
        // Safety: if single-call fast mode fails, fall back to the existing pipeline.
        if (singleCallFastEnabled) {
          console.warn("[recommend:single-call-fast] failed — falling back to normal pipeline", {
            requestId,
          });
          aiDiscovery = await aiFirstDiscovery({
            openai,
            filtersEnabled,
            normalizedInput: discoveryNormalizedInput,
            disambiguationRules,
          });
        } else {
          throw err;
        }
      }
    }
    timing.aiDiscoveryMs = performance.now() - tDiscovery;
    stageMs["ai.discovery"] = timing.aiDiscoveryMs;
    const intent = aiDiscovery.intent;

    const intentMerged = mergeIntentAugmentation(
      {
        normalizedIntent: intent.normalizedIntent,
        coreNeeds: intent.coreNeeds ?? [],
        avoid: intent.avoid ?? [],
        fallbackDiscoveryQueries: intent.fallbackDiscoveryQueries ?? [],
      },
      intentSignals,
      normalizedInput.userPrompt
    );
    intent.normalizedIntent = intentMerged.normalizedIntent;
    intent.coreNeeds = intentMerged.coreNeeds;
    intent.avoid = intentMerged.avoid;
    intent.fallbackDiscoveryQueries = intentMerged.fallbackDiscoveryQueries;

    intent.fallbackDiscoveryQueries = augmentIslandSurvivalFallbackQueries({
      queries: intent.fallbackDiscoveryQueries ?? [],
      userPrompt: normalizedInput.userPrompt,
      normalizedIntent: intent.normalizedIntent,
      coreNeeds: intent.coreNeeds ?? [],
      resolvedTags: resolvedSelectedTags,
    });
    intent.fallbackDiscoveryQueries = sanitizeDiscoveryQueries(
      intent.fallbackDiscoveryQueries ?? [],
      intentSignals,
      normalizedInput.userPrompt
    );

    const excludeListRaw = [
      ...regexRefsFromPrompt,
      ...(intent.excludeTitles ?? []),
      ...(intent.referenceTitles ?? []),
    ];
    let excludeNormalized = new Set(
      excludeListRaw.map((t) => normalizeTitleForMatch(t)).filter(Boolean)
    );
    if (isExplicitTitleLookupQuery(normalizedInput.userPrompt)) {
      excludeNormalized = new Set();
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[recommend:payload]", {
        filtersEnabled,
        prompt: normalizedInput.userPrompt,
        genres: normalizedInput.genres,
        playStyles: normalizedInput.playStyles,
        vibes: normalizedInput.vibes,
        mechanics: normalizedInput.mechanics,
        platform: normalizedInput.platform,
        budget: normalizedInput.budget,
        selectedTags: normalizedInput.selectedTags,
        resolvedSelectedTags,
        excludeTitlesNormalized: [...excludeNormalized],
      });
    }

    // Cache key must include intent so different requests don't collide.
    const cacheKeyInput = {
      filtersEnabled,
      ...normalizedInput,
      resolvedSelectedTags: [...resolvedSelectedTags].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      ),
      intent,
    };

    const inputHash = hashNormalizedInput(cacheKeyInput);
    const fullCacheRes = await timed("cache.fullRead", async () => {
      if (debugEnabled || noCache) return null;
      return await getCachedAiRecommendation<{
        games: unknown[];
        usage?: unknown;
      }>(inputHash);
    });
    stageMs["cache.fullRead"] = fullCacheRes.ms;
    const cachedFull = fullCacheRes.value;
    timing.fullCacheMs = fullCacheRes.ms;
    timing.cacheMs = timing.fullCacheMs;

    if (cachedFull && !debugEnabled && !noCache) {
      cacheHitSource = "full";
      if (process.env.NODE_ENV !== "development") {
        console.log("[recommend:cache]", {
          requestId,
          cacheHit: "full",
          ms: Math.round(timing.fullCacheMs),
          quotaConsumed,
        });
      }
      if (process.env.NODE_ENV === "development") {
        const games = Array.isArray((cachedFull as { games?: unknown }).games)
          ? (cachedFull as { games: unknown[] }).games
          : [];
        console.log("[recommend:timing]", {
          totalMs: performance.now() - perfRouteStart,
          aiDiscoveryMs: timing.aiDiscoveryMs,
          rawgVerificationMs: 0,
          rawgFallbackMs: 0,
          semanticFilterMs: 0,
          rerankMs: 0,
          recoveryMs: 0,
          cacheMs: timing.cacheMs,
          earlyCacheMs: timing.earlyCacheMs,
          fullCacheMs: timing.fullCacheMs,
          cacheHit: "full",
          candidatePoolSize: games.length,
          finalCount: games.length,
        });
      }
      scheduleRecommendRunLog({
        promptText: recommendLogPrompt,
        routeStarted,
        games: Array.isArray((cachedFull as { games?: unknown }).games)
          ? (cachedFull as { games: unknown[] }).games
          : [],
        success: true,
      });
      return NextResponse.json(cachedFull);
    }

    const rawgKey = process.env.RAWG_API_KEY || "";
    let verified: VerifiedCandidate[] = [];

    // 2) RAWG verification pass for AI-suggested titles.
    const tVerify = performance.now();
    if (rawgKey) {
      verified = await verifySuggestedTitles({
        rawgKey,
        suggestedTitles: intent.suggestedTitles,
        excludeNormalized,
        maxTitles: singleCallFastEnabled ? 8 : undefined,
        intentSignals,
        normalizedIntent: intent.normalizedIntent,
        coreNeeds: intent.coreNeeds ?? [],
        userPrompt: normalizedInput.userPrompt,
      });
    }
    timing.rawgVerificationMs = performance.now() - tVerify;
    stageMs["rawg.verifySuggestedTitles"] = timing.rawgVerificationMs;

    verified = filterCandidatesByExclude(verified, excludeNormalized);
    verified = verified.filter(
      (c) => !shouldRejectCandidateForSignals(c, intentSignals, normalizedInput.userPrompt)
    );

    // Experimental: single-call fast mode returns directly after RAWG verification (no semantic filter + no rerank).
    if (singleCallFastEnabled && fastPicks) {
      const rawgMs = timing.rawgVerificationMs;
      const resultCountPolicy = detectResultCountPolicy(
        normalizedInput.userPrompt,
        intentSignals
      );
      const mustHaveConstraints = extractMustHaveConstraints(
        normalizedInput.userPrompt,
        intentSignals
      );
      const verifiedBySuggested = buildVerifiedBySuggestedTitle(verified);
      let candidatesById = buildFastPickCandidateById(verified);

      const picked: PreEnrichPick[] = [];
      for (const fp of fastPicks) {
        const c = lookupVerifiedForFastPickTitle(
          fp.title,
          verified,
          verifiedBySuggested
        );
        if (!c) continue;
        if (excludeNormalized.has(normalizeTitleForMatch(c.name))) continue;
        if (shouldRejectCandidateForSignals(c, intentSignals, normalizedInput.userPrompt)) continue;
        if (
          shouldRejectFastPickForMustHave({
            pick: fp,
            candidate: c,
            constraints: mustHaveConstraints,
          })
        ) {
          continue;
        }
        picked.push({
          id: c.id,
          title: c.name,
          slug: c.slug ?? null,
          image: c.background_image ?? null,
          match: clamp(fp.match, 0, 100),
          reason: fp.reason,
          matchTier: fp.matchTier,
          matchNote: fp.matchNote,
        });
        if (picked.length >= 6) break;
      }

      // RAWG fallback only when verified picks are thin — skip for quality-first if we already have enough signal.
      let picksForEnrichment = picked;
      const skipFallbackForQuality =
        resultCountPolicy === "quality_first" && picked.length >= 2;
      const fallbackMinPicks = resultCountPolicy === "quality_first" ? 2 : 3;

      if (rawgKey && !skipFallbackForQuality && picksForEnrichment.length < fallbackMinPicks) {
        const fallbackQueries = sanitizeDiscoveryQueries(
          intent.fallbackDiscoveryQueries?.length
            ? intent.fallbackDiscoveryQueries
            : [intent.normalizedIntent].filter(Boolean),
          intentSignals,
          normalizedInput.userPrompt
        );

        const tFallback = performance.now();
        const fetched = await fetchRawgCandidates({
          rawgApiKey: rawgKey,
          discoveryQueries: fallbackQueries,
          pageSize: 18,
        });
        timing.rawgFallbackMs = performance.now() - tFallback;
        stageMs["rawg.fetchCandidatesFallback"] = timing.rawgFallbackMs;

        const scored = scoreCandidates(
          buildRawgScoreBundle({
            intent,
            fallbackQueries,
            tagTokens,
            userPrompt: normalizedInput.userPrompt,
            intentSignals,
          }),
          dedupeCandidates(fetched)
        );

        const diverse = selectDiverseTop([...scored], 20).map((s) => s.candidate);
        const used = new Set(picksForEnrichment.map((p) => p.id));
        const fallbackRelevanceFloor =
          resultCountPolicy === "quality_first" ? -15 : -35;
        const fallbackMaxTotal =
          resultCountPolicy === "quality_first" ? 3 : 4;

        for (const c of diverse) {
          if (used.has(c.id)) continue;
          if (excludeNormalized.has(normalizeTitleForMatch(c.name))) continue;
          if (!isProbablyBaseGame(c)) continue;
          if (shouldRejectCandidateForSignals(c, intentSignals, normalizedInput.userPrompt)) continue;
          const relevanceBoost = scoreCandidateRelevanceBoost({
            signals: intentSignals,
            userPrompt: normalizedInput.userPrompt,
            normalizedIntent: intent.normalizedIntent,
            coreNeeds: intent.coreNeeds ?? [],
            candidate: c,
            matchTier: "good_alternative",
          });
          if (
            (intentSignals.memorableDiscovery ||
              intentSignals.cozyShortSession ||
              resultCountPolicy === "quality_first") &&
            relevanceBoost <= fallbackRelevanceFloor
          ) {
            continue;
          }
          if (
            !shouldAdmitRawgFallbackCandidate({
              candidate: c,
              relevanceBoost,
              constraints: mustHaveConstraints,
              userPrompt: normalizedInput.userPrompt,
            })
          ) {
            continue;
          }
          candidatesById.set(c.id, c);
          picksForEnrichment.push({
            id: c.id,
            title: c.name,
            slug: c.slug ?? null,
            image: c.background_image ?? null,
            match: 62,
            reason: "",
            matchTier: "good_alternative",
            matchNote: "",
          });
          used.add(c.id);
          if (picksForEnrichment.length >= fallbackMaxTotal) break;
        }
      }

      const getFastPickCandidate = (id: number) => candidatesById.get(id);
      picksForEnrichment = reorderFastPicksByRelevance({
        picks: picksForEnrichment,
        getCandidate: getFastPickCandidate,
        signals: intentSignals,
        userPrompt: normalizedInput.userPrompt,
        normalizedIntent: intent.normalizedIntent,
        coreNeeds: intent.coreNeeds ?? [],
        resultCountPolicy,
      });

      if (resultCountPolicy === "quality_first") {
        picksForEnrichment = trimFastPicksToConfidence({
          picks: picksForEnrichment,
          getCandidate: getFastPickCandidate,
          signals: intentSignals,
          userPrompt: normalizedInput.userPrompt,
          normalizedIntent: intent.normalizedIntent,
          coreNeeds: intent.coreNeeds ?? [],
          mustHaveConstraints,
        });
      }

      if (mustHaveConstraints.active) {
        picksForEnrichment = picksForEnrichment.filter((p) => {
          const c = getFastPickCandidate(p.id);
          if (!c) return false;
          return !shouldRejectFastPickForMustHave({
            pick: p,
            candidate: c,
            constraints: mustHaveConstraints,
          });
        });
      }

      // Ensure images if missing.
      let picksWithImages = picksForEnrichment;
      if (rawgKey && picksForEnrichment.some((p) => !p.image)) {
        const tScreens = performance.now();
        picksWithImages = await enrichFinalPicksWithScreenshotFallback({
          rawgKey,
          picks: picksForEnrichment,
        });
        timing.screenshotFallbackMs = performance.now() - tScreens;
        stageMs["rawg.screenshotFallback"] = timing.screenshotFallbackMs;
      }

      const enrichedGames = picksWithImages.map((game) => ({
        ...game,
        price: null as string | null,
        currency: null as string | null,
        buyLink: null as string | null,
        budgetStatus: null,
        budgetNote: null,
      }));

      const payload: {
        games: unknown[];
        usage: { intent: unknown; rerank: unknown };
      } = {
        games: enrichedGames.slice(0, 6),
        usage: {
          intent: aiDiscovery.usage,
          rerank: null,
        },
      };

      const totalMs = nowMs() - fastStarted;
      console.log("[recommend:single-call-fast]", {
        enabled: true,
        generatedPickCount: fastGeneratedPickCount,
        verifiedCount: verified.length,
        aiMs: Math.round(stageMs["ai.singleCallFastDiscovery"] ?? timing.aiDiscoveryMs),
        rawgMs: Math.round(rawgMs + (timing.rawgFallbackMs || 0) + (timing.screenshotFallbackMs || 0)),
        totalMs: Math.round(totalMs),
        rerankSkipped: true,
      });

      // Best-effort cache: do not block response on failures.
      if (!noCache) {
        try {
          const cacheWriteRes = await timed("cache.write", async () => {
            await setCachedAiRecommendation({
              inputHash,
              inputNormalized: cacheKeyInput,
              responseJson: payload,
            });
            await setCachedAiRecommendation({
              inputHash: earlyHash,
              inputNormalized: earlyCacheKeyInput,
              responseJson: payload,
            });
          });
          stageMs["cache.write"] = cacheWriteRes.ms;
        } catch {}
      }

      scheduleRecommendRunLog({
        promptText: recommendLogPrompt,
        routeStarted,
        games: payload.games,
        success: true,
      });
      return NextResponse.json(payload);
    }

    // 3) Fallback retrieval if verification is weak.
    let candidatePool: VerifiedCandidate[] = verified;
    if (rawgKey && candidatePool.length < 6) {
      const fallbackQueries = sanitizeDiscoveryQueries(
        intent.fallbackDiscoveryQueries?.length
          ? intent.fallbackDiscoveryQueries
          : [intent.normalizedIntent].filter(Boolean),
        intentSignals,
        normalizedInput.userPrompt
      );

      const tFallback = performance.now();
      const fetched = await fetchRawgCandidates({
        rawgApiKey: rawgKey,
        discoveryQueries: fallbackQueries,
        pageSize: 20,
      });
      timing.rawgFallbackMs = performance.now() - tFallback;
      stageMs["rawg.fetchCandidatesFallback"] = timing.rawgFallbackMs;

      // Reuse existing RAWG scoring as a best-effort signal.
      const scored = scoreCandidates(
        buildRawgScoreBundle({
          intent,
          fallbackQueries,
          tagTokens,
          userPrompt: normalizedInput.userPrompt,
          intentSignals,
        }),
        dedupeCandidates(fetched)
      );

      const diverse = selectDiverseTop([...scored], 50)
        .map((s) => s.candidate)
        .filter(
          (c) =>
            !shouldRejectCandidateForSignals(c, intentSignals, normalizedInput.userPrompt)
        );
      candidatePool = dedupeCandidates([...candidatePool, ...diverse]);
    }

    candidatePool = filterCandidatesByExclude(candidatePool, excludeNormalized);

    // 4) Final candidate scoring and pruning.
    let scoredFinal = scoreVerifiedCandidates({
      normalizedIntent: intent.normalizedIntent,
      coreNeeds: intent.coreNeeds ?? [],
      avoid: intent.avoid ?? [],
      userBlob,
      tagTokens,
      candidates: candidatePool,
      intentSignals,
      userPrompt: normalizedInput.userPrompt,
    });
    // Conservative diversity: soften canonical anchors, nudge discovery gems when already relevant.
    scoredFinal = applyDiversityScoreAdjustments(scoredFinal);

    // Quality rule: better 3 strong than 5 filler.
    let strong = scoredFinal
      .filter((x) => x.score >= 8 && isProbablyBaseGame(x.candidate))
      .slice(0, 40)
      .map((x) => x.candidate);

    if (strong.length < 4) {
      strong = scoredFinal
        .filter((x) => x.score >= 5 && isProbablyBaseGame(x.candidate))
        .slice(0, 40)
        .map((x) => x.candidate);
    }

    let rerankPool =
      strong.length >= 3 ? strong : scoredFinal.slice(0, 40).map((x) => x.candidate);

    if (rerankPool.length > PRERANK_POOL_MAX) {
      const scoreById = new Map(scoredFinal.map((x) => [x.candidate.id, x.score]));
      const scoredForDiv = rerankPool.map((c) => ({
        candidate: c,
        score: scoreById.get(c.id) ?? 0,
      }));
      rerankPool = selectDiverseTop(scoredForDiv, PRERANK_POOL_MAX).map((x) => x.candidate);
    }

    // 4.5) RAWG detail prefetch + generic AI semantic relevance filter (drop filler/unrelated).
    let filteredPool = rerankPool as VerifiedCandidate[];
    const tSemantic = performance.now();
    if (rawgKey && filteredPool.length > 0) {
      const tRawgDetails = performance.now();
      filteredPool = await enrichWithRawgDetails({
        rawgKey,
        candidates: filteredPool,
        maxToFetch: Math.min(16, PRERANK_POOL_MAX),
      });
      timing.rawgDetailsMs = performance.now() - tRawgDetails;
      stageMs["rawg.detailsPrefetch"] = timing.rawgDetailsMs;

      stage = "relevance";
      const tSemanticJudge = performance.now();
      const rel = await aiSemanticRelevanceFilter({
        openai,
        userQuery: normalizedInput.userPrompt,
        normalizedIntent: intent.normalizedIntent,
        coreNeeds: intent.coreNeeds ?? [],
        avoid: intent.avoid ?? [],
        candidates: filteredPool,
        budgetHint: normalizedInput.budget || "not specified",
        selectedTagsLine,
        filtersEnabled,
        mechanicsLine: normalizedInput.mechanics || "",
        vibesLine: normalizedInput.vibes || "",
      });
      timing.semanticJudgeMs = performance.now() - tSemanticJudge;
      stageMs["ai.semanticJudge"] = timing.semanticJudgeMs;

      filteredPool = rel.kept;
    }
    timing.semanticFilterMs = performance.now() - tSemantic;
    stageMs["semanticFilter.total"] = timing.semanticFilterMs;

    // 5) Final rerank: AI picks ONLY from verified pool by id.
    const hasCandidatePool = filteredPool.length > 0;
    const rerankCompact = filteredPool.length <= 5;
    const explicitRerankBlock = explicitRequirementPenaltyBlock({
      userQuery: normalizedInput.userPrompt,
      coreNeeds: intent.coreNeeds ?? [],
      mechanicsLine: normalizedInput.mechanics || "",
      vibesLine: normalizedInput.vibes || "",
    });
    const structuredSummary = [
      `g:${(normalizedInput.genres || "").slice(0, 96)}`,
      `ps:${(normalizedInput.playStyles || "").slice(0, 96)}`,
      `v:${(normalizedInput.vibes || "").slice(0, 96)}`,
      `m:${(normalizedInput.mechanics || "").slice(0, 96)}`,
      `p:${(normalizedInput.platform || "").slice(0, 72)}`,
      `b:${(normalizedInput.budget || "").slice(0, 36)}`,
    ].join("|");

    const rankingHint = filtersEnabled
      ? `- Weight user-selected tags, genres, platform, and maximum budget heavily when ranking. Strong semantic matches that ignore key tags should be partial_match or ranked lower.`
      : `- Discovery mode (structured filters OFF): prioritize fit to the user request and intent. Do not penalize picks solely because optional structured tags/platform/budget were not provided in the UI; rank by described vibe and relevance.`;
    const copyLocale = inferRecommendCopyLocale(normalizedInput.userPrompt);
    stage = "rerank";

    const rerankMessages = [
      {
        role: "system" as const,
        content: `
You are GamePing AI, a premium video game recommendation assistant.

Return ONLY valid JSON in this exact format:
{
  "games": [
    {
      "id": 123,
      "match": 95,
      "reason": "2–3 short sentences: why this pick fits the user's request (experience, mood, loop — not a genre wiki summary).",
      "matchTier": "best_match",
      "matchNote": "One short tradeoff or fit hook (or empty string for best_match)."
    }
  ]
}

matchTier MUST be one of: "best_match", "good_alternative", "partial_match".

Rules:
- Target 3 to 4 strong games when the pool supports it; never exceed 6. Minimum 3 only when at least 3 are genuinely good fits.
- Prefer 3–4 excellent picks over 6 weak fillers; omit weak ids rather than writing confident reasons for loose matches.
- When several candidates fit equally, prefer some variety over repeating the same famous "safe" picks; include at most 1–2 lesser-known discoveries only when they clearly fit the request.
- Use good_alternative / partial_match honestly when tradeoffs exist; never label a weak fit as best_match.
- You MUST pick ONLY ids from the provided candidate pool. Do not invent titles. Do not output titles.
- Match must be a number from 0 to 100 (semantic fit including tags/genres/platforms intent).
${rerankCopyStyleBlock(copyLocale)}
${explicitRerankBlock}
${rankingHint}
- Do not quote exact prices in "reason" or "matchNote"; budget is handled separately.
- No markdown, no bullet symbols, no extra keys.
`,
      },
      {
        role: "user" as const,
        content: `
User request: ${normalizedInput.userPrompt || "not specified"}
Normalized intent: ${intent.normalizedIntent || "not specified"}
Core needs: ${intent.coreNeeds?.length ? intent.coreNeeds.join(", ") : "none"}
Avoid: ${intent.avoid?.length ? intent.avoid.join(", ") : "none"}
Selected tags (priority): ${selectedTagsLine || "not specified"}
Structured filters (compact): ${structuredSummary}
Output language for "reason" and "matchNote": ${copyLocale === "it" ? "Italian" : "English"} (match the user request).

${hasCandidatePool ? `Candidate pool (pick ids only):\n${JSON.stringify(
          filteredPool.map((c) => buildRerankCandidatePayload(c, rerankCompact)),
          null,
          0
        )}` : "Candidate pool: none"}
`,
      },
    ];

    const rerankPromptChars = rerankMessages.reduce(
      (acc, m) => acc + m.content.length,
      0
    );

    const tRerank = performance.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: rerankMessages,
    });
    timing.rerankMs = performance.now() - tRerank;
    stageMs["ai.rerank"] = timing.rerankMs;

    const text = response.choices[0].message.content || '{"games":[]}';

    if (process.env.NODE_ENV === "development") {
      console.log("[recommend:rerank]", {
        model: response.model ?? "gpt-4o-mini",
        candidateCount: filteredPool.length,
        promptCharLength: rerankPromptChars,
        responseCharLength: text.length,
        executionMs: Math.round(timing.rerankMs),
        retries: 0,
      });
    }
    const parsed = safeParseJson<{ games?: unknown }>(text) || { games: [] };
    const aiPicked = Array.isArray(parsed.games)
      ? (parsed.games as Array<Record<string, unknown>>)
      : [];

    const poolById = new Map<number, VerifiedCandidate>();
    for (const c of filteredPool) poolById.set(c.id, c as VerifiedCandidate);

    const pickedVerified = aiPicked
      .map((g) => {
        const id =
          typeof g.id === "number"
            ? g.id
            : typeof g.id === "string"
              ? Number(g.id)
              : NaN;
        if (!Number.isFinite(id)) return null;
        const c = poolById.get(Number(id));
        if (!c) return null;
        if (excludeNormalized.has(normalizeTitleForMatch(c.name))) return null;

        const matchRaw =
          typeof g.match === "number"
            ? g.match
            : typeof g.match === "string"
              ? Number(g.match)
              : 0;
        const match = clamp(Number.isFinite(matchRaw) ? matchRaw : 0, 0, 100);
        const reason = typeof g.reason === "string" ? g.reason : "";
        const tierRaw = g.matchTier;
        let matchTier: MatchTier = "best_match";
        if (
          tierRaw === "good_alternative" ||
          tierRaw === "partial_match" ||
          tierRaw === "best_match"
        ) {
          matchTier = tierRaw;
        }
        const matchNote =
          typeof g.matchNote === "string" ? g.matchNote.trim() : "";

        return {
          id: c.id,
          title: c.name,
          slug: c.slug ?? null,
          image: c.background_image ?? null,
          match,
          reason,
          matchTier,
          matchNote,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .slice(0, 6);

    let picksForEnrichment: PreEnrichPick[] = balanceFinalPicksDiversity(
      pickedVerified
    );

    if (picksForEnrichment.length === 0 && scoredFinal.length > 0) {
      picksForEnrichment = buildDeterministicFallbackPicks({
        scoredFinal,
        isExcluded: (title) => excludeNormalized.has(normalizeTitleForMatch(title)),
        locale: copyLocale,
        max: 4,
        mapCandidate: (c) => ({
          id: c.id,
          title: c.name,
          slug: c.slug ?? null,
          image: c.background_image ?? null,
        }),
      });
    }

    const tRecovery = performance.now();
    if (picksForEnrichment.length < 3) {
      picksForEnrichment = augmentPicksWithRecovery({
        primaryPicks: picksForEnrichment,
        candidatePool,
        scoredFinal,
        intent: {
          normalizedIntent: intent.normalizedIntent,
          coreNeeds: intent.coreNeeds ?? [],
          fallbackDiscoveryQueries: intent.fallbackDiscoveryQueries ?? [],
        },
        normalizedInput,
        tagTokens,
        excludeNormalized,
        filtersEnabled,
        locale: copyLocale,
        intentSignals,
      });
    }
    picksForEnrichment = balanceFinalPicksDiversity(picksForEnrichment);
    timing.recoveryMs = performance.now() - tRecovery;
    stageMs["recovery"] = timing.recoveryMs;

    if (process.env.NODE_ENV === "development") {
      const totalMs = performance.now() - perfRouteStart;
      console.log("[recommend:timing]", {
        totalMs,
        aiDiscoveryMs: timing.aiDiscoveryMs,
        rawgVerificationMs: timing.rawgVerificationMs,
        rawgFallbackMs: timing.rawgFallbackMs,
        semanticFilterMs: timing.semanticFilterMs,
        rerankMs: timing.rerankMs,
        recoveryMs: timing.recoveryMs,
        cacheMs: timing.cacheMs,
        earlyCacheMs: timing.earlyCacheMs,
        fullCacheMs: timing.fullCacheMs,
        cacheHit: cacheHitSource,
        candidatePoolSize: candidatePool.length,
        finalCount: picksForEnrichment.length,
      });
      const warnSlow = (label: string, ms: number) => {
        if (ms > 8000) {
          console.warn(`[recommend:timing:slow] ${label} ${ms.toFixed(0)}ms`);
        }
      };
      warnSlow("aiDiscovery", timing.aiDiscoveryMs);
      warnSlow("rawgVerification", timing.rawgVerificationMs);
      warnSlow("rawgFallback", timing.rawgFallbackMs);
      warnSlow("semanticFilter", timing.semanticFilterMs);
      warnSlow("rerank", timing.rerankMs);
    }

    const cheapSharkDebug: RecommendDebug["cheapShark"] = [];

    let picksWithImages = picksForEnrichment;
    if (rawgKey && picksForEnrichment.some((p) => !p.image)) {
      const tScreens = performance.now();
      picksWithImages = await enrichFinalPicksWithScreenshotFallback({
        rawgKey,
        picks: picksForEnrichment,
      });
      timing.screenshotFallbackMs = performance.now() - tScreens;
      stageMs["rawg.screenshotFallback"] = timing.screenshotFallbackMs;
    }

    // Cards: discovery only — no live pricing (verified on /game/[slug]).
    const enrichedGames = picksWithImages.map((game) => ({
      ...game,
      price: null as string | null,
      currency: null as string | null,
      buyLink: null as string | null,
      budgetStatus: null,
      budgetNote: null,
    }));

    const finalGames = enrichedGames;

    const payload: {
      games: unknown[];
      usage: { intent: unknown; rerank: unknown };
      debug?: RecommendDebug;
    } = {
      games: finalGames.slice(0, 6),
      usage: {
        intent: aiDiscovery.usage,
        rerank: response.usage,
      },
    };

    if (debugEnabled) {
      const responseTitles = payload.games
        .map((g) => (g as { title?: unknown }).title)
        .filter((t): t is string => typeof t === "string");

      payload.debug = {
        filtersEnabled,
        usageLimit: {
          plan: plan ?? null,
          bypass: bypassLimits,
          used: bypassLimits ? 0 : usageAfter.used,
          limit: bypassLimits ? null : usageAfter.limit,
          dailyCap: dailyLimitValue,
        },
        cacheHit: cacheHitSource !== null,
        cacheHitSource: cacheHitSource ?? undefined,
        inputHash,
        resolvedInput: normalizedInput.userPrompt,
        noCache,
        cacheReadSkipped: noCache,
        cacheWriteSkipped: noCache,
        pricingMode: "cards_only_no_live_pricing",
        recommendLivePrices: false,
        models: {
          discovery: "gpt-4o-mini",
          relevance: "gpt-4o-mini",
          rerank: "gpt-4o-mini",
        },
        env: {
          hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
          hasRawgKey: Boolean(process.env.RAWG_API_KEY),
          nodeEnv: process.env.NODE_ENV,
          siteUrl:
            process.env.NEXT_PUBLIC_SITE_URL ??
            process.env.NEXT_PUBLIC_VERCEL_URL ??
            process.env.VERCEL_URL,
        },
        candidates: {
          beforeAiFilter: rerankPool.length,
          afterAiFilter: filteredPool.length,
        },
        selected: {
          titles: finalGames.map((g) => (g as { title?: unknown }).title).filter((t): t is string => typeof t === "string"),
        },
        finalResponse: {
          count: responseTitles.length,
          titles: responseTitles,
        },
        cheapShark: cheapSharkDebug,
      };

      // Note: price/deal lookups are handled on the game details page (and future price cache/cron).
      // Also log in production for quick Vercel inspection.
      console.log("[recommend:debug]", payload.debug);
    }

    // Best-effort cache: do not block response on failures.
    if (!noCache) {
      try {
        const cacheWriteRes = await timed("cache.write", async () => {
          await setCachedAiRecommendation({
            inputHash,
            inputNormalized: cacheKeyInput,
            responseJson: payload,
          });
          await setCachedAiRecommendation({
            inputHash: earlyHash,
            inputNormalized: earlyCacheKeyInput,
            responseJson: payload,
          });
        });
        stageMs["cache.write"] = cacheWriteRes.ms;
      } catch {}
    }

    const totalMs = nowMs() - routeStarted;
    if (!debugEnabled && totalMs > 12_000) {
      console.warn("[recommend:timing:slow]", {
        requestId,
        totalMs: Math.round(totalMs),
        aiDiscoveryMs: Math.round(timing.aiDiscoveryMs),
        rawgVerificationMs: Math.round(timing.rawgVerificationMs),
        rawgFallbackMs: Math.round(timing.rawgFallbackMs),
        rawgDetailsMs: Math.round(timing.rawgDetailsMs),
        semanticJudgeMs: Math.round(timing.semanticJudgeMs),
        semanticFilterMs: Math.round(timing.semanticFilterMs),
        rerankMs: Math.round(timing.rerankMs),
        recoveryMs: Math.round(timing.recoveryMs),
        screenshotFallbackMs: Math.round(timing.screenshotFallbackMs),
        earlyCacheMs: Math.round(timing.earlyCacheMs),
        fullCacheMs: Math.round(timing.fullCacheMs),
        cacheHitSource,
        quotaConsumed,
        stageMs,
      });
    }

    scheduleRecommendRunLog({
      promptText: recommendLogPrompt,
      routeStarted,
      games: payload.games,
      success: true,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("OpenAI error:", error);
    scheduleRecommendRunLog({
      promptText: recommendLogPrompt,
      routeStarted,
      success: false,
      errorCode: stage !== "unknown" ? stage : "recommend_failed",
    });
    if (debugEnabled) {
      const err = error as unknown as {
        message?: unknown;
        name?: unknown;
        status?: unknown;
        code?: unknown;
        type?: unknown;
      };

      const key = process.env.OPENAI_API_KEY;
      const openAiKeyPrefix =
        typeof key === "string" && key.startsWith("sk-") ? key.slice(0, 7) : null;

      return NextResponse.json(
        {
          error: "AI failed",
          stage,
          message: typeof err.message === "string" ? err.message : "Unknown error",
          name: typeof err.name === "string" ? err.name : undefined,
          status: typeof err.status === "number" ? err.status : undefined,
          code: typeof err.code === "string" ? err.code : undefined,
          type: typeof err.type === "string" ? err.type : undefined,
          hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
          openAiKeyPrefix,
          runtime: {
            nodeEnv: process.env.NODE_ENV,
            vercel: process.env.VERCEL,
            vercelRegion: process.env.VERCEL_REGION,
            vercelEnv: process.env.VERCEL_ENV,
            url: url?.toString() ?? req.url,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}