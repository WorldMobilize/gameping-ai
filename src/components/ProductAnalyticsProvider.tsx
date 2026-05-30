"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getSessionId,
  hasSessionStarted,
  markSessionStarted,
  trackProductEvent,
} from "@/lib/product-analytics/client";

const HEARTBEAT_MS = 30_000;

export default function ProductAnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasSessionStarted()) {
      markSessionStarted();
      trackProductEvent("session_start");
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
    trackProductEvent("page_view", { page_path: path });
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

  return children;
}
