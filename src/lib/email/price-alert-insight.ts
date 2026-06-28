import "server-only";

import OpenAI from "openai";

/**
 * Optional "Why GamePing thinks this matters" line for price-alert emails.
 *
 * Hard rules (the email must always send regardless of this function):
 * - Returns null on any failure: no key, no taste signal, timeout, bad output.
 * - Strict timeout so a slow model never delays delivery.
 * - The HTML template stays deterministic; this only fills one short slot.
 */

const INSIGHT_TIMEOUT_MS = 6000;
const INSIGHT_MAX_CHARS = 360;

export type PriceAlertTasteSignal = {
  archetype?: string | null;
  summary?: string | null;
  likes?: string[];
  favoriteGames?: string[];
  preferredGenres?: string[];
};

export type PriceAlertInsightInput = {
  gameTitle: string;
  /** "significant_drop" | "target_met" | other reason strings. */
  alertReason?: string;
  taste: PriceAlertTasteSignal;
};

function cleanList(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (t) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** True only when there is at least one real taste signal to ground the copy. */
export function hasUsableTasteSignal(taste: PriceAlertTasteSignal): boolean {
  return Boolean(
    (taste.archetype && taste.archetype.trim()) ||
      (taste.summary && taste.summary.trim()) ||
      cleanList(taste.likes, 1).length ||
      cleanList(taste.favoriteGames, 1).length ||
      cleanList(taste.preferredGenres, 1).length
  );
}

function sanitizeInsight(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let text = raw.trim();
  if (!text) return null;
  // Strip stray quotes/markdown the model might add.
  text = text.replace(/^["'`]+|["'`]+$/g, "").trim();
  if (!text) return null;
  if (text.length > INSIGHT_MAX_CHARS) {
    text = text.slice(0, INSIGHT_MAX_CHARS).trim();
  }
  return text;
}

/**
 * Generates 1-3 grounded sentences. Returns null whenever anything is off so
 * the caller can simply omit the section.
 */
export async function generatePriceAlertInsight(
  input: PriceAlertInsightInput
): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;

    const title = input.gameTitle.trim();
    if (!title) return null;
    if (!hasUsableTasteSignal(input.taste)) return null;

    const tastePayload = {
      archetype: input.taste.archetype?.trim() || null,
      summary: input.taste.summary?.trim() || null,
      likes: cleanList(input.taste.likes, 8),
      favoriteGames: cleanList(input.taste.favoriteGames, 8),
      preferredGenres: cleanList(input.taste.preferredGenres, 8),
    };

    const cheaperContext =
      input.alertReason === "target_met"
        ? "It just reached the price the user was waiting for."
        : "It is now cheaper than usual.";

    const openai = new OpenAI({ apiKey, timeout: INSIGHT_TIMEOUT_MS, maxRetries: 0 });

    const response = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 160,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You write a short, warm note for a game price-alert email explaining why a specific game fits the recipient's taste.
Return ONLY valid JSON: { "insight": "string" }

Rules:
- 1 to 3 sentences, max ~50 words total.
- Ground every claim ONLY in the provided taste signals. Never invent games, genres, or playtime not present in the input.
- Connect the discounted game to the user's taste, then note this is a good moment to grab it because it is cheaper.
- Natural English, second person ("you"). No markdown, no emojis, no quotes around the text.
- If you cannot make an honest, grounded connection, return { "insight": "" }.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              game: title,
              priceContext: cheaperContext,
              taste: tastePayload,
            }),
          },
        ],
      },
      { timeout: INSIGHT_TIMEOUT_MS }
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { insight?: unknown };
    return sanitizeInsight(parsed.insight);
  } catch (err) {
    console.warn(
      "[price-alert-insight] skipped",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}
