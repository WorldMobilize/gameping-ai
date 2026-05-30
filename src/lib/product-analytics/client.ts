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

export function trackProductEvent(
  event_name: ProductAnalyticsEventName,
  options: TrackOptions = {}
): void {
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

  const body = JSON.stringify(payload);

  if (options.beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: options.beacon,
    credentials: "same-origin",
  }).catch(() => {
    /* analytics must not break UX */
  });
}
