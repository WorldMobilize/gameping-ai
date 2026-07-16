"use client";

import type {
  ProductAnalyticsEventInput,
  ProductAnalyticsEventName,
  ProductAnalyticsMetadata,
} from "./types";

import { hasAnalyticsConsent } from "@/lib/cookie-consent";

const ANON_KEY = "gp_anonymous_id";
const SESSION_KEY = "gp_session_id";
const SESSION_STARTED_KEY = "gp_session_started";
export const PRODUCT_ANALYTICS_EVENT_PATH = "/api/analytics/event";

/**
 * Consent is OPT-IN, not opt-out, and the rule lives in ONE place (lib/cookie-consent).
 *
 * This used to read `!== "rejected"`, which means "track everyone until they say no"
 * — and on a first visit the banner has not been answered, so that key is absent and
 * the visitor was tracked before being asked. Under ePrivacy the question is not what
 * you store but WHEN: nothing goes on the visitor's device, and nothing is sent about
 * them, until they have actually said yes.
 */
function canTrack(): boolean {
  return hasAnalyticsConsent();
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The id generators MUST refuse to write without consent, not just the send path.
 *
 * Gating only the network call would still leave a persistent identifier sitting in
 * the visitor's localStorage — and it is the WRITING of that identifier, not the
 * sending, that ePrivacy asks permission for. So the guard lives here too, where the
 * storage actually happens, and no caller can bypass it by accident.
 */
export function getAnonymousId(): string {
  if (!canTrack()) return "";

  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = newId();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (!canTrack()) return "";

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
