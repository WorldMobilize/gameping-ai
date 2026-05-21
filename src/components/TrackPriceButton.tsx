"use client";

import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import {
  LIMIT_TOAST_DURATION_MS,
  limitReachedToastMessage,
} from "@/lib/product-copy";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export type TrackPriceOfferSnapshot = {
  currency?: string | null;
  provider?: string | null;
  storeName?: string | null;
  url?: string | null;
};

type Props = {
  title: string;
  rawgId?: number | null;
  /** Verified sale price from game page, when available (sets tracking baseline). */
  baselinePrice?: number | null;
  /** Region used for pricing on this page (validated server-side). */
  pricingCountry: string;
  offerSnapshot?: TrackPriceOfferSnapshot;
};

function regionLabel(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase();
  return cc || "US";
}

export default function TrackPriceButton({
  title,
  rawgId,
  baselinePrice,
  pricingCountry,
  offerSnapshot,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const region = regionLabel(pricingCountry);
  const currencyHint = offerSnapshot?.currency?.trim().toUpperCase();

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

      const body: Record<string, unknown> = {
        title,
        pricingCountry: region,
      };
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
      if (offerSnapshot?.currency?.trim()) {
        body.currency = offerSnapshot.currency.trim();
      }
      if (offerSnapshot?.provider?.trim()) {
        body.provider = offerSnapshot.provider.trim();
      }
      if (offerSnapshot?.storeName?.trim()) {
        body.storeName = offerSnapshot.storeName.trim();
      }
      if (offerSnapshot?.url?.trim()) {
        body.url = offerSnapshot.url.trim();
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
        plan?: string;
        limitType?: string;
      };

      if (!res.ok) {
        if (res.status === 403 && json.error === "track_limit_reached") {
          const toast = limitReachedToastMessage({
            limitType: "tracked_games",
            plan: typeof json.plan === "string" ? json.plan : "free",
          });
          showToast({
            variant: "info",
            title: toast.title,
            message: json.message || toast.message,
            durationMs: LIMIT_TOAST_DURATION_MS,
          });
        } else {
          showToast({
            variant: res.status === 403 ? "info" : "error",
            message:
              json.message ||
              json.error ||
              "Could not start tracking.",
          });
        }
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
        Alerts will use your current region:{" "}
        <span className="font-semibold text-white/60">
          {region}
          {currencyHint ? ` / ${currencyHint}` : ""}
        </span>
        . We&apos;ll email you when we detect a verified price drop. Track one game here for
        alerts. To save a whole recommendation run to your dashboard, use{" "}
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
