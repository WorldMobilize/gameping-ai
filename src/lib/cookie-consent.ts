/**
 * Cookie consent — one source of truth for "may we track this visitor?".
 *
 * Opt-in, deliberately: consent is granted only by an explicit "accepted". Absent
 * (banner not answered yet) and "rejected" both mean NO. The old rule was "anything
 * but rejected", which tracked every first-time visitor before the banner was even
 * clicked — the storage happens first and the question comes after, which is exactly
 * backwards.
 */

export const CONSENT_KEY = "cookie_consent";

/** Fired when the visitor answers the banner, so listeners react without a reload. */
export const CONSENT_EVENT = "gp:cookie-consent";

export type ConsentValue = "accepted" | "rejected";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

/** True only after an explicit yes. */
export function hasAnalyticsConsent(): boolean {
  return readConsent() === "accepted";
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
