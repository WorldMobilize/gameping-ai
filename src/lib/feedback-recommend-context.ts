export const FEEDBACK_RECOMMEND_CONTEXT_VERSION = 1 as const;
export const FEEDBACK_RECOMMEND_CONTEXT_MAX_BYTES = 8192;
export const FEEDBACK_RECOMMEND_CONTEXT_MAX_GAMES = 6;
export const FEEDBACK_RECOMMEND_CONTEXT_PROMPT_MAX = 500;
export const FEEDBACK_RECOMMEND_CONTEXT_REFINE_MESSAGE_MAX = 200;
export const FEEDBACK_RECOMMEND_CONTEXT_TITLE_MAX = 200;

const STORAGE_KEY = "gameping:feedback-recommend-context:v1";

export type FeedbackRecommendContextGame = {
  title: string;
  match: number;
  matchTier?: "best_match" | "good_alternative" | "partial_match";
};

export type FeedbackRecommendContext = {
  version: typeof FEEDBACK_RECOMMEND_CONTEXT_VERSION;
  prompt: string;
  games: FeedbackRecommendContextGame[];
  isRefine: boolean;
  originalPrompt?: string;
  refineMessage?: string;
  resultedAt: string;
};

function clampText(value: string, max: number): string {
  const t = value.trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) : t;
}

function normalizeMatchTier(
  value: unknown
): FeedbackRecommendContextGame["matchTier"] | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (t === "best_match" || t === "good_alternative" || t === "partial_match") {
    return t;
  }
  return undefined;
}

function normalizeGame(value: unknown): FeedbackRecommendContextGame | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const title = clampText(typeof row.title === "string" ? row.title : "", FEEDBACK_RECOMMEND_CONTEXT_TITLE_MAX);
  if (!title) return null;
  const matchRaw = row.match;
  if (typeof matchRaw !== "number" || !Number.isFinite(matchRaw)) return null;
  const match = Math.round(Math.min(100, Math.max(0, matchRaw)));
  const matchTier = normalizeMatchTier(row.matchTier);
  return matchTier ? { title, match, matchTier } : { title, match };
}

/** Build a sanitized context snapshot from recommendation results. */
export function buildFeedbackRecommendContext(params: {
  prompt: string;
  games: Array<{
    title: string;
    match: number;
    matchTier?: string;
  }>;
  isRefine?: boolean;
  originalPrompt?: string;
  refineMessage?: string;
  resultedAt?: string;
}): FeedbackRecommendContext | null {
  const prompt = clampText(params.prompt, FEEDBACK_RECOMMEND_CONTEXT_PROMPT_MAX);
  if (!prompt) return null;

  const games: FeedbackRecommendContextGame[] = [];
  for (const game of params.games.slice(0, FEEDBACK_RECOMMEND_CONTEXT_MAX_GAMES)) {
    const normalized = normalizeGame(game);
    if (normalized) games.push(normalized);
  }

  const isRefine = Boolean(params.isRefine);
  let originalPrompt: string | undefined;
  let refineMessage: string | undefined;

  if (isRefine) {
    const op = clampText(params.originalPrompt ?? params.prompt, FEEDBACK_RECOMMEND_CONTEXT_PROMPT_MAX);
    originalPrompt = op || undefined;
    const rm = clampText(params.refineMessage ?? "", FEEDBACK_RECOMMEND_CONTEXT_REFINE_MESSAGE_MAX);
    refineMessage = rm || undefined;
  }

  const resultedAt =
    typeof params.resultedAt === "string" && params.resultedAt.trim()
      ? params.resultedAt.trim().slice(0, 40)
      : new Date().toISOString();

  const context: FeedbackRecommendContext = {
    version: FEEDBACK_RECOMMEND_CONTEXT_VERSION,
    prompt,
    games,
    isRefine,
    resultedAt,
  };

  if (originalPrompt) context.originalPrompt = originalPrompt;
  if (refineMessage) context.refineMessage = refineMessage;

  if (feedbackRecommendContextByteSize(context) > FEEDBACK_RECOMMEND_CONTEXT_MAX_BYTES) {
    return null;
  }

  return context;
}

/** Validate and strip unknown fields from client/API payloads. */
export function sanitizeFeedbackRecommendContext(
  value: unknown
): FeedbackRecommendContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== FEEDBACK_RECOMMEND_CONTEXT_VERSION) return null;

  const prompt = clampText(typeof row.prompt === "string" ? row.prompt : "", FEEDBACK_RECOMMEND_CONTEXT_PROMPT_MAX);
  if (!prompt) return null;

  if (!Array.isArray(row.games)) return null;
  const games: FeedbackRecommendContextGame[] = [];
  for (const game of row.games.slice(0, FEEDBACK_RECOMMEND_CONTEXT_MAX_GAMES)) {
    const normalized = normalizeGame(game);
    if (normalized) games.push(normalized);
  }

  const isRefine = row.isRefine === true;
  let originalPrompt: string | undefined;
  let refineMessage: string | undefined;

  if (isRefine) {
    if (typeof row.originalPrompt === "string") {
      const op = clampText(row.originalPrompt, FEEDBACK_RECOMMEND_CONTEXT_PROMPT_MAX);
      originalPrompt = op || undefined;
    }
    if (typeof row.refineMessage === "string") {
      const rm = clampText(row.refineMessage, FEEDBACK_RECOMMEND_CONTEXT_REFINE_MESSAGE_MAX);
      refineMessage = rm || undefined;
    }
  }

  const resultedAt =
    typeof row.resultedAt === "string" && row.resultedAt.trim()
      ? row.resultedAt.trim().slice(0, 40)
      : new Date().toISOString();

  const context: FeedbackRecommendContext = {
    version: FEEDBACK_RECOMMEND_CONTEXT_VERSION,
    prompt,
    games,
    isRefine,
    resultedAt,
  };

  if (originalPrompt) context.originalPrompt = originalPrompt;
  if (refineMessage) context.refineMessage = refineMessage;

  if (feedbackRecommendContextByteSize(context) > FEEDBACK_RECOMMEND_CONTEXT_MAX_BYTES) {
    return null;
  }

  return context;
}

export function feedbackRecommendContextByteSize(
  context: FeedbackRecommendContext
): number {
  return new TextEncoder().encode(JSON.stringify(context)).length;
}

export function saveFeedbackRecommendContext(context: FeedbackRecommendContext): void {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeFeedbackRecommendContext(context);
  if (!sanitized) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Quota or private mode — ignore
  }
}

export function loadFeedbackRecommendContext(): FeedbackRecommendContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeFeedbackRecommendContext(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function persistFeedbackRecommendContextFromResults(params: {
  prompt: string;
  games: Array<{
    title: string;
    match: number;
    matchTier?: string;
  }>;
  isRefine?: boolean;
  originalPrompt?: string;
  refineMessage?: string;
}): void {
  const context = buildFeedbackRecommendContext({
    ...params,
    resultedAt: new Date().toISOString(),
  });
  if (context) saveFeedbackRecommendContext(context);
}
