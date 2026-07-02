/**
 * GamePing Companion — EXPERIMENTAL, ADMIN-ONLY (Alpha).
 *
 *   GET  /api/admin/companion?q=<title>   → RAWG title search (game picker)
 *   POST /api/admin/companion             → AI companion answer
 *     Web UI shape:
 *       { "gameTitle": string, "question": string, "mode": "hint" | "guide" | "full" }
 *       → { ok, mode, gameTitle, answer: CompanionAnswer }
 *     Desktop Companion MVP shape (context.source === "desktop_companion"):
 *       { "question": string, "context": { "source": "desktop_companion" } }
 *       → { ok: true, answer: string }
 *
 * An AI companion that helps while you play a game. Stateless — no DB writes, no
 * billing, no premium. Admin session only (profiles.plan = 'admin'); there is no
 * anonymous/public path. The OpenAI key stays server-side. Mirrors the existing
 * admin route + OpenAI + RAWG patterns. Does NOT touch /api/recommend, Stripe,
 * premium, discovery, or any user quota.
 */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { searchRawgByTitle } from "@/lib/rawg-discovery";
import { askCompanion } from "@/lib/companion/ask";
import type { CompanionAnswer, CompanionMode } from "@/lib/companion/types";

export const dynamic = "force-dynamic";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 30_000;

/** Admin session check — same `profiles.plan === "admin"` pattern used across the app. */
async function hasAdminSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();
    return profile?.plan === "admin";
  } catch {
    return false;
  }
}

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function normalizeMode(value: unknown): CompanionMode {
  return value === "hint" || value === "guide" || value === "full"
    ? value
    : "guide";
}

const MODE_GUIDANCE: Record<CompanionMode, string> = {
  hint:
    "HINT MODE: Avoid spoilers. Give gentle nudges and direction only — never reveal exact solutions, endings, plot twists, or precise locations. Point the player in the right direction so they can discover it themselves.",
  guide:
    "GUIDE MODE: Explain clearly what to do next. Minor spoilers are allowed (e.g. naming an area, item, or boss), but avoid major story spoilers and endings unless strictly necessary.",
  full:
    "FULL SOLUTION MODE: Give the complete answer — exact locations, step-by-step instructions, and all relevant details. Spoilers are fine; the player explicitly asked for everything.",
};

function buildSystemPrompt(mode: CompanionMode): string {
  return [
    "You are GamePing Companion, an AI buddy that helps a player WHILE they are playing a video game.",
    "Talk like a knowledgeable gamer friend sitting next to them: warm, concise, and practical. NOT a wiki wall of text.",
    MODE_GUIDANCE[mode],
    "",
    "CRITICAL — honesty about certainty:",
    "- Do NOT invent fake certainty. Games differ by version, patch, DLC, platform, and difficulty.",
    "- If you are not sure, or the detail may be outdated/version-specific, set \"uncertain\" to true and explain what to double-check in \"uncertaintyNote\".",
    "- Never fabricate specific item names, NPC names, or coordinates you are not confident about.",
    "",
    "Respond ONLY with a JSON object of this exact shape:",
    "{",
    '  "shortAnswer": string,            // 1-3 sentence direct answer',
    '  "nextSteps": string[],            // recommended next steps, ordered, short',
    '  "dontMiss": string[],             // things not to miss here (can be empty)',
    '  "warnings": string[],             // pitfalls / point-of-no-return / missable warnings (can be empty)',
    '  "extraTips": string[],            // optional extra tips (can be empty)',
    '  "uncertain": boolean,             // true if any of the above may need verification',
    '  "uncertaintyNote": string         // when uncertain, what to verify; otherwise empty string',
    "}",
    "Keep every array item to a single concise line. Honor the spoiler mode strictly.",
  ].join("\n");
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0)
    .slice(0, 8);
}

/**
 * Desktop Companion branch (legacy path — kept working for parity).
 *
 * Simple free-text Q&A: takes a question, returns a plain-text answer string
 * with proper HTTP status codes (400 / 500). Shares the OpenAI logic with the
 * real `POST /api/companion/ask` endpoint. Admin auth is verified by the caller.
 */
async function handleDesktopCompanion(
  record: Record<string, unknown>
): Promise<NextResponse> {
  const result = await askCompanion(record.question);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true, answer: result.answer });
}

export async function GET(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) {
    // RAWG optional for Alpha — UI falls back to free-text game entry.
    return NextResponse.json({ ok: true, results: [], rawgConfigured: false });
  }

  const candidates = await searchRawgByTitle({
    rawgApiKey,
    title: q,
    pageSize: 6,
  }).catch(() => []);

  const results = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    released: c.released ?? null,
    image: c.background_image ?? null,
  }));

  return NextResponse.json({ ok: true, results, rawgConfigured: true });
}

export async function POST(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const record = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;

  // Desktop Companion MVP: simple { question } → { ok, answer: string }.
  const context =
    record.context && typeof record.context === "object"
      ? (record.context as Record<string, unknown>)
      : {};
  if (context.source === "desktop_companion") {
    return handleDesktopCompanion(record);
  }

  const gameTitle =
    typeof record.gameTitle === "string" ? record.gameTitle.trim() : "";
  const question =
    typeof record.question === "string" ? record.question.trim() : "";
  const mode = normalizeMode(record.mode);

  if (!gameTitle || !question) {
    return NextResponse.json(
      { ok: false, error: "Both gameTitle and question are required." },
      { status: 400 }
    );
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY is not configured." },
      { status: 200 }
    );
  }

  const system = buildSystemPrompt(mode);
  const user = [
    `Game: ${gameTitle}`,
    `Spoiler mode: ${mode}`,
    `Player question: ${question}`,
  ].join("\n");

  let parsed: Record<string, unknown> | null = null;
  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { timeout: TIMEOUT_MS }
    );
    const raw = completion.choices[0]?.message?.content?.trim();
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch (err) {
    console.warn("[admin:companion] call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        ok: false,
        error: "The companion could not answer right now. Try again.",
      },
      { status: 200 }
    );
  }

  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "Empty response from the companion." },
      { status: 200 }
    );
  }

  const uncertaintyNote =
    typeof parsed.uncertaintyNote === "string"
      ? parsed.uncertaintyNote.trim()
      : "";

  const answer: CompanionAnswer = {
    shortAnswer:
      typeof parsed.shortAnswer === "string" ? parsed.shortAnswer.trim() : "",
    nextSteps: asStringArray(parsed.nextSteps),
    dontMiss: asStringArray(parsed.dontMiss),
    warnings: asStringArray(parsed.warnings),
    extraTips: asStringArray(parsed.extraTips),
    uncertain: parsed.uncertain === true,
    uncertaintyNote: uncertaintyNote || undefined,
  };

  return NextResponse.json({ ok: true, mode, gameTitle, answer });
}
