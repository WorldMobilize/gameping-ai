export const FEEDBACK_TYPES = [
  { value: "something_wrong", label: "Something feels wrong" },
  { value: "wrong_price", label: "Wrong price or store" },
  { value: "recommendation_miss", label: "Recommendation missed the vibe" },
  { value: "confusing_ux", label: "Confusing UX" },
  { value: "feature_idea", label: "Feature idea" },
  { value: "other", label: "Other feedback" },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];

const FEEDBACK_TYPE_SET = new Set<string>(FEEDBACK_TYPES.map((t) => t.value));

export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_PAGE_URL_MAX = 2048;
export const FEEDBACK_EMAIL_MAX = 254;
export const FEEDBACK_USER_AGENT_MAX = 512;

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPE_SET.has(value);
}

export function resolveFeedbackContextArea(pageUrl: string | null | undefined): string {
  const raw = pageUrl?.trim();
  if (!raw) return "other";

  let pathname: string;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    try {
      pathname = raw.startsWith("/") ? raw : `/${raw}`;
    } catch {
      return "other";
    }
  }

  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/") return "homepage";
  if (path === "/recommend") return "recommend";
  if (path.startsWith("/game/")) return "game_page";
  if (path === "/dashboard") return "dashboard";
  if (path === "/games") return "games_directory";
  if (path === "/games-like" || path === "/collections") return "curated";
  if (path.startsWith("/games-like/") || path.startsWith("/collections/")) return "curated";
  if (path === "/upgrade") return "upgrade";
  if (path === "/login") return "login";
  if (path === "/settings" || path.startsWith("/settings/")) return "settings";
  if (path === "/about") return "about";
  if (path === "/contact") return "contact";
  if (path.startsWith("/legal") || path === "/privacy" || path === "/terms") return "legal";

  return "other";
}

export function isValidOptionalFeedbackEmail(email: string): boolean {
  const t = email.trim();
  if (!t) return true;
  if (t.length > FEEDBACK_EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function normalizeFeedbackPageUrl(pageUrl: unknown): string | null {
  if (typeof pageUrl !== "string") return null;
  const t = pageUrl.trim();
  if (!t || t.length > FEEDBACK_PAGE_URL_MAX) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href.slice(0, FEEDBACK_PAGE_URL_MAX);
  } catch {
    return null;
  }
}
