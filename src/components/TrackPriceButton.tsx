"use client";

import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { APP_INLINE_LINK, APP_PRIMARY_CTA_SM } from "@/components/app/app-styles";
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

/** POST /api/track-game body (regional fields validated server-side). */
export type TrackGameRequestBody = {
  title: string;
  rawgId?: number;
  lastKnownPrice?: number;
  pricingCountry: string;
  lastKnownCurrency?: string;
  lastKnownProvider?: string;
  lastKnownStore?: string;
  lastKnownUrl?: string;
};

export function buildTrackGameRequestBody(params: {
  title: string;
  rawgId?: number | null;
  baselinePrice?: number | null;
  pricingCountry: string;
  offerSnapshot?: TrackPriceOfferSnapshot;
}): TrackGameRequestBody {
  const body: TrackGameRequestBody = {
    title: params.title.trim(),
    pricingCountry: regionLabel(params.pricingCountry),
  };

  if (typeof params.rawgId === "number" && Number.isFinite(params.rawgId)) {
    body.rawgId = params.rawgId;
  }

  if (
    typeof params.baselinePrice === "number" &&
    Number.isFinite(params.baselinePrice) &&
    params.baselinePrice > 0
  ) {
    body.lastKnownPrice = params.baselinePrice;
  }

  const snap = params.offerSnapshot;
  const currency = snap?.currency?.trim();
  if (currency) {
    body.lastKnownCurrency = currency;
  }
  const provider = snap?.provider?.trim();
  if (provider) {
    body.lastKnownProvider = provider;
  }
  const store = snap?.storeName?.trim();
  if (store) {
    body.lastKnownStore = store;
  }
  const url = snap?.url?.trim();
  if (url) {
    body.lastKnownUrl = url;
  }

  return body;
}

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

      const body = buildTrackGameRequestBody({
        title,
        rawgId,
        baselinePrice,
        pricingCountry,
        offerSnapshot,
      });

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
        className={`w-full ${APP_PRIMARY_CTA_SM} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? "Saving…" : "Track price"}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Alerts will use your current region:{" "}
        <span className="font-semibold text-slate-700">
          {region}
          {currencyHint ? ` / ${currencyHint}` : ""}
        </span>
        . We&apos;ll email you when we detect a verified price drop. Track one game here for
        alerts. To save a whole recommendation run to your dashboard, use{" "}
        <Link href="/recommend" className={APP_INLINE_LINK}>
          Recommend
        </Link>
        .
      </p>
    </div>
  );
}
