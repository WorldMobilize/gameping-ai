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

const SYSTEM_PROMPT = [
  "You are GamePing Companion, an AI buddy that helps a player while they are gaming.",
  "Talk like a knowledgeable gamer friend: warm, concise, and practical — not a wiki wall of text.",
  "If you are unsure or a detail may be version/patch/platform-specific, say so plainly rather than inventing certainty.",
  "Answer in clear plain text (no JSON, no markdown headers).",
].join("\n");

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
