import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getCachedAiRecommendation,
  hashNormalizedInput,
  setCachedAiRecommendation,
} from "@/lib/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

    const normalizedInput = {
      userPrompt: typeof userPrompt === "string" ? userPrompt.trim() : "",
      genres: typeof genres === "string" ? genres.trim() : "",
      playStyles: typeof playStyles === "string" ? playStyles.trim() : "",
      vibes: typeof vibes === "string" ? vibes.trim() : "",
      mechanics: typeof mechanics === "string" ? mechanics.trim() : "",
      platform: typeof platform === "string" ? platform.trim() : "",
      budget: typeof budget === "string" ? budget.trim() : String(budget ?? "").trim(),
    };

    const inputHash = hashNormalizedInput(normalizedInput);
    const cached = await getCachedAiRecommendation<{
      games: any[];
      usage?: any;
    }>(inputHash);

    if (cached) {
      return NextResponse.json(cached);
    }

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
- Prioritize the user's free-text request if provided.
- Use selected tags to understand taste, not as rigid filters.
- Prefer games available on the selected platform.
- Consider the budget, but do not invent prices.
- Do not include markdown.
- Do not include extra text.
`,
        },
        {
          role: "user",
          content: `
User free-text request:
${userPrompt || "not specified"}

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
`,
        },
      ],
      temperature: 0.75,
    });

    const text = response.choices[0].message.content || '{"games":[]}';
    const parsed = JSON.parse(text);
    const games = parsed.games || [];

    const enrichedGames = await Promise.all(
      games.map(async (game: any) => {
        try {
          const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
            game.title
          )}&limit=1`;

          const res = await fetch(url);
          const data = await res.json();

          if (data && data.length > 0) {
            return {
              ...game,
              price: data[0].cheapest,
              image: data[0].thumb || null,
              buyLink: data[0].cheapestDealID
                ? `https://www.cheapshark.com/redirect?dealID=${data[0].cheapestDealID}`
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
      const underBudget = enrichedGames.filter((game: any) => {
        if (!game.price || game.price === "N/A") return false;
        return Number(game.price) <= maxBudget;
      });

      finalGames = underBudget.length >= 3 ? underBudget : enrichedGames;
    }

    const payload = {
      games: finalGames.slice(0, 5),
      usage: response.usage,
    };

    // Best-effort cache: do not block response on failures.
    try {
      await setCachedAiRecommendation({
        inputHash,
        inputNormalized: normalizedInput,
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