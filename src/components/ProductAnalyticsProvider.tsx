"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getSessionId,
  hasSessionStarted,
  markSessionStarted,
  trackProductEvent,
} from "@/lib/product-analytics/client";
import {
  buildPageViewMetadata,
  buildSessionStartMetadata,
} from "@/lib/product-analytics/page-metadata";

const HEARTBEAT_MS = 30_000;

/**
 * Renders nothing and wraps nothing — it holds no context, it just watches the
 * route and reports. It used to take `children` and hand them straight back,
 * which put the whole app inside its Suspense boundary; useSearchParams() bails
 * out of prerendering, so that boundary took every page's static HTML down with
 * it (see AppProviders). It is a sibling of the app now, not its parent.
 */
export default function ProductAnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasSessionStarted()) {
      markSessionStarted();
      trackProductEvent("session_start", {
        metadata: buildSessionStartMetadata(),
      });
    }

    const onEnd = () => {
      trackProductEvent("session_end", { beacon: true });
    };

    window.addEventListener("pagehide", onEnd);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        trackProductEvent("session_end", { beacon: true });
      }
    });

    return () => {
      window.removeEventListener("pagehide", onEnd);
    };
  }, []);

  useEffect(() => {
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    if (!path || path === lastPathRef.current) return;
    lastPathRef.current = path;
    trackProductEvent("page_view", {
      page_path: path,
      metadata: buildPageViewMetadata(),
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      trackProductEvent("session_heartbeat", {
        metadata: { sessionIdPresent: Boolean(getSessionId()) },
      });
    };

    const id = window.setInterval(tick, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
