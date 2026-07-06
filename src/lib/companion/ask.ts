/**
 * Shared Companion Q&A logic (free-text question → plain-text answer).
 *
 * Used by both the desktop-facing endpoint (`POST /api/companion/ask`, Bearer
 * auth) and the admin web route's desktop branch (`POST /api/admin/companion`).
 * Server-side only — the OpenAI key never leaves this process. No DB writes, no
 * quotas, no billing.
 */
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 30_000;

/** Max characters accepted for a question (keeps prompt/cost bounded). */
export const MAX_QUESTION_LEN = 2000;

/** Build an OpenAI client from the server-side key, or null if unconfigured. */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

/** Shared Companion persona. The text-mode SYSTEM_PROMPT string is unchanged. */
const PERSONA_LINES = [
  "You are GamePing Companion, an AI buddy that helps a player while they are gaming.",
  "You can help with spoiler-light hints, boss tips, build suggestions, mechanics explanations, progression advice, and what to try next.",
  "Talk like a knowledgeable gamer friend: warm, concise, and practical — not a wiki wall of text.",
  "You cannot see the player's screen or know their live game state — never pretend to. If it matters, answer generally or ask them to describe what they see.",
  "If you are unsure or a detail may be version/patch/platform-specific, say so plainly rather than inventing certainty.",
] as const;

const SYSTEM_PROMPT = [
  ...PERSONA_LINES,
  "Answer in clear plain text (no JSON, no markdown headers).",
].join("\n");

/**
 * Media-mode prompt: same persona, but the model also proposes a short search
 * query used server-side to find ONE relevant video/image, and replies as
 * strict JSON (enforced with response_format json_object).
 */
function mediaSystemPrompt(mediaType: "video" | "image"): string {
  return [
    ...PERSONA_LINES,
    "Keep the answer short: two to four sentences with the most useful, practical help.",
    mediaType === "video"
      ? "Also write a short YouTube search query (3-8 words) that would find one genuinely helpful video for this question. Include the game name if you can infer it."
      : 'Also write a short wiki search query (2-6 words, e.g. the location/item/boss name) that would find one genuinely helpful image — a map, location, item, or chart — for this question. If you know the game, also provide the hostname of its Fandom wiki (e.g. "fallout.fandom.com"); otherwise use an empty string.',
    mediaType === "video"
      ? 'Respond with ONLY a JSON object: {"answer": "...", "searchQuery": "..."}'
      : 'Respond with ONLY a JSON object: {"answer": "...", "searchQuery": "...", "wikiHost": "..."}',
  ].join("\n");
}

export type CompanionAskResult =
  | { ok: true; answer: string }
  | { ok: false; status: 400 | 500; error: string };

/**
 * Answer a free-text companion question via OpenAI.
 *
 * Returns a discriminated result rather than throwing, so callers can map the
 * `status` straight onto an HTTP response. Auth is the caller's responsibility.
 */
export async function askCompanion(
  question: unknown
): Promise<CompanionAskResult> {
  const trimmed = typeof question === "string" ? question.trim() : "";
  if (!trimmed) {
    return { ok: false, status: 400, error: "A question is required." };
  }

  const client = getOpenAIClient();
  if (!client) {
    return { ok: false, status: 500, error: "OPENAI_API_KEY is not configured." };
  }

  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed.slice(0, MAX_QUESTION_LEN) },
        ],
      },
      { timeout: TIMEOUT_MS }
    );
    const answer = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!answer) {
      return { ok: false, status: 500, error: "Empty response from the companion." };
    }
    return { ok: true, answer };
  } catch (err) {
    console.warn("[companion:ask] OpenAI call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      status: 500,
      error: "The companion could not answer right now.",
    };
  }
}

export type CompanionMediaAskResult =
  | {
      ok: true;
      answer: string;
      searchQuery: string;
      /** Model-suggested Fandom wiki host (image mode) — validated by the media lookup, never fetched blindly. */
      wikiHost?: string;
    }
  | { ok: false; status: 400 | 500; error: string };

/**
 * Media-mode ask: one OpenAI call that returns both a short answer and a
 * search query for the media lookup. Falls back to the raw question as the
 * search query if the model omits one, so callers always get something usable.
 * Text-mode behavior (`askCompanion`) is untouched.
 */
export async function askCompanionForMedia(
  question: unknown,
  mediaType: "video" | "image"
): Promise<CompanionMediaAskResult> {
  const trimmed = typeof question === "string" ? question.trim() : "";
  if (!trimmed) {
    return { ok: false, status: 400, error: "A question is required." };
  }

  const client = getOpenAIClient();
  if (!client) {
    return { ok: false, status: 500, error: "OPENAI_API_KEY is not configured." };
  }

  const bounded = trimmed.slice(0, MAX_QUESTION_LEN);
  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: mediaSystemPrompt(mediaType) },
          { role: "user", content: bounded },
        ],
      },
      { timeout: TIMEOUT_MS }
    );
    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!content) {
      return { ok: false, status: 500, error: "Empty response from the companion." };
    }

    let answer = "";
    let searchQuery = "";
    let wikiHost: string | undefined;
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      if (typeof parsed.answer === "string") answer = parsed.answer.trim();
      if (typeof parsed.searchQuery === "string") searchQuery = parsed.searchQuery.trim();
      if (typeof parsed.wikiHost === "string" && parsed.wikiHost.trim()) {
        wikiHost = parsed.wikiHost.trim().toLowerCase();
      }
    } catch {
      // json_object mode makes this near-impossible; treat content as the answer.
      answer = content;
    }
    if (!answer) {
      return { ok: false, status: 500, error: "Empty response from the companion." };
    }
    return { ok: true, answer, searchQuery: searchQuery || bounded, wikiHost };
  } catch (err) {
    console.warn("[companion:ask] OpenAI media call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      status: 500,
      error: "The companion could not answer right now.",
    };
  }
}
