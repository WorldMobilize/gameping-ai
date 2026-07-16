"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CONSENT_EVENT, hasAnalyticsConsent } from "@/lib/cookie-consent";

/**
 * Vercel Analytics, mounted ONLY after the visitor has accepted.
 *
 * It used to render unconditionally on every page. Whether or not it sets a cookie,
 * loading a third-party analytics script for someone who has not been asked is the
 * thing the cookie banner exists to prevent — and our own cookie policy claimed we
 * did not do it, which made the page a false statement rather than a mistake.
 *
 * Listens for the consent event so accepting the banner starts analytics straight
 * away, without a reload.
 */
export default function ConsentedAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasAnalyticsConsent());

    const sync = () => setConsented(hasAnalyticsConsent());
    window.addEventListener(CONSENT_EVENT, sync);
    // Consent given in another tab.
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!consented) return null;

  return <Analytics />;
}
