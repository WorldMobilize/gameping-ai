"use client";

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
        message: "We’ll watch this game for price changes.",
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
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-4 w-full rounded-full border border-cyan-400/40 bg-black/30 px-6 py-3 text-center text-sm font-black text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Saving…" : "Track price"}
    </button>
  );
}
