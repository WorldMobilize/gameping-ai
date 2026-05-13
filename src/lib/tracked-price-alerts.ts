import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { lookupBestPrice } from "@/lib/pricing/price-service";

function parsePriceToNumber(price: string): number | null {
  const p = (price || "").trim();
  if (!p || p === "N/A") return null;
  if (/^free$/i.test(p)) return 0;
  const n = Number(p.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Single RAWG fetch for cron: canonical name + hero image when rawg_id exists. */
export async function fetchRawgGameMeta(params: {
  rawgId: number | null | undefined;
  fallbackTitle: string;
}): Promise<{ title: string; backgroundImage: string | null }> {
  const id = params.rawgId;
  const fb = params.fallbackTitle.trim();
  if (typeof id !== "number" || !Number.isFinite(id) || id <= 0) {
    return { title: fb, backgroundImage: null };
  }

  const key = process.env.RAWG_API_KEY;
  if (!key) {
    return { title: fb, backgroundImage: null };
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${id}?key=${encodeURIComponent(key)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { title: fb, backgroundImage: null };
    const data = (await res.json()) as {
      name?: string;
      background_image?: string | null;
    };
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const bg =
      typeof data.background_image === "string" &&
      data.background_image.startsWith("http")
        ? data.background_image
        : null;
    return { title: name || fb, backgroundImage: bg };
  } catch {
    return { title: fb, backgroundImage: null };
  }
}

export function shouldAlertOnPrice(params: {
  targetPrice: number | null | undefined;
  lastKnownPrice: number | null | undefined;
  newPriceNum: number;
}): { alert: boolean; reason: string } {
  const target =
    params.targetPrice != null && Number.isFinite(Number(params.targetPrice))
      ? Number(params.targetPrice)
      : null;
  const lastKnown =
    params.lastKnownPrice != null &&
    Number.isFinite(Number(params.lastKnownPrice))
      ? Number(params.lastKnownPrice)
      : null;
  const newPriceNum = params.newPriceNum;

  if (target != null) {
    if (newPriceNum <= target) return { alert: true, reason: "target_met" };
    return { alert: false, reason: "above_target" };
  }

  if (lastKnown == null) {
    return { alert: false, reason: "baseline_only" };
  }

  if (newPriceNum < lastKnown) {
    const dropAbs = lastKnown - newPriceNum;
    const pct = lastKnown > 0 ? dropAbs / lastKnown : 0;
    if (pct >= 0.05 || dropAbs >= 2) {
      return { alert: true, reason: "significant_drop" };
    }
  }

  return { alert: false, reason: "no_significant_change" };
}

/** Accepts any Supabase JS client (browser, server, service role) used for alert queries. */
export async function hasDuplicateAlertInCooldown(params: {
  supabase: SupabaseClient;
  trackedGameId: string;
  newPrice: number;
  provider: string | null | undefined;
  cooldownHours?: number;
}): Promise<boolean> {
  const hours = params.cooldownHours ?? 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const prov = params.provider ?? "";

  const { data, error } = await params.supabase
    .from("price_alert_events")
    .select("id")
    .eq("tracked_game_id", params.trackedGameId)
    .eq("new_price", params.newPrice)
    .eq("provider", prov)
    .gte("created_at", since)
    .limit(1);

  if (error) {
    console.warn("[cron:alert-dedupe] query failed", error);
    return true;
  }

  return Boolean(data && data.length > 0);
}

/**
 * Uses the same path as game details: cache → CheapShark → ITAD, all gated.
 */
export async function lookupVerifiedBestPriceForAlert(requestedTitle: string) {
  const best = await lookupBestPrice({
    title: requestedTitle.trim(),
    debug: process.env.NODE_ENV === "development",
    debugLabel: `cron:tracked:${requestedTitle.slice(0, 40)}`,
  });

  if (!best) {
    return { ok: false as const, reason: "no_price_match" };
  }

  const priceNum = parsePriceToNumber(best.price);
  if (priceNum == null) {
    return { ok: false as const, reason: "unparsed_price" };
  }

  const trustedUrl = Boolean(best.deal?.url?.trim());
  if (!trustedUrl) {
    return { ok: false as const, reason: "no_trusted_url" };
  }

  return { ok: true as const, best, priceNum };
}

export function buildOutboundAlertUrl(params: {
  dealUrl: string;
  gameTitle: string;
  siteOrigin: string;
}) {
  const origin = params.siteOrigin.replace(/\/$/, "");
  const q = new URLSearchParams({
    to: params.dealUrl,
    gameTitle: params.gameTitle,
    source: "price_alert",
  });
  if (params.dealUrl.includes("cheapshark.com") && params.dealUrl.includes("dealID=")) {
    try {
      const u = new URL(params.dealUrl);
      const dealID = u.searchParams.get("dealID");
      if (dealID) q.set("dealID", dealID);
    } catch {
      /* ignore */
    }
  }
  return `${origin}/api/out?${q.toString()}`;
}

export function buildAlertEmailHtml(params: {
  gameTitle: string;
  priceDisplay: string;
  storeName: string;
  matchedListing?: string;
  ctaUrl: string;
  heroImageUrl?: string | null;
}) {
  const img =
    params.heroImageUrl &&
    params.heroImageUrl.startsWith("http") &&
    !params.heroImageUrl.includes('"')
      ? `<div style="margin:16px 0;"><img src="${params.heroImageUrl}" alt="" width="560" style="max-width:100%;border-radius:12px;" /></div>`
      : "";

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#05060f;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05060f;padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0b0d18;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#67e8f9;">GamePing AI</p>
              <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Price alert</h1>
              <p style="margin:0 0 8px;font-size:16px;color:#fff;"><strong>${escapeHtml(params.gameTitle)}</strong></p>
              <p style="margin:0 0 6px;font-size:15px;color:#a5f3fc;">Verified deal: <strong>${escapeHtml(params.priceDisplay)}</strong></p>
              <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.45);">Store: ${escapeHtml(params.storeName)} · ${params.matchedListing ? `Listing: ${escapeHtml(params.matchedListing)}` : "Listing verified via pricing gate"}</p>
              ${img}
              <p style="margin:16px 0;font-size:12px;color:rgba(255,255,255,0.4);">Prices may vary by region/store. Link opens a verified store redirect.</p>
              <a href="${params.ctaUrl}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#22d3ee;color:#03040a;font-weight:800;text-decoration:none;border-radius:999px;">View verified deal →</a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,0.35);">You’re receiving this because you tracked this game on GamePing AI.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
