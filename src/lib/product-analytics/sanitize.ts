import type { ProductAnalyticsEventName, ProductAnalyticsMetadata } from "./types";
import { PRODUCT_ANALYTICS_EVENTS } from "./types";

const BLOCKED_METADATA_KEYS = new Set([
  "prompt",
  "userprompt",
  "user_prompt",
  "message",
  "email",
  "password",
  "token",
  "authorization",
  "auth",
  "secret",
  "apikey",
  "api_key",
  "preferences",
  "games",
  "form",
  "body",
  "raw",
  "query",
]);

const MAX_METADATA_KEYS = 12;
const MAX_STRING_LEN = 200;
const MAX_SESSION_ID_LEN = 64;
const MAX_ANON_ID_LEN = 64;
const MAX_PAGE_PATH_LEN = 512;
const MAX_REFERRER_LEN = 512;

export function isProductAnalyticsEventName(
  value: string
): value is ProductAnalyticsEventName {
  return (PRODUCT_ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export function sanitizeSessionId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t || t.length > MAX_SESSION_ID_LEN) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(t)) return null;
  return t;
}

export function sanitizeAnonymousId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t || t.length > MAX_ANON_ID_LEN) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(t)) return null;
  return t;
}

export function sanitizePagePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  if (!t.startsWith("/")) return null;
  return t.slice(0, MAX_PAGE_PATH_LEN);
}

export function sanitizeReferrer(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, MAX_REFERRER_LEN);
}

export function sanitizeProductAnalyticsMetadata(
  value: unknown
): ProductAnalyticsMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const out: ProductAnalyticsMetadata = {};
  const entries = Object.entries(value as Record<string, unknown>).slice(
    0,
    MAX_METADATA_KEYS
  );

  for (const [rawKey, rawVal] of entries) {
    const key = rawKey.trim().toLowerCase();
    if (!key || BLOCKED_METADATA_KEYS.has(key)) continue;
    if (key.includes("prompt") || key.includes("email")) continue;

    if (typeof rawVal === "boolean") {
      out[key] = rawVal;
      continue;
    }
    if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
      out[key] = rawVal;
      continue;
    }
    if (typeof rawVal === "string") {
      const t = rawVal.trim();
      if (!t) continue;
      out[key] = t.slice(0, MAX_STRING_LEN);
    }
  }

  return out;
}

export function inferDeviceType(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|playbook/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}
