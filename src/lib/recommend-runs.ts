import "server-only";

import { createClient } from "@supabase/supabase-js";
import { PROMPT_MAX_DEFAULT } from "@/lib/recommend-limits";

const MAX_PROMPT_CHARS = PROMPT_MAX_DEFAULT;
const MAX_TITLES = 20;
const MAX_TITLE_CHARS = 200;

export type LogRecommendRunInput = {
  promptText: string;
  latencyMs?: number | null;
  resultsCount?: number | null;
  resultTitles?: string[] | null;
  success: boolean;
  errorCode?: string | null;
};

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function clampPrompt(text: string): string {
  const t = text.trim();
  if (!t) return "(empty)";
  return t.length > MAX_PROMPT_CHARS ? t.slice(0, MAX_PROMPT_CHARS) : t;
}

function normalizeTitles(titles: string[] | null | undefined): string[] {
  if (!titles?.length) return [];
  const out: string[] = [];
  for (const raw of titles) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (!t) continue;
    out.push(t.length > MAX_TITLE_CHARS ? t.slice(0, MAX_TITLE_CHARS) : t);
    if (out.length >= MAX_TITLES) break;
  }
  return out;
}

function normalizeLatencyMs(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 0) return null;
  return n;
}

function normalizeResultsCount(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 0) return null;
  return n;
}

export function extractRecommendResultTitles(
  games: unknown[] | null | undefined
): string[] {
  if (!Array.isArray(games)) return [];
  const out: string[] = [];
  for (const game of games) {
    if (!game || typeof game !== "object") continue;
    const title = (game as { title?: unknown }).title;
    if (typeof title !== "string") continue;
    const t = title.trim();
    if (!t) continue;
    out.push(t);
    if (out.length >= MAX_TITLES) break;
  }
  return normalizeTitles(out);
}

/** Best-effort insert; never throws. */
export async function logRecommendRun(input: LogRecommendRunInput): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      console.warn("[recommend-runs] missing Supabase service credentials");
      return;
    }

    const resultTitles = normalizeTitles(input.resultTitles);
    const resultsCount =
      normalizeResultsCount(input.resultsCount) ??
      (input.success ? resultTitles.length : 0);

    const { error } = await supabase.from("recommend_runs").insert({
      prompt_text: clampPrompt(input.promptText),
      latency_ms: normalizeLatencyMs(input.latencyMs),
      results_count: resultsCount,
      result_titles: resultTitles,
      success: input.success,
      error_code: input.errorCode?.trim().slice(0, 64) || null,
    });

    if (error) {
      console.warn("[recommend-runs] insert failed", error.message);
    }
  } catch (err) {
    console.warn("[recommend-runs] log error", err);
  }
}
