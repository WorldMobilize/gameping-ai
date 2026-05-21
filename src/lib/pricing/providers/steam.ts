import {
  evaluatePricingGate,
  pricingExplicitRejectionLabel,
  shouldLogPricingDetailDebug,
} from "@/lib/pricing/match";
import {
  resolveTrustedSteamAppId,
  type ResolvedTrustedSteamAppId,
} from "@/lib/pricing/steam-app-id";
import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";

const STEAM_APPDETAILS_URL = "https://store.steampowered.com/api/appdetails";
const STEAM_STORE_APP_URL = (appId: number) =>
  `https://store.steampowered.com/app/${appId}`;

const STEAM_FETCH_TIMEOUT_MS = 12_000;

type SteamPriceOverview = {
  currency?: string;
  initial?: number;
  final?: number;
  discount_percent?: number;
};

type SteamAppDetailsPayload = {
  success?: boolean;
  data?: {
    name?: string;
    is_free?: boolean;
    price_overview?: SteamPriceOverview;
  };
};

export type SteamAppDetailsQuote = {
  appId: number;
  name: string;
  isFree: boolean;
  currency: string;
  salePrice: string;
  normalPrice: string;
  discountPercent: number;
  storeUrl: string;
};

function formatSteamCents(cents: number): string {
  return (Math.max(0, cents) / 100).toFixed(2);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export async function steamFetchAppDetails(
  appId: number,
  cc = "US"
): Promise<SteamAppDetailsQuote | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STEAM_FETCH_TIMEOUT_MS);

  try {
    const url = `${STEAM_APPDETAILS_URL}?appids=${encodeURIComponent(
      String(appId)
    )}&cc=${encodeURIComponent(cc)}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;

    const json: unknown = await res.json();
    if (!isRecord(json)) return null;

    const bucket = json[String(appId)];
    if (!isRecord(bucket)) return null;

    const payload = bucket as SteamAppDetailsPayload;
    if (!payload.success || !isRecord(payload.data)) return null;

    const data = payload.data;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!name) return null;

    const storeUrl = STEAM_STORE_APP_URL(appId);
    const isFree = data.is_free === true;
    const overview = data.price_overview;

    if (isFree) {
      return {
        appId,
        name,
        isFree: true,
        currency: "USD",
        salePrice: "0.00",
        normalPrice: "0.00",
        discountPercent: 0,
        storeUrl,
      };
    }

    if (!overview || typeof overview.final !== "number") return null;

    const currency =
      typeof overview.currency === "string" && overview.currency.trim()
        ? overview.currency.trim()
        : "USD";
    const finalCents = overview.final;
    const initialCents =
      typeof overview.initial === "number" ? overview.initial : finalCents;
    const discountPercent =
      typeof overview.discount_percent === "number" ? overview.discount_percent : 0;

    if (finalCents < 0 || initialCents < 0) return null;

    return {
      appId,
      name,
      isFree: false,
      currency,
      salePrice: formatSteamCents(finalCents),
      normalPrice: formatSteamCents(initialCents),
      discountPercent,
      storeUrl,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function hasSteamStoreDealRow(deals: VerifiedDealRow[]): boolean {
  return deals.some((d) => {
    const storeName = (d.store.name ?? "").trim().toLowerCase();
    const storeId = d.store.id.trim().toLowerCase();
    return storeName === "steam" || storeId === "steam" || storeId === "1";
  });
}

export function buildVerifiedDealRowFromSteamQuote(params: {
  requestedTitle: string;
  quote: SteamAppDetailsQuote;
  resolved: ResolvedTrustedSteamAppId;
  debug?: boolean;
}): VerifiedDealRow | null {
  const { requestedTitle, quote, resolved } = params;
  const detailDebug = shouldLogPricingDetailDebug(params.debug);
  const dealUrl = quote.storeUrl;

  const gate = evaluatePricingGate({
    requestedTitle,
    matchedTitle: quote.name,
    dealUrl,
    provider: "steam",
  });

  if (detailDebug) {
    console.log("[pricing:aggregate-row]", {
      requestedTitle,
      provider: "steam",
      rawTitle: quote.name,
      matchedTitle: quote.name,
      store: "Steam",
      salePrice: quote.salePrice,
      normalPrice: quote.normalPrice,
      score: gate.score,
      accepted: gate.acceptedPrice,
      rejected: !gate.acceptedPrice,
      gateReason: gate.reason,
      explicitRejection:
        pricingExplicitRejectionLabel(gate) ?? (!gate.acceptedPrice ? gate.reason : null),
      hasUrl: Boolean(gate.trustedUrl),
      deduped: false,
      steamAppId: quote.appId,
      steamAppIdSource: resolved.source,
      steamIsFree: quote.isFree,
    });
  }

  if (!gate.acceptedPrice) return null;

  return {
    requestedTitle,
    matchedTitle: quote.name,
    provider: "steam",
    currency: quote.currency,
    store: { id: "steam", name: "Steam" },
    salePrice: quote.salePrice,
    normalPrice: quote.normalPrice,
    deal: {
      id: `steam-${quote.appId}`,
      url: gate.trustedUrl ? dealUrl : undefined,
    },
    gate: {
      score: gate.score,
      acceptedPrice: gate.acceptedPrice,
      trustedUrl: gate.trustedUrl,
      reason: gate.reason,
      requestedNorm: gate.requestedNorm,
      matchedNorm: gate.matchedNorm,
      isShortTitle: gate.isShortTitle,
    },
  };
}

export async function steamLookupVerifiedDealRow(params: {
  title: string;
  countryCode?: string;
  cheapsharkSteamAppId?: string | null;
  rawgStores?: unknown;
  steamAppIdHint?: number | string | null;
  debug?: boolean;
  debugLabel?: string;
}): Promise<VerifiedDealRow | null> {
  const requestedTitle = params.title.trim();
  if (!requestedTitle) return null;

  const resolved = resolveTrustedSteamAppId({
    title: requestedTitle,
    cheapsharkSteamAppId: params.cheapsharkSteamAppId,
    rawgStores: params.rawgStores,
    steamAppIdHint: params.steamAppIdHint,
  });

  if (!resolved) {
    if (shouldLogPricingDetailDebug(params.debug)) {
      console.log("[pricing:steam]", params.debugLabel ?? requestedTitle, {
        skipped: true,
        reason: "no_trusted_steam_app_id",
      });
    }
    return null;
  }

  const cc = (params.countryCode || "US").trim().toUpperCase() || "US";
  const quote = await steamFetchAppDetails(resolved.appId, cc);
  if (!quote) {
    if (shouldLogPricingDetailDebug(params.debug)) {
      console.log("[pricing:steam]", params.debugLabel ?? requestedTitle, {
        skipped: true,
        reason: "appdetails_unavailable",
        appId: resolved.appId,
        source: resolved.source,
      });
    }
    return null;
  }

  const row = buildVerifiedDealRowFromSteamQuote({
    requestedTitle,
    quote,
    resolved,
    debug: params.debug,
  });

  if (shouldLogPricingDetailDebug(params.debug)) {
    console.log("[pricing:steam]", params.debugLabel ?? requestedTitle, {
      ok: Boolean(row),
      appId: resolved.appId,
      source: resolved.source,
      isFree: quote.isFree,
      salePrice: quote.salePrice,
    });
  }

  return row;
}
