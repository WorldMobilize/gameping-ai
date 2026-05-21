import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAggregatorPriceLine } from "@/lib/pricing/display";
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

/** Explicit target only when a finite number strictly greater than zero. */
export function parseExplicitTargetPrice(
  targetPrice: number | null | undefined
): number | null {
  if (targetPrice == null) return null;
  const n = Number(targetPrice);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parseTrackedBaselinePrice(
  value: number | null | undefined
): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export type PriceAlertDecisionReason =
  | "baseline_only"
  | "target_met"
  | "above_target"
  | "significant_drop"
  | "no_significant_drop";

export function shouldAlertOnPrice(params: {
  targetPrice: number | null | undefined;
  lastKnownPrice: number | null | undefined;
  newPriceNum: number;
}): { alert: boolean; reason: PriceAlertDecisionReason } {
  const target = parseExplicitTargetPrice(params.targetPrice);
  const lastKnown = parseTrackedBaselinePrice(params.lastKnownPrice);
  const newPriceNum = params.newPriceNum;

  if (lastKnown == null) {
    return { alert: false, reason: "baseline_only" };
  }

  if (target != null) {
    if (newPriceNum <= target) return { alert: true, reason: "target_met" };
    return { alert: false, reason: "above_target" };
  }

  if (newPriceNum < lastKnown) {
    const dropAbs = lastKnown - newPriceNum;
    const pct = lastKnown > 0 ? dropAbs / lastKnown : 0;
    if (pct >= 0.05 || dropAbs >= 2) {
      return { alert: true, reason: "significant_drop" };
    }
  }

  return { alert: false, reason: "no_significant_drop" };
}

export function priceAlertContextLine(
  reason: PriceAlertDecisionReason | string | undefined
): string | null {
  if (reason === "target_met") {
    return "This reached your target price.";
  }
  if (reason === "significant_drop") {
    return "This dropped from your last tracked price.";
  }
  return null;
}

function formatAlertEmailNumericPrice(params: {
  amount: number;
  currency?: string | null;
}): string | null {
  if (!Number.isFinite(params.amount) || params.amount <= 0) return null;
  const price = params.amount.toFixed(2);
  return formatAggregatorPriceLine({ price, currency: params.currency });
}

/** Was/now line for alert emails; null when comparison is invalid or unsafe to show. */
export function buildPriceChangeContextLine(params: {
  wasPrice: number | null | undefined;
  nowPrice: number | null | undefined;
  currency?: string | null;
  alertReason?: PriceAlertDecisionReason | string;
}): string | null {
  const was = params.wasPrice;
  const now = params.nowPrice;
  if (was == null || now == null || !Number.isFinite(was) || !Number.isFinite(now)) {
    return null;
  }
  if (was <= 0 || now <= 0) return null;
  if (Math.abs(was - now) < 0.005) return null;

  const wasDisplay = formatAlertEmailNumericPrice({ amount: was, currency: params.currency });
  const nowDisplay = formatAlertEmailNumericPrice({ amount: now, currency: params.currency });
  if (!wasDisplay || !nowDisplay) return null;

  if (params.alertReason === "significant_drop") {
    if (was <= now) return null;
    return `Price dropped from ${wasDisplay} to ${nowDisplay}`;
  }

  if (params.alertReason === "target_met") {
    return `Your tracked game reached ${nowDisplay} (previously ${wasDisplay})`;
  }

  return null;
}

function resolvePriceAlertContextLine(
  params: Pick<
    PriceAlertEmailContentParams,
    "wasPriceNum" | "nowPriceNum" | "currency" | "alertReason"
  >
): string | null {
  return (
    buildPriceChangeContextLine({
      wasPrice: params.wasPriceNum,
      nowPrice: params.nowPriceNum,
      currency: params.currency,
      alertReason: params.alertReason,
    }) ?? priceAlertContextLine(params.alertReason)
  );
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
 * Uses the same path as game details: cache → ITAD → CheapShark USD fallback, all gated.
 * Intentionally omits PricingContext — defaults to US until profiles.pricing_country exists.
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

export const PRICE_ALERT_SUPPORT_EMAIL = "support@gamepingai.com";

export function formatAlertEmailSubjectPrice(params: {
  price: string;
  currency?: string | null;
}): string {
  const p = (params.price || "").trim();
  if (!p || p === "N/A") return "—";
  if (/^free$/i.test(p)) return "Free";
  const cur = (params.currency || "").trim().toUpperCase() || "USD";
  if (cur === "USD") return `$${p}`;
  return `${p} ${cur}`;
}

export function buildPriceAlertEmailSubject(params: {
  gameTitle: string;
  price: string;
  currency?: string | null;
}): string {
  const priceLabel = formatAlertEmailSubjectPrice({
    price: params.price,
    currency: params.currency,
  });
  return `Price drop: ${params.gameTitle.trim()} — ${priceLabel}`;
}

export function buildOutboundAlertUrl(params: {
  dealUrl: string;
  gameTitle: string;
  siteOrigin: string;
  storeID?: string | null;
  storeName?: string | null;
}) {
  const origin = params.siteOrigin.replace(/\/$/, "");
  const q = new URLSearchParams({
    to: params.dealUrl,
    gameTitle: params.gameTitle,
    source: "price_alert",
  });
  const storeId = params.storeID?.trim();
  const storeName = params.storeName?.trim();
  if (storeId) q.set("storeID", storeId);
  if (storeName) q.set("storeName", storeName);
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

export type PriceAlertEmailContentParams = {
  gameTitle: string;
  priceDisplay: string;
  storeName: string;
  matchedListing?: string;
  ctaUrl: string;
  dashboardUrl: string;
  unsubscribeUrl?: string | null;
  heroImageUrl?: string | null;
  supportEmail?: string;
  alertReason?: PriceAlertDecisionReason | string;
  /** Prior stored baseline (cron `lastKnownBefore`). */
  wasPriceNum?: number | null;
  /** Provider price at alert time. */
  nowPriceNum?: number | null;
  currency?: string | null;
};

export function buildAlertEmailText(params: PriceAlertEmailContentParams): string {
  const support = params.supportEmail ?? PRICE_ALERT_SUPPORT_EMAIL;
  const listingLine = params.matchedListing
    ? `Listing: ${params.matchedListing}`
    : "Listing verified through our pricing checks.";
  const contextLine = resolvePriceAlertContextLine(params);

  const lines = [
    "GamePing AI — Price drop",
    "",
    params.gameTitle,
    `Verified deal: ${params.priceDisplay}`,
    `Store: ${params.storeName}`,
    listingLine,
  ];

  if (contextLine) {
    lines.push(contextLine);
  }

  lines.push(
    "",
    `View verified deal: ${params.ctaUrl}`,
    "",
    "Price disclaimer: Prices can change quickly and may differ by region, platform, or store. Confirm the final price and availability on the store page before you buy.",
    "",
    "Why you received this: You turned on price tracking for this game on GamePing AI.",
    "",
    `Manage tracked games: ${params.dashboardUrl}`
  );

  if (params.unsubscribeUrl) {
    lines.push(`Stop alerts for this game: ${params.unsubscribeUrl}`);
  }

  lines.push(`Questions: ${support}`, "", "— GamePing AI");

  return lines.join("\n");
}

export function buildAlertEmailHtml(params: PriceAlertEmailContentParams): string {
  const support = escapeHtml(params.supportEmail ?? PRICE_ALERT_SUPPORT_EMAIL);
  const supportMailto = `mailto:${support}`;

  const img =
    params.heroImageUrl &&
    params.heroImageUrl.startsWith("http") &&
    !params.heroImageUrl.includes('"')
      ? `<div style="margin:16px 0;"><img src="${escapeHtml(params.heroImageUrl)}" alt="" width="560" style="max-width:100%;border-radius:12px;" /></div>`
      : "";

  const listingMeta = params.matchedListing
    ? `Listing: ${escapeHtml(params.matchedListing)}`
    : "Listing verified through our pricing checks";

  const unsubscribeBlock = params.unsubscribeUrl
    ? `<p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.5);"><a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#67e8f9;">Stop alerts for this game</a></p>`
    : "";

  const contextLine = resolvePriceAlertContextLine(params);
  const contextBlock = contextLine
    ? `<p style="margin:0 0 12px;font-size:14px;color:#a5f3fc;">${escapeHtml(contextLine)}</p>`
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
              <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Price drop</h1>
              <p style="margin:0 0 8px;font-size:16px;color:#fff;"><strong>${escapeHtml(params.gameTitle)}</strong></p>
              <p style="margin:0 0 6px;font-size:15px;color:#a5f3fc;">Verified deal: <strong>${escapeHtml(params.priceDisplay)}</strong></p>
              <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.45);">Store: ${escapeHtml(params.storeName)} · ${listingMeta}</p>
              ${contextBlock}
              ${img}
              <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#22d3ee;color:#03040a;font-weight:800;text-decoration:none;border-radius:999px;">View verified deal →</a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin-top:20px;">
          <tr>
            <td style="font-size:12px;line-height:1.55;color:rgba(255,255,255,0.45);">
              <p style="margin:0 0 10px;"><strong style="color:rgba(255,255,255,0.65);">Price disclaimer</strong><br />Prices can change quickly and may differ by region, platform, or store. Confirm the final price and availability on the store page before you buy. Deal links go through GamePing’s verified redirect.</p>
              <p style="margin:0 0 10px;"><strong style="color:rgba(255,255,255,0.65);">Why you received this</strong><br />You turned on price tracking for this game on GamePing AI.</p>
              <p style="margin:0 0 8px;"><a href="${escapeHtml(params.dashboardUrl)}" style="color:#67e8f9;">Open your dashboard</a> to manage tracked games.</p>
              ${unsubscribeBlock}
              <p style="margin:12px 0 0;">Questions? <a href="${supportMailto}" style="color:#67e8f9;">${support}</a></p>
            </td>
          </tr>
        </table>
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
