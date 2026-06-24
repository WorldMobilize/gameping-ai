"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import type { PremiumRotationType } from "@/lib/discovery/user-rotation-store";

/**
 * "Refresh picks" for a premium personalization page. Force-regenerates the
 * current-period rotation (cooldown-guarded server-side) then refreshes the
 * route so the new content renders. Only rendered for premium/admin viewers.
 */
export default function PremiumRefreshButton({
  type,
  label = "Refresh picks",
}: {
  type: PremiumRotationType;
  label?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onRefresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/premium/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        retryAfterSec?: number;
        message?: string;
      };

      if (res.status === 429) {
        const mins = Math.max(1, Math.ceil((json.retryAfterSec ?? 60) / 60));
        showToast({ variant: "info", message: `Just refreshed — try again in ~${mins} min.` });
        return;
      }
      if (!res.ok || !json.ok) {
        showToast({
          variant: "error",
          message: json.message || "Couldn't refresh right now. Please try again shortly.",
        });
        return;
      }

      showToast({ variant: "success", message: "Refreshed with your latest taste signals." });
      startTransition(() => router.refresh());
    } catch {
      showToast({ variant: "error", message: "Couldn't refresh right now. Please try again shortly." });
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || isPending;

  return (
    <button
      type="button"
      onClick={() => void onRefresh()}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--page-accent-text)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        className={`h-4 w-4 ${busy ? "animate-spin motion-reduce:animate-none" : ""}`}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2v3h-3" />
      </svg>
      {busy ? "Refreshing…" : label}
    </button>
  );
}
