"use client";

import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type Props = {
  title: string;
  rawgId?: number | null;
};

export default function TrackPriceButton({ title, rawgId }: Props) {
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

      const body: { title: string; rawgId?: number; targetPrice?: number } = {
        title,
      };
      if (typeof rawgId === "number" && Number.isFinite(rawgId)) {
        body.rawgId = rawgId;
      }

      const res = await fetch("/api/track-game", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        showToast({
          variant: "error",
          message: json.error || "Could not start tracking.",
        });
        return;
      }

      showToast({
        variant: "success",
        message:
          "You’re set — we’ll email you about price drops and deals for this game when we spot them.",
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
        Track one game here for price alerts. To save a whole recommendation run to your dashboard,
        use{" "}
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
