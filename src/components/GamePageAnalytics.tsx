"use client";

import { useEffect } from "react";
import { trackProductEvent } from "@/lib/product-analytics/client";

type Props = {
  title: string;
  rawgId: number;
};

function storeLabelFromUrl(href: string): { store: string; provider: string } {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    const store = host.split(".")[0] || host;
    return { store, provider: host };
  } catch {
    return { store: "external", provider: "external" };
  }
}

export default function GamePageAnalytics({ title, rawgId }: Props) {
  useEffect(() => {
    trackProductEvent("game_viewed", {
      page_path:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : undefined,
      metadata: {
        title: title.slice(0, 120),
        rawgId,
      },
    });
  }, [title, rawgId]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor?.href) return;
      if (anchor.href.startsWith(window.location.origin)) return;
      if (!/^https?:\/\//i.test(anchor.href)) return;

      const { store, provider } = storeLabelFromUrl(anchor.href);
      trackProductEvent("store_clicked", {
        metadata: {
          title: title.slice(0, 120),
          rawgId,
          store,
          provider,
        },
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [title, rawgId]);

  return null;
}
