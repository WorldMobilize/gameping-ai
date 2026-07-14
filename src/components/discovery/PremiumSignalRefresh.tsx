"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { APP_MUTED } from "@/components/app/app-styles";
import type { PremiumRotationType } from "@/lib/discovery/user-rotation-store";

/**
 * Background refresher for a rotation whose taste signals moved after it was
 * built (a Steam import, a new saved search, a newly tracked game).
 *
 * The page keeps rendering the cached content — it is real, just built from an
 * older profile — while this regenerates it and swaps it in. It posts to
 * /api/premium/refresh, which generates first and only overwrites the cache on
 * success, so a failed refresh can never leave the user with an empty page. That
 * endpoint also enforces its own cooldown; on 429 we simply do nothing and try
 * again on the next visit.
 */
export default function PremiumSignalRefresh({
  type,
  noun,
}: {
  type: PremiumRotationType;
  /** e.g. "picks", "deals", "recap" — used in the status line. */
  noun: string;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(true);
  const [, startTransition] = useTransition();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/premium/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
        if (!cancelled && res.ok && json.ok) {
          startTransition(() => router.refresh());
          return;
        }
      } catch {
        // Swallow: the cached content on screen stays valid either way.
      }
      if (!cancelled) setWorking(false);
    }

    void refresh();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing useful to say once it has settled — the content below is what it is.
  if (!working) return null;

  return (
    <p className={`mt-4 text-xs ${APP_MUTED}`} aria-live="polite">
      Your taste profile changed — updating your {noun}…
    </p>
  );
}
