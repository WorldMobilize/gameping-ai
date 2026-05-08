import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getCachedAiRecommendation,
  hashNormalizedInput,
  setCachedAiRecommendation,
} from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
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

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

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
}) {
  const { openai, userQuery, normalizedIntent, coreNeeds, avoid, candidates } = params;

  if (candidates.length === 0) return { kept: [] as VerifiedCandidate[], usage: null as unknown };

  // Keep calls bounded: judge at most 40 candidates total (top-scored pool).
  const toJudge = candidates.slice(0, 40);
  const batches = chunk(toJudge, 20);

  const allResults: AiRelevanceResult[] = [];
  let totalUsage: unknown = null;

  for (const batch of batches) {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.15,
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
`,
        },
        {
          role: "user",
          content: `
User query: ${userQuery || "not specified"}
Normalized intent: ${normalizedIntent || "not specified"}
Core needs: ${coreNeeds.length ? coreNeeds.join(", ") : "none"}
Avoid: ${avoid.length ? avoid.join(", ") : "none"}

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

  const kept = toJudge.filter((c) => {
    const r = keepById.get(c.id);
    if (!r) return false;
    return r.relevant === true && r.confidence >= 0.7;
  });

  return { kept, usage: totalUsage };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeInput(body: unknown) {
  const {
    userPrompt,
    genres,
    playStyles,
    vibes,
    mechanics,
    platform,
    budget,
  } = (body ?? {}) as Record<string, unknown>;

  return {
    userPrompt: typeof userPrompt === "string" ? userPrompt.trim() : "",
    genres: typeof genres === "string" ? genres.trim() : "",
    playStyles: typeof playStyles === "string" ? playStyles.trim() : "",
    vibes: typeof vibes === "string" ? vibes.trim() : "",
    mechanics: typeof mechanics === "string" ? mechanics.trim() : "",
    platform: typeof platform === "string" ? platform.trim() : "",
    budget: typeof budget === "string" ? budget.trim() : String(budget ?? "").trim(),
  };
}

function inputBlob(input: {
  userPrompt: string;
  genres: string;
  playStyles: string;
  vibes: string;
  mechanics: string;
  platform: string;
}) {
  return [
    input.userPrompt,
    input.genres,
    input.playStyles,
    input.vibes,
    input.mechanics,
    input.platform,
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
  candidate: RawgCandidate;
}) {
  const { normalizedIntent, coreNeeds, avoid, userBlob, candidate } = params;
  const genreText = (candidate.genres ?? []).map((g) => g.name).join(" | ");
  const tagText = (candidate.tags ?? []).map((t) => t.name).join(" | ");
  const blob = `${candidate.name} | ${genreText} | ${tagText}`.toLowerCase();
  const intent = `${normalizedIntent} | ${userBlob}`.toLowerCase();

  let s = 0;

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
}) {
  const { rawgKey, suggestedTitles } = params;
  const verified: VerifiedCandidate[] = [];

  for (const s of suggestedTitles.slice(0, 15)) {
    const title = s.title.trim();
    if (!title) continue;

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
  candidates: VerifiedCandidate[];
}) {
  const { normalizedIntent, coreNeeds, avoid, userBlob, candidates } = params;

  const scored = candidates.map((c) => {
    const heuristic = semanticHeuristicScore({
      normalizedIntent,
      coreNeeds,
      avoid,
      userBlob,
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

export async function POST(req: Request) {
  try {
    // Rate limit: 10 requests / 10 minutes per user (fallback to IP).
    let userId: string | null = null;
    try {
      const supabase = await createCookieClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {}

    const rl = await rateLimit({
      req,
      action: "recommend",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      userId,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          action: "recommend",
          limit: rl.limit,
          resetAt: rl.resetAt,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const normalizedInput = normalizeInput(body);
    const userBlob = inputBlob({
      userPrompt: normalizedInput.userPrompt,
      genres: normalizedInput.genres,
      playStyles: normalizedInput.playStyles,
      vibes: normalizedInput.vibes,
      mechanics: normalizedInput.mechanics,
      platform: normalizedInput.platform,
    });

    // 1) AI-first discovery (titles + intent).
    const aiDiscovery = await aiFirstDiscovery({
      openai,
      normalizedInput,
    });
    const intent = aiDiscovery.intent;

    // Cache key must include intent so different requests don't collide.
    const cacheKeyInput = {
      ...normalizedInput,
      intent,
    };

    const inputHash = hashNormalizedInput(cacheKeyInput);
    const cached = await getCachedAiRecommendation<{
      games: unknown[];
      usage?: unknown;
    }>(inputHash);

    if (cached) {
      return NextResponse.json(cached);
    }

    const rawgKey = process.env.RAWG_API_KEY || "";
    let verified: VerifiedCandidate[] = [];

    // 2) RAWG verification pass for AI-suggested titles.
    if (rawgKey) {
      verified = await verifySuggestedTitles({
        rawgKey,
        suggestedTitles: intent.suggestedTitles,
      });
    }

    // 3) Fallback retrieval if verification is weak.
    let candidatePool: VerifiedCandidate[] = verified;
    if (rawgKey && candidatePool.length < 3) {
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
          preferredGenresOrTags: [],
        },
        dedupeCandidates(fetched)
      );

      const diverse = selectDiverseTop([...scored], 50).map((s) => s.candidate);
      candidatePool = dedupeCandidates([...candidatePool, ...diverse]);
    }

    // 4) Final candidate scoring and pruning.
    const scoredFinal = scoreVerifiedCandidates({
      normalizedIntent: intent.normalizedIntent,
      coreNeeds: intent.coreNeeds ?? [],
      avoid: intent.avoid ?? [],
      userBlob,
      candidates: candidatePool,
    });

    // Quality rule: better 3 strong than 5 filler.
    const strong = scoredFinal
      .filter((x) => x.score >= 8 && isProbablyBaseGame(x.candidate))
      .slice(0, 40)
      .map((x) => x.candidate);

    const rerankPool =
      strong.length >= 3 ? strong : scoredFinal.slice(0, 25).map((x) => x.candidate);

    // 4.5) Generic AI semantic relevance filter (drop filler/unrelated).
    let filteredPool = rerankPool as VerifiedCandidate[];
    if (rawgKey && filteredPool.length > 0) {
      // Best-effort: enrich top items with RAWG detail descriptions.
      filteredPool = await enrichWithRawgDetails({
        rawgKey,
        candidates: filteredPool,
        maxToFetch: 18,
      });

      const rel = await aiSemanticRelevanceFilter({
        openai,
        userQuery: normalizedInput.userPrompt,
        normalizedIntent: intent.normalizedIntent,
        coreNeeds: intent.coreNeeds ?? [],
        avoid: intent.avoid ?? [],
        candidates: filteredPool,
      });

      filteredPool = rel.kept;
    }

    // 5) Final rerank: AI picks ONLY from verified pool by id.
    const hasCandidatePool = filteredPool.length > 0;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.65,
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
      "reason": "Two or three sentences explaining fit and audience."
    }
  ]
}

Rules:
- Recommend 3 to 5 games. It's OK to return fewer than 5 if the pool is weak.
- You MUST pick ONLY ids from the provided candidate pool. Do not invent titles. Do not output titles.
- Match must be a number from 0 to 100.
- Each "reason" must be 2–3 concise sentences in plain English (no markdown, no bullet symbols).
- In those sentences: (1) why this pick fits the user's stated request and intent, (2) what kind of player or playstyle it suits best.
- Be specific to this title (avoid generic praise).
- Prefer games available on the selected platform when relevant.
- Consider the budget in spirit, but never invent or quote dollar amounts inside "reason".
- Do not include markdown.
- Do not include extra text.
`,
        },
        {
          role: "user",
          content: `
User request: ${normalizedInput.userPrompt || "not specified"}
Normalized intent: ${intent.normalizedIntent || "not specified"}
Core needs: ${intent.coreNeeds?.length ? intent.coreNeeds.join(", ") : "none"}
Avoid: ${intent.avoid?.length ? intent.avoid.join(", ") : "none"}

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

Maximum budget:
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

        const matchRaw =
          typeof g.match === "number"
            ? g.match
            : typeof g.match === "string"
              ? Number(g.match)
              : 0;
        const match = clamp(Number.isFinite(matchRaw) ? matchRaw : 0, 0, 100);
        const reason = typeof g.reason === "string" ? g.reason : "";

        return {
          id: c.id,
          title: c.name,
          slug: c.slug ?? null,
          image: c.background_image ?? null,
          match,
          reason,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .slice(0, 5);

    // 6) CheapShark enrichment: keep RAWG metadata/image; only add price + buyLink.
    const enrichedGames = await Promise.all(
      pickedVerified.map(async (game) => {
        try {
          const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
            game.title
          )}&limit=1`;
          const res = await fetch(url);
          const data = (await res.json()) as unknown;

          if (
            Array.isArray(data) &&
            data.length > 0 &&
            data[0] &&
            typeof data[0] === "object"
          ) {
            const row = data[0] as Record<string, unknown>;
            const cheapestDealID =
              typeof row.cheapestDealID === "string" ? row.cheapestDealID : null;
            return {
              ...game,
              price: typeof row.cheapest === "string" ? row.cheapest : "N/A",
              buyLink: cheapestDealID
                ? `https://www.cheapshark.com/redirect?dealID=${cheapestDealID}`
                : null,
            };
          }

          return { ...game, price: "N/A", buyLink: null };
        } catch {
          return { ...game, price: "N/A", buyLink: null };
        }
      })
    );

    // Budget: do not drop highly relevant games just because price is missing.
    const maxBudget = normalizedInput.budget ? Number(normalizedInput.budget) : null;
    let finalGames = enrichedGames;
    if (maxBudget) {
      const underBudget = enrichedGames.filter((game) => {
        if (typeof game.price !== "string" || game.price === "N/A") return false;
        return Number(game.price) <= maxBudget;
      });
      finalGames = underBudget.length >= 3 ? underBudget : enrichedGames;
    }

    const payload = {
      games: finalGames.slice(0, 5),
      usage: {
        intent: aiDiscovery.usage,
        rerank: response.usage,
      },
    };

    // Best-effort cache: do not block response on failures.
    try {
      await setCachedAiRecommendation({
        inputHash,
        inputNormalized: cacheKeyInput,
        responseJson: payload,
      });
    } catch {}

    return NextResponse.json(payload);
  } catch (error) {
    console.error("OpenAI error:", error);
    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}