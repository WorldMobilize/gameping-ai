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
function mediaSystemPrompt(mediaType: "video" | "image" | "music"): string {
  if (mediaType === "video") {
    return [
      ...PERSONA_LINES,
      "Keep the answer short: two to four sentences with the most useful, practical help.",
      "Also write a short YouTube search query (3-8 words) that would find one genuinely helpful video for this question. Include the game name if you can infer it.",
      'Respond with ONLY a JSON object: {"answer": "...", "searchQuery": "..."}',
    ].join("\n");
  }
  if (mediaType === "music") {
    return [
      ...PERSONA_LINES,
      "The player wants to listen to music from a game — a specific track, theme, or the soundtrack.",
      "Keep the answer short: one to three sentences naming the track/soundtrack and any useful context.",
      "Also write a short YouTube search query (3-8 words) that finds that specific song or an official soundtrack track. Include the game name and the track/theme name if you can infer them; add \"soundtrack\" or \"OST\" when no single track is named.",
      'Respond with ONLY a JSON object: {"answer": "...", "searchQuery": "..."}',
    ].join("\n");
  }
  return [
    ...PERSONA_LINES,
    "Keep the answer short: two to four sentences with the most useful, practical help.",
    "Also produce fields that help find ONE genuinely relevant image:",
    '- mediaIntent: "map_location" when the user is asking WHERE something is, where to find it, or to show it on a map; otherwise "generic_image".',
    '- subject: the SPECIFIC thing the user asks about — the exact item / location / boss / mechanic, ideally the exact wiki page title (e.g. "Stone Axe", "Sanctuary Hills", "Margit the Fell Omen"). For "how do I make / craft X" questions the subject is the item X itself. NEVER the game name alone.',
    '- searchQuery: a short wiki search (2-5 words) for that subject. For map_location, make it find the GAME\'S MAP (e.g. "Fallout 4 map"). Otherwise the specific item/location/boss — same rule, NEVER just the game name (use "stone axe", not "Minecraft").',
    '- wikiHost: the hostname of the game\'s Fandom wiki (e.g. "minecraft.fandom.com", "fallout.fandom.com", "eldenring.fandom.com") if you can identify the game; otherwise "".',
    '- game: the game or franchise name if identifiable (e.g. "Minecraft", "Fallout 4"); otherwise "".',
    '- mapLabel: for map_location, the exact place name to highlight (e.g. "Sanctuary Hills"); otherwise "".',
    "Do not guess pixel coordinates for anything.",
    'Respond with ONLY a JSON object: {"answer": "...", "searchQuery": "...", "wikiHost": "...", "mediaIntent": "...", "subject": "...", "game": "...", "mapLabel": "..."}',
  ].join("\n");
}

/**
 * Fast, language-aware heuristic for "where is X / show it on the map" intent
 * (English + Italian, per product spec). Used alongside the model's own
 * `mediaIntent` classification — either signal is enough to prefer a map.
 */
const LOCATION_INTENT_PATTERNS: RegExp[] = [
  /\bwhere\s+(is|are|can\s+i\s+find|to\s+find|do\s+i\s+find)\b/i,
  /\blocation\s+of\b/i,
  /\bon\s+the\s+map\b/i,
  /\bmap\s+of\b/i,
  /\bdove\s+si\s+trova(no)?\b/i,
  /\bdove\s+(posso\s+)?trovare\b/i,
  /\bdov'?\s?è\b/i,
  /\bsulla\s+mappa\b/i,
  /\bmappa\s+di\b/i,
];

export function detectLocationIntent(message: unknown): boolean {
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return false;
  return LOCATION_INTENT_PATTERNS.some((re) => re.test(text));
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

export type CompanionMediaIntent = "generic_image" | "map_location";

export type CompanionMediaAskResult =
  | {
      ok: true;
      answer: string;
      searchQuery: string;
      /** Model-suggested Fandom wiki host (image mode) — validated by the media lookup, never fetched blindly. */
      wikiHost?: string;
      /** Image mode only — how the model classified the media need. */
      mediaIntent?: CompanionMediaIntent;
      /** Image mode only — the main subject asked about. */
      subject?: string;
      /** Image mode only — the identified game/franchise, if any. */
      game?: string;
      /** Image mode only — the exact place name to highlight on a map. */
      mapLabel?: string;
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
  mediaType: "video" | "image" | "music"
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
    let mediaIntent: CompanionMediaIntent | undefined;
    let subject: string | undefined;
    let game: string | undefined;
    let mapLabel: string | undefined;
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      if (typeof parsed.answer === "string") answer = parsed.answer.trim();
      if (typeof parsed.searchQuery === "string") searchQuery = parsed.searchQuery.trim();
      if (typeof parsed.wikiHost === "string" && parsed.wikiHost.trim()) {
        wikiHost = parsed.wikiHost.trim().toLowerCase();
      }
      // Extra image-mode fields (ignored for video). All optional.
      if (mediaType === "image") {
        if (parsed.mediaIntent === "map_location" || parsed.mediaIntent === "generic_image") {
          mediaIntent = parsed.mediaIntent;
        }
        if (typeof parsed.subject === "string" && parsed.subject.trim()) {
          subject = parsed.subject.trim();
        }
        if (typeof parsed.game === "string" && parsed.game.trim()) {
          game = parsed.game.trim();
        }
        if (typeof parsed.mapLabel === "string" && parsed.mapLabel.trim()) {
          mapLabel = parsed.mapLabel.trim();
        }
      }
    } catch {
      // json_object mode makes this near-impossible; treat content as the answer.
      answer = content;
    }
    if (!answer) {
      return { ok: false, status: 500, error: "Empty response from the companion." };
    }
    return {
      ok: true,
      answer,
      searchQuery: searchQuery || bounded,
      wikiHost,
      mediaIntent,
      subject,
      game,
      mapLabel,
    };
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
