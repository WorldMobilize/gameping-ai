import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getCachedAiRecommendation,
  hashNormalizedInput,
  setCachedAiRecommendation,
} from "@/lib/cache";
import { PROMPT_MAX_DEFAULT } from "@/lib/recommend-limits";
import {
  getPromptMaxChars,
  getRecommendDailyLimit,
  shouldBypassRecommendLimits,
  tryConsumeRecommendDailySlot,
} from "@/lib/recommend-usage";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import {
  dedupeCandidates,
  fetchRawgGameDetails,
  fetchRawgCandidates,
  isLowQualityTitle,
  searchRawgByTitle,
  scoreCandidates,
  selectDiverseTop,
  titleMatchQuality,
  type RawgCandidate,
} from "@/lib/rawg-discovery";
import { aiFirstDiscovery, type AiSuggestedTitle } from "@/lib/ai-game-discovery";

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
  const details = await Promise.all(
    slice.map(async (c) => {
      const d = await fetchRawgGameDetails({ rawgApiKey: rawgKey, rawgId: c.id });
      return d ? [c.id, d] as const : null;
    })
  );
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
  } = params;

  if (candidates.length === 0) return { kept: [] as VerifiedCandidate[], usage: null as unknown };

  const constraintRule = filtersEnabled
    ? `- Weight selected tags and budget seriously: a candidate that ignores stated genres/tags or clearly violates budget spirit should be marked relevant=false unless it is an exceptional semantic fit.`
    : `- Discovery mode (structured filters OFF): judge relevance primarily from the user query and intent. Do NOT reject candidates for missing optional tags/platform/budget unless the user explicitly demanded them in the query.`;

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

  const allResults: AiRelevanceResult[] = [];
  let totalUsage: unknown = null;

  for (const batch of batches) {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
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
${constraintRule}
`,
        },
        {
          role: "user",
          content: `
User query: ${userQuery || "not specified"}
Normalized intent: ${normalizedIntent || "not specified"}
Core needs: ${coreNeeds.length ? coreNeeds.join(", ") : "none"}
Avoid: ${avoid.length ? avoid.join(", ") : "none"}
Selected tags (user-selected, high priority): ${tagsLine}
Maximum budget (numeric cap): ${budgetLine}

Candidates:
${JSON.stringify(
            batch.map((c) => ({
              rawgId: c.id,
              slug: c.slug ?? null,
              name: c.name,
              description_raw: c.description_raw ?? null,
              genres: (c.genres ?? []).map((g) => g.name).slice(0, 8),
              tags: (c.tags ?? []).map((t) => t.name).slice(0, 16),
              platforms: (c.platforms ?? []).slice(0, 10),
              stores: (c.stores ?? []).slice(0, 10),
              released: c.released ?? null,
              rating: typeof c.rating === "number" ? c.rating : null,
            })),
            null,
            0
          )}
`,
        },
      ],
    });

    totalUsage = totalUsage ? totalUsage : resp.usage;

    const text = resp.choices[0].message.content || '{"results":[]}';
    const parsed = safeParseJson<{ results?: unknown }>(text) || { results: [] };
    const normalized = normalizeRelevanceResults(parsed.results);
    allResults.push(...normalized);
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
}) {
  const { rawgKey, suggestedTitles, excludeNormalized } = params;
  const verified: VerifiedCandidate[] = [];

  for (const s of suggestedTitles.slice(0, 15)) {
    const title = s.title.trim();
    if (!title) continue;
    if (excludeNormalized.has(normalizeTitleForMatch(title))) continue;

    const results = await searchRawgByTitle({
      rawgApiKey: rawgKey,
      title,
      pageSize: 8,
    });

    if (!results.length) continue;

    let best: RawgCandidate | null = null;
    let bestScore = -Infinity;
    let bestMatch = 0;

    for (const c of results) {
      const tm = titleMatchQuality(title, c.name);
      if (tm < 0.74) continue;
      if (!isProbablyBaseGame(c)) continue;

      const score = tm * 100 + metadataQualityScore(c) + popularityScore(c) * 0.35;
      if (score > bestScore) {
        bestScore = score;
        best = c;
        bestMatch = tm;
      }
    }

    if (!best) continue;
    if (excludeNormalized.has(normalizeTitleForMatch(best.name))) continue;

    verified.push({
      ...best,
      _suggested: {
        title: s.title,
        confidence: s.confidence,
        expectedMatch: s.expectedMatch,
        reason: s.reason,
        titleMatch: bestMatch,
      },
    });
  }

  return dedupeCandidates(verified);
}

function scoreVerifiedCandidates(params: {
  normalizedIntent: string;
  coreNeeds: string[];
  avoid: string[];
  userBlob: string;
  tagTokens: string[];
  candidates: VerifiedCandidate[];
}) {
  const { normalizedIntent, coreNeeds, avoid, userBlob, tagTokens, candidates } = params;

  const scored = candidates.map((c) => {
    const heuristic = semanticHeuristicScore({
      normalizedIntent,
      coreNeeds,
      avoid,
      userBlob,
      tagTokens,
      candidate: c,
    });

    const titleMatch = c._suggested?.titleMatch ?? 0;
    const conf = c._suggested?.confidence ?? 0;
    const titleBoost = titleMatch > 0 ? titleMatch * 18 : 0;
    const confBoost = titleMatch > 0 ? (conf / 100) * 10 : 0;
    const meta = metadataQualityScore(c);
    const pop = popularityScore(c);

    return { candidate: c, score: heuristic + titleBoost + confBoost + meta + pop };
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
  addPhrase(params.userPrompt);
  addPhrase(params.normalizedIntent);
  params.coreNeeds.forEach((x) => addPhrase(x));
  params.tagTokens.forEach((x) => addPhrase(x));
  params.fallbackQueries.forEach((x) => addPhrase(x));
  return set;
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
}): PreEnrichPick {
  const { c, semanticScore, overlap, overlapping } = params;
  const tier: MatchTier = overlap >= 2 ? "good_alternative" : "partial_match";
  const match = clamp(
    50 + Math.min(14, Math.floor((semanticScore - RECOVERY_SEMANTIC_SCORE_FLOOR) / 3)),
    48,
    66
  );
  const themes = overlapping.slice(0, 5).join(", ") || "your stated themes";
  const matchNote =
    tier === "good_alternative"
      ? `Added from the expanded pool: aligns with ${themes}, but less exact than top picks.`
      : `Broader pick from the candidate pool; partial overlap with ${themes}.`;
  const reason = `Supporting alternative from the broader search pool. It shares keywords with your request (${themes}) but was outside the strict shortlist; included to give you more viable options.`;
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
    if (merged.length >= 6) break;
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
      })
    );
    usedIds.add(extra.c.id);
  }

  return merged;
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

  try {

    let userId: string | null = null;
    let plan: string | null = null;
    try {
      const supabase = await createCookieClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", userId)
          .maybeSingle();
        plan = profile?.plan ?? "free";
      }
    } catch {}

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const filtersEnabled = parseFiltersEnabled(body);
    const normalizedInput = effectiveNormalizedInput(
      normalizeInput(body),
      filtersEnabled
    );
    if (!normalizedInput.userPrompt.trim()) {
      return NextResponse.json(
        { error: "Missing recommendation query" },
        { status: 400 }
      );
    }

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
    let usageAfter = { allowed: true as boolean, used: 0, limit: dailyLimitValue };

    if (!bypassLimits) {
      usageAfter = await tryConsumeRecommendDailySlot({
        req,
        userId,
        dailyLimit: dailyLimitValue,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("[recommend:usage-limit]", {
          userId,
          isAdmin: plan === "admin",
          plan: plan ?? "anon",
          used: usageAfter.used,
          limit: usageAfter.limit,
          allowed: usageAfter.allowed,
        });
      }

      if (!usageAfter.allowed) {
        return NextResponse.json(
          {
            error: "daily_limit",
            message:
              "Daily AI recommendation limit reached. Try again tomorrow.",
          },
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
      });
    }

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

    // 1) AI-first discovery (titles + intent).
    stage = "discovery";
    const aiDiscovery = await aiFirstDiscovery({
      openai,
      filtersEnabled,
      normalizedInput: {
        ...normalizedInput,
        selectedTags: resolvedSelectedTags.join(", "),
      },
    });
    const intent = aiDiscovery.intent;

    intent.fallbackDiscoveryQueries = augmentIslandSurvivalFallbackQueries({
      queries: intent.fallbackDiscoveryQueries ?? [],
      userPrompt: normalizedInput.userPrompt,
      normalizedIntent: intent.normalizedIntent,
      coreNeeds: intent.coreNeeds ?? [],
      resolvedTags: resolvedSelectedTags,
    });

    const regexRefs = extractReferenceTitlesFromPrompt(normalizedInput.userPrompt);
    const excludeListRaw = [
      ...regexRefs,
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
      resolvedSelectedTags,
      intent,
    };

    const inputHash = hashNormalizedInput(cacheKeyInput);
    const cached = await getCachedAiRecommendation<{
      games: unknown[];
      usage?: unknown;
    }>(inputHash);

    if (cached && !debugEnabled && !noCache) {
      return NextResponse.json(cached);
    }

    const rawgKey = process.env.RAWG_API_KEY || "";
    let verified: VerifiedCandidate[] = [];

    // 2) RAWG verification pass for AI-suggested titles.
    if (rawgKey) {
      verified = await verifySuggestedTitles({
        rawgKey,
        suggestedTitles: intent.suggestedTitles,
        excludeNormalized,
      });
    }

    verified = filterCandidatesByExclude(verified, excludeNormalized);

    // 3) Fallback retrieval if verification is weak.
    let candidatePool: VerifiedCandidate[] = verified;
    if (rawgKey && candidatePool.length < 6) {
      const fallbackQueries =
        intent.fallbackDiscoveryQueries?.length
          ? intent.fallbackDiscoveryQueries
          : [intent.normalizedIntent].filter(Boolean);

      const fetched = await fetchRawgCandidates({
        rawgApiKey: rawgKey,
        discoveryQueries: fallbackQueries,
        pageSize: 20,
      });

      // Reuse existing RAWG scoring as a best-effort signal.
      const scored = scoreCandidates(
        {
          normalizedIntent: intent.normalizedIntent,
          coreKeywords: intent.coreNeeds ?? [],
          discoveryQueries: fallbackQueries,
          negativeKeywords: intent.avoid ?? [],
          preferredGenresOrTags: tagTokens,
        },
        dedupeCandidates(fetched)
      );

      const diverse = selectDiverseTop([...scored], 50).map((s) => s.candidate);
      candidatePool = dedupeCandidates([...candidatePool, ...diverse]);
    }

    candidatePool = filterCandidatesByExclude(candidatePool, excludeNormalized);

    // 4) Final candidate scoring and pruning.
    const scoredFinal = scoreVerifiedCandidates({
      normalizedIntent: intent.normalizedIntent,
      coreNeeds: intent.coreNeeds ?? [],
      avoid: intent.avoid ?? [],
      userBlob,
      tagTokens,
      candidates: candidatePool,
    });

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

    const rerankPool =
      strong.length >= 3 ? strong : scoredFinal.slice(0, 40).map((x) => x.candidate);

    // 4.5) Generic AI semantic relevance filter (drop filler/unrelated).
    let filteredPool = rerankPool as VerifiedCandidate[];
    if (rawgKey && filteredPool.length > 0) {
      // Best-effort: enrich top items with RAWG detail descriptions.
      filteredPool = await enrichWithRawgDetails({
        rawgKey,
        candidates: filteredPool,
        maxToFetch: 18,
      });

      stage = "relevance";
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
      });

      filteredPool = rel.kept;
    }

    // 5) Final rerank: AI picks ONLY from verified pool by id.
    const hasCandidatePool = filteredPool.length > 0;
    const rankingHint = filtersEnabled
      ? `- Weight user-selected tags, genres, platform, and maximum budget heavily when ranking. Strong semantic matches that ignore key tags should be partial_match or ranked lower.`
      : `- Discovery mode (structured filters OFF): prioritize fit to the user request and intent. Do not penalize picks solely because optional structured tags/platform/budget were not provided in the UI; rank by described vibe and relevance.`;
    stage = "rerank";
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are GamePing AI, a premium video game recommendation assistant.

Return ONLY valid JSON in this exact format:
{
  "games": [
    {
      "id": 123,
      "match": 95,
      "reason": "Two or three sentences explaining fit and audience.",
      "matchTier": "best_match",
      "matchNote": "One short sentence on fit vs compromises (or empty string)."
    }
  ]
}

matchTier MUST be one of: "best_match", "good_alternative", "partial_match".

Rules:
- Target 4 to 6 games when the pool supports it; never exceed 6. Minimum goal 3 picks when possible.
- Prefer fewer excellent picks over random filler; use good_alternative / partial_match honestly when tradeoffs exist.
- You MUST pick ONLY ids from the provided candidate pool. Do not invent titles. Do not output titles.
- Match must be a number from 0 to 100 (semantic fit including tags/genres/platforms intent).
- Each "reason" must be 2–3 concise sentences in plain English (no markdown, no bullet symbols).
- "matchNote" must briefly state tradeoffs for good_alternative/partial_match (e.g. more combat, less chill). For best_match it can be empty or reinforce the fit.
${rankingHint}
- Do not quote exact prices in "reason" or "matchNote"; budget is handled separately.
- Do not include markdown or extra keys.
`,
        },
        {
          role: "user",
          content: `
User request: ${normalizedInput.userPrompt || "not specified"}
Normalized intent: ${intent.normalizedIntent || "not specified"}
Core needs: ${intent.coreNeeds?.length ? intent.coreNeeds.join(", ") : "none"}
Avoid: ${intent.avoid?.length ? intent.avoid.join(", ") : "none"}

Selected tags (priority): ${selectedTagsLine || "not specified"}

Genres:
${normalizedInput.genres || "not specified"}

Play styles:
${normalizedInput.playStyles || "not specified"}

Vibes:
${normalizedInput.vibes || "not specified"}

Mechanics:
${normalizedInput.mechanics || "not specified"}

Platform:
${normalizedInput.platform || "not specified"}

Maximum budget (numeric):
${normalizedInput.budget || "not specified"}

${hasCandidatePool ? `Candidate pool (pick ids from this list only):\n${JSON.stringify(
            filteredPool.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug ?? null,
              released: c.released ?? null,
              rating: typeof c.rating === "number" ? c.rating : null,
              ratings_count:
                typeof c.ratings_count === "number" ? c.ratings_count : null,
              added: typeof c.added === "number" ? c.added : null,
              hasImage: Boolean(c.background_image),
              genres: (c.genres ?? []).map((g) => g.name).slice(0, 8),
              tags: (c.tags ?? []).map((t) => t.name).slice(0, 12),
              aiHint: (c as VerifiedCandidate)._suggested
                ? {
                    suggestedTitle: (c as VerifiedCandidate)._suggested!.title,
                    confidence: (c as VerifiedCandidate)._suggested!.confidence,
                    expectedMatch: (c as VerifiedCandidate)._suggested!.expectedMatch,
                  }
                : null,
            })),
            null,
            0
          )}` : "Candidate pool: none"}
`,
        },
      ],
    });

    const text = response.choices[0].message.content || '{"games":[]}';
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

    let picksForEnrichment: PreEnrichPick[] = pickedVerified;
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
      });
    }

    const cheapSharkDebug: RecommendDebug["cheapShark"] = [];

    // Cards: discovery only — no live pricing (verified on /game/[slug]).
    const enrichedGames = picksForEnrichment.map((game) => ({
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
        cacheHit: Boolean(cached),
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
        await setCachedAiRecommendation({
          inputHash,
          inputNormalized: cacheKeyInput,
          responseJson: payload,
        });
      } catch {}
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("OpenAI error:", error);
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