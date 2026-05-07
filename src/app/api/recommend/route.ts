import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getCachedAiRecommendation,
  hashNormalizedInput,
  setCachedAiRecommendation,
} from "@/lib/cache";
import {
  dedupeCandidates,
  fetchRawgCandidates,
  scoreCandidates,
  selectDiverseTop,
  type RawgCandidate,
} from "@/lib/rawg-discovery";

type IntentBundle = {
  normalizedIntent: string;
  coreKeywords: string[];
  discoveryQueries: string[];
  negativeKeywords: string[];
  preferredGenresOrTags: string[];
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

function normalizeIntentFallback(input: {
  userPrompt: string;
  genres: string;
  playStyles: string;
  vibes: string;
  mechanics: string;
  platform: string;
}) {
  const joined = [
    input.userPrompt,
    input.genres,
    input.playStyles,
    input.vibes,
    input.mechanics,
    input.platform,
  ]
    .filter(Boolean)
    .join(" | ")
    .trim();

  const normalizedIntent = joined || "video game recommendation";
  return {
    normalizedIntent,
    coreKeywords: [],
    discoveryQueries: [input.userPrompt || normalizedIntent].filter(Boolean).slice(0, 4),
    negativeKeywords: [],
    preferredGenresOrTags: [],
  } satisfies IntentBundle;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userPrompt,
      genres,
      playStyles,
      vibes,
      mechanics,
      platform,
      budget,
    } = body;

    // Normalize raw input.
    const normalizedInput = {
      userPrompt: typeof userPrompt === "string" ? userPrompt.trim() : "",
      genres: typeof genres === "string" ? genres.trim() : "",
      playStyles: typeof playStyles === "string" ? playStyles.trim() : "",
      vibes: typeof vibes === "string" ? vibes.trim() : "",
      mechanics: typeof mechanics === "string" ? mechanics.trim() : "",
      platform: typeof platform === "string" ? platform.trim() : "",
      budget: typeof budget === "string" ? budget.trim() : String(budget ?? "").trim(),
    };

    // 0) Dynamic query expansion: ask OpenAI for intent + discovery queries.
    const intentResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Return ONLY valid JSON in this exact format:
{
  "normalizedIntent": "short normalized intent",
  "coreKeywords": ["..."],
  "discoveryQueries": ["..."],
  "negativeKeywords": ["..."],
  "preferredGenresOrTags": ["..."]
}

Rules:
- Keep normalizedIntent short.
- discoveryQueries: 4-8 short queries, no quotes, no markdown.
- coreKeywords: 3-8 keywords that capture the core subject.
- preferredGenresOrTags: 0-6 high-level tags/genres.
- negativeKeywords: 0-8 terms to avoid.
- Use the user's language (it/en) and include English terms when helpful for discovery.
`,
        },
        {
          role: "user",
          content: `
User request: ${normalizedInput.userPrompt || "not specified"}
Genres: ${normalizedInput.genres || "not specified"}
Play styles: ${normalizedInput.playStyles || "not specified"}
Vibes: ${normalizedInput.vibes || "not specified"}
Mechanics: ${normalizedInput.mechanics || "not specified"}
Platform: ${normalizedInput.platform || "not specified"}
Budget: ${normalizedInput.budget || "not specified"}
`,
        },
      ],
      temperature: 0.4,
    });

    const intentText =
      intentResponse.choices[0].message.content ||
      '{"normalizedIntent":"","coreKeywords":[],"discoveryQueries":[],"negativeKeywords":[],"preferredGenresOrTags":[]}';
    const parsedIntent = safeParseJson<IntentBundle>(intentText);
    const intent =
      parsedIntent && parsedIntent.normalizedIntent
        ? parsedIntent
        : normalizeIntentFallback({
            userPrompt: normalizedInput.userPrompt,
            genres: normalizedInput.genres,
            playStyles: normalizedInput.playStyles,
            vibes: normalizedInput.vibes,
            mechanics: normalizedInput.mechanics,
            platform: normalizedInput.platform,
          });

    // Cache key must include intent/discoveryQueries so different requests don't collide.
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

    // 1) Fetch a wider RAWG candidate pool via discoveryQueries.
    const rawgKey = process.env.RAWG_API_KEY || "";
    let candidatePool: RawgCandidate[] = [];

    if (rawgKey && Array.isArray(intent.discoveryQueries) && intent.discoveryQueries.length > 0) {
      const fetched = await fetchRawgCandidates({
        rawgApiKey: rawgKey,
        discoveryQueries: intent.discoveryQueries,
        pageSize: 20,
      });

      const deduped = dedupeCandidates(fetched);
      const scored = scoreCandidates(intent, deduped);
      const diverse = selectDiverseTop([...scored], 60);
      candidatePool = diverse.map((s) => s.candidate);
    }

    // 2) Use OpenAI only for final reranking/explanations from the candidate pool.
    const hasCandidatePool = candidatePool.length > 0;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
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
      "title": "Game name",
      "match": 95,
      "reason": "Short reason why this game matches the user.",
      "price": "unknown"
    }
  ]
}

Rules:
- Recommend exactly 10 games.
- Match must be a number from 0 to 100.
- Reason must be short, specific and personal.
- If a candidate pool is provided, you MUST pick games from that list and must not invent titles.
- Prioritize truly intent-matching games (including indie/niche), not only famous titles.
- Penalize games that match negativeKeywords.
- Avoid generic matches (e.g. only "simulator" without the core subject).
- Prefer games available on the selected platform.
- Consider the budget, but do not invent prices.
- Do not include markdown.
- Do not include extra text.
`,
        },
        {
          role: "user",
          content: `
User free-text request: ${normalizedInput.userPrompt || "not specified"}
Normalized intent: ${intent.normalizedIntent || "not specified"}
Core keywords: ${intent.coreKeywords?.length ? intent.coreKeywords.join(", ") : "none"}
Preferred genres/tags: ${intent.preferredGenresOrTags?.length ? intent.preferredGenresOrTags.join(", ") : "none"}
Negative keywords: ${intent.negativeKeywords?.length ? intent.negativeKeywords.join(", ") : "none"}

Genres:
${genres || "not specified"}

Play styles:
${playStyles || "not specified"}

Vibes:
${vibes || "not specified"}

Mechanics:
${mechanics || "not specified"}

Platform:
${platform || "not specified"}

Maximum budget:
${budget || "not specified"}

${hasCandidatePool ? `Candidate pool (pick from this list only):\n${JSON.stringify(
    candidatePool.map((c) => ({
      id: c.id,
      title: c.name,
      slug: c.slug ?? null,
      genres: (c.genres ?? []).map((g) => g.name),
      tags: (c.tags ?? []).map((t) => t.name).slice(0, 12),
    })),
    null,
    0
  )}` : "Candidate pool: none (recommend based on intent)"}
`,
        },
      ],
      temperature: 0.75,
    });

    const text = response.choices[0].message.content || '{"games":[]}';
    const parsed = safeParseJson<{ games?: unknown }>(text) || { games: [] };
    const games = Array.isArray(parsed.games) ? (parsed.games as Array<Record<string, unknown>>) : [];

    const enrichedGames = await Promise.all(
      games.map(async (game: Record<string, unknown>) => {
        try {
          const title = typeof game.title === "string" ? game.title : "";
          if (!title) {
            return {
              ...game,
              price: "N/A",
              image: null,
              buyLink: null,
            };
          }

          const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
            title
          )}&limit=1`;

          const res = await fetch(url);
          const data = (await res.json()) as unknown;

          if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === "object") {
            const row = data[0] as Record<string, unknown>;
            const cheapestDealID =
              typeof row.cheapestDealID === "string" ? row.cheapestDealID : null;
            return {
              ...game,
              price: typeof row.cheapest === "string" ? row.cheapest : "N/A",
              image: typeof row.thumb === "string" ? row.thumb : null,
              buyLink: cheapestDealID
                ? `https://www.cheapshark.com/redirect?dealID=${cheapestDealID}`
                : null,
            };
          }

          return {
            ...game,
            price: "N/A",
            image: null,
            buyLink: null,
          };
        } catch {
          return {
            ...game,
            price: "N/A",
            image: null,
            buyLink: null,
          };
        }
      })
    );

    const maxBudget = budget ? Number(budget) : null;

    let finalGames = enrichedGames;

    if (maxBudget) {
      const underBudget = enrichedGames.filter((game) => {
        const price = (game as { price?: unknown }).price;
        if (typeof price !== "string" || price === "N/A") return false;
        return Number(price) <= maxBudget;
      });

      finalGames = underBudget.length >= 3 ? underBudget : enrichedGames;
    }

    const payload = {
      games: finalGames.slice(0, 5),
      usage: {
        intent: intentResponse.usage,
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

    return NextResponse.json(
      { error: "AI failed" },
      { status: 500 }
    );
  }
}