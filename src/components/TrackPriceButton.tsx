"use client";

import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type Props = {
  title: string;
  rawgId?: number | null;
  /** Verified sale price from game page, when available (sets tracking baseline). */
  baselinePrice?: number | null;
};

export default function TrackPriceButton({ title, rawgId, baselinePrice }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        showToast({
          variant: "info",
          message: "Log in to track this game’s price.",
        });
        setLoading(false);
        return;
      }

      const body: {
        title: string;
        rawgId?: number;
        targetPrice?: number;
        lastKnownPrice?: number;
      } = { title };
      if (typeof rawgId === "number" && Number.isFinite(rawgId)) {
        body.rawgId = rawgId;
      }
      if (
        typeof baselinePrice === "number" &&
        Number.isFinite(baselinePrice) &&
        baselinePrice > 0
      ) {
        body.lastKnownPrice = baselinePrice;
      }

      const res = await fetch("/api/track-game", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        showToast({
          variant: res.status === 403 ? "info" : "error",
          message:
            json.message ||
            json.error ||
            "Could not start tracking.",
        });
        return;
      }

      showToast({
        variant: "success",
        message:
          "You’re set — we’ll email you when we detect a verified price drop for this game.",
      });
    } catch {
      showToast({
        variant: "error",
        message: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-full border border-cyan-400/40 bg-black/30 px-6 py-3 text-center text-sm font-black text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving…" : "Track price"}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        We&apos;ll email you when we detect a verified price drop. Track one game here for alerts.
        To save a whole recommendation run to your dashboard, use{" "}
        <Link
          href="/recommend"
          className="font-semibold text-cyan-300/90 underline-offset-2 hover:underline"
        >
          Recommend
        </Link>
        .
      </p>
    </div>
  );
}
