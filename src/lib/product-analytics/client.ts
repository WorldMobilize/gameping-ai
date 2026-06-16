"use client";

import type {
  ProductAnalyticsEventInput,
  ProductAnalyticsEventName,
  ProductAnalyticsMetadata,
} from "./types";

const ANON_KEY = "gp_anonymous_id";
const SESSION_KEY = "gp_session_id";
const SESSION_STARTED_KEY = "gp_session_started";
const CONSENT_KEY = "cookie_consent";
export const PRODUCT_ANALYTICS_EVENT_PATH = "/api/analytics/event";

function canTrack(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) !== "rejected";
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = newId();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = newId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const id = newId();
  sessionStorage.setItem(SESSION_KEY, id);
  sessionStorage.removeItem(SESSION_STARTED_KEY);
  return id;
}

export function markSessionStarted(): void {
  sessionStorage.setItem(SESSION_STARTED_KEY, "1");
}

export function hasSessionStarted(): boolean {
  return sessionStorage.getItem(SESSION_STARTED_KEY) === "1";
}

type TrackOptions = {
  page_path?: string;
  referrer?: string;
  metadata?: ProductAnalyticsMetadata;
  /** Use sendBeacon for unload-safe delivery */
  beacon?: boolean;
};

function deliverAnalyticsPayload(body: string, beacon: boolean): void {
  try {
    if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(PRODUCT_ANALYTICS_EVENT_PATH, blob);
      return;
    }

    void fetch(PRODUCT_ANALYTICS_EVENT_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: beacon,
      credentials: "same-origin",
    }).catch(() => {
      /* analytics must not break UX */
    });
  } catch {
    /* analytics must not break UX */
  }
}

export function trackProductEvent(
  event_name: ProductAnalyticsEventName,
  options: TrackOptions = {}
): void {
  try {
    if (!canTrack()) return;

    const session_id = getSessionId();
    const anonymous_id = getAnonymousId();
    if (!session_id) return;

    const payload: ProductAnalyticsEventInput = {
      event_name,
      session_id,
      anonymous_id,
      page_path:
        options.page_path ??
        (typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : null),
      referrer:
        options.referrer ??
        (typeof document !== "undefined" ? document.referrer || null : null),
      metadata: options.metadata,
    };

    deliverAnalyticsPayload(JSON.stringify(payload), Boolean(options.beacon));
  } catch {
    /* analytics must not break UX */
  }
}
