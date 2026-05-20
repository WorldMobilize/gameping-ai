import type { RecommendInputFields } from "@/lib/recommend-input";

/** Bump when persisted shape changes so old session blobs are ignored. */
export const RECOMMEND_SESSION_STORAGE_VERSION = 1 as const;

const STORAGE_KEY = `gameping:recommend-session:v${RECOMMEND_SESSION_STORAGE_VERSION}`;

export type RecommendSessionGame = {
  title: string;
  match: number;
  reason: string;
  price?: string | null;
  currency?: string | null;
  buyLink?: string | null;
  image?: string | null;
  matchTier?: "best_match" | "good_alternative" | "partial_match";
  matchNote?: string;
  budgetStatus?: "within_budget" | "above_budget" | "unknown_price";
  budgetNote?: string;
};

export type RecommendSessionSnapshot = {
  version: typeof RECOMMEND_SESSION_STORAGE_VERSION;
  form: RecommendInputFields;
  filtersEnabled: boolean;
  games: RecommendSessionGame[];
  noStrongMatchesAfterSuccess: boolean;
  dailyLimitReached: boolean;
  dailyLimitContext: { plan: string | null; anonymous: boolean } | null;
  resultsReveal: boolean;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isRecommendFormFields(v: unknown): v is RecommendInputFields {
  if (!isRecord(v)) return false;
  const keys = [
    "userPrompt",
    "genres",
    "playStyles",
    "vibes",
    "mechanics",
    "platform",
    "budget",
  ] as const;
  return keys.every((k) => typeof v[k] === "string");
}

function isRecommendSessionGame(v: unknown): v is RecommendSessionGame {
  if (!isRecord(v)) return false;
  return typeof v.title === "string" && typeof v.match === "number" && typeof v.reason === "string";
}

export function loadRecommendSessionState(): RecommendSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== RECOMMEND_SESSION_STORAGE_VERSION) {
      return null;
    }
    if (!isRecommendFormFields(parsed.form)) return null;
    if (typeof parsed.filtersEnabled !== "boolean") return null;
    if (!Array.isArray(parsed.games) || !parsed.games.every(isRecommendSessionGame)) {
      return null;
    }
    if (typeof parsed.noStrongMatchesAfterSuccess !== "boolean") return null;
    if (typeof parsed.dailyLimitReached !== "boolean") return null;
    if (
      parsed.dailyLimitContext !== null &&
      (!isRecord(parsed.dailyLimitContext) ||
        (parsed.dailyLimitContext.plan !== null &&
          typeof parsed.dailyLimitContext.plan !== "string") ||
        typeof parsed.dailyLimitContext.anonymous !== "boolean")
    ) {
      return null;
    }
    if (typeof parsed.resultsReveal !== "boolean") return null;

    return parsed as RecommendSessionSnapshot;
  } catch {
    return null;
  }
}

export function saveRecommendSessionState(snapshot: RecommendSessionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...snapshot, version: RECOMMEND_SESSION_STORAGE_VERSION })
    );
  } catch {
    // Quota or private mode — ignore
  }
}

export function clearRecommendSessionState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
