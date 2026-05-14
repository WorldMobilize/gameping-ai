import {
  cheapSharkGetStores,
  cheapSharkLookupBestPrice,
  cheapSharkLookupDealsByTitle,
  type CheapSharkBestPrice,
  type CheapSharkDeal,
  type CheapSharkStoreInfo,
} from "@/lib/pricing/providers/cheapshark";
import { itadLookupBestPrice } from "@/lib/pricing/providers/isthereanydeal";
import { evaluatePricingGate } from "@/lib/pricing/match";
import { getCachedPriceQuote, setCachedPriceQuote } from "@/lib/pricing/price-cache";

function isDevPricingLog() {
  return process.env.NODE_ENV === "development";
}

function shouldLogPricingDetail(debug: boolean) {
  return isDevPricingLog() || debug;
}

function logPricingUnavailableSummary(params: {
  debug: boolean;
  requestedTitle: string;
  stage: string;
  provider?: string | null;
  matchedTitle?: string | null;
  dealUrl?: string | null;
  extra?: Record<string, unknown>;
}) {
  if (!shouldLogPricingDetail(params.debug)) return;
  let gateScore: number | null = null;
  let gateReason: string | null = null;
  const mt = (params.matchedTitle ?? "").trim();
  if (mt) {
    const g = evaluatePricingGate({
      requestedTitle: params.requestedTitle,
      matchedTitle: mt,
      dealUrl: params.dealUrl ?? null,
      provider: params.provider ?? null,
    });
    gateScore = g.score;
    gateReason = g.reason;
  }
  console.log("[pricing:unavailable-summary]", {
    requestedTitle: params.requestedTitle,
    stage: params.stage,
    providerAttempted: params.provider ?? null,
    bestMatchedTitle: mt || null,
    gateScore,
    gateReason,
    ...params.extra,
  });
}

/**
 * Pricing gate: short titles require exact normalized match for any price; URLs only when exact + row URL.
 */
function gatePricingByTitleMatch(
  requestedTitle: string,
  raw: BestPriceResult,
  provider: string
): BestPriceResult | null {
  const mt = (raw.matchedTitle ?? "").trim();
  if (!mt) {
    if (isDevPricingLog()) {
      console.log("[pricing:match-check]", {
        requestedTitle,
        matchedTitle: "",
        requestedNorm: "",
        matchedNorm: "",
        score: 0,
        provider,
        isShortTitle: false,
        acceptedPrice: false,
        trustedUrl: false,
        reason: "missing_matched_title",
      });
    }
    return null;
  }

  const gate = evaluatePricingGate({
    requestedTitle,
    matchedTitle: mt,
    dealUrl: raw.deal?.url,
    provider,
  });

  if (isDevPricingLog()) {
    console.log("[pricing:match-check]", {
      requestedTitle,
      matchedTitle: mt,
      requestedNorm: gate.requestedNorm,
      matchedNorm: gate.matchedNorm,
      score: gate.score,
      provider,
      isShortTitle: gate.isShortTitle,
      acceptedPrice: gate.acceptedPrice,
      trustedUrl: gate.trustedUrl,
      reason: gate.reason,
    });
  }

  if (!gate.acceptedPrice) {
    return null;
  }

  const deal = gate.trustedUrl
    ? raw.deal
    : { id: raw.deal?.id, url: undefined };

  if (isDevPricingLog()) {
    console.log("[pricing:accept]", {
      requestedTitle,
      matchedTitle: mt,
      score: gate.score,
      provider,
      url: deal?.url ?? null,
    });
  }

  return {
    ...raw,
    deal,
    matchedTitle: mt,
  };
}

export type BestPriceResult = {
  price: string; // numeric string
  provider: "cheapshark" | "itad" | "free_to_play";
  /** ISO-ish currency code when known (aggregators often USD). */
  currency?: string | null;
  store?: {
    id?: string;
    name?: string;
  };
  deal?: {
    id?: string;
    url?: string;
  };
  matchedTitle?: string;
};

function normalizeTitleKey(title: string) {
  return (title || "").trim().toLowerCase();
}

const FREE_TO_PLAY_TITLES = new Set(
  [
    "League of Legends",
    "Dota 2",
    "Valorant",
    "Apex Legends",
    "Counter-Strike 2",
    "Counter-Strike: Global Offensive",
    "Fortnite",
    "Rocket League",
    "Team Fortress 2",
    "Warframe",
    "Path of Exile",
    "Paladins",
  ].map(normalizeTitleKey)
);

function isKnownFreeToPlayTitle(title: string) {
  const key = normalizeTitleKey(title);
  return FREE_TO_PLAY_TITLES.has(key);
}

export async function lookupBestPrice(params: {
  title: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<BestPriceResult | null> {
  const debug = params.debug ?? false;

  // Free-to-play guardrail: do not accidentally attach prices from spinoffs/editions.
  // Also bypass cache to avoid serving stale/incorrect paid prices for known F2P titles.
  if (isKnownFreeToPlayTitle(params.title)) {
    const mapped: BestPriceResult = {
      price: "Free",
      provider: "free_to_play",
      currency: null,
      matchedTitle: params.title,
      deal: { id: undefined, url: undefined },
      store: { id: undefined, name: undefined },
    };
    const gated = gatePricingByTitleMatch(params.title, mapped, "free_to_play");
    const out = gated ?? mapped;
    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        provider_used: "free_to_play",
        returningToPage: out,
      });
    }
    return out;
  }

  const cache = await getCachedPriceQuote({ title: params.title });
  if (debug) {
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      cache_hit: cache.hit,
      cache_expired: cache.expired,
      cached_provider: cache.row?.provider ?? null,
    });
  }

  if (cache.hit && cache.row && typeof cache.row.price === "number") {
    const cachedRaw: BestPriceResult = {
      price: cache.row.price.toFixed(2),
      provider: cache.row.provider === "itad" ? "itad" : "cheapshark",
      currency: cache.row.currency ?? "USD",
      store: {
        id: undefined,
        name: cache.row.store_name ?? undefined,
      },
      deal: {
        id: undefined,
        url: cache.row.deal_url ?? undefined,
      },
      matchedTitle: cache.row.matched_title ?? undefined,
    };
    const gated = gatePricingByTitleMatch(
      params.title,
      cachedRaw,
      `cache:${cache.row.provider ?? "unknown"}`
    );
    if (gated) {
      if (debug) {
        console.log("[pricing:service]", params.debugLabel ?? params.title, {
          provider_used: "cache",
          returningToPage: gated,
        });
      }
      return gated;
    }
    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        event: "cache_title_gate_rejected_fresh_lookup",
        requested: params.title,
      });
    }
  }

  const bestCheap = (await cheapSharkLookupBestPrice({
    title: params.title,
    debug,
    debugLabel: params.debugLabel,
  })) as CheapSharkBestPrice | null;

  const cheapMatchedTitle =
    bestCheap && typeof bestCheap.matchedTitle === "string"
      ? bestCheap.matchedTitle.trim()
      : "";
  const cheapPriceRaw =
    bestCheap && typeof bestCheap.price === "string" ? bestCheap.price.trim() : "";
  const cheapPriceNum = cheapPriceRaw ? Number(cheapPriceRaw) : NaN;
  const cheapHasValidPrice = Number.isFinite(cheapPriceNum) && cheapPriceNum > 0;
  const cheapHasValidMatch = Boolean(cheapMatchedTitle);

  // If CheapShark returns an object but without a usable price/title, treat it as invalid
  // so fallback providers (e.g. ITAD) can run.
  const cheapIsValid = Boolean(bestCheap) && cheapHasValidPrice && cheapHasValidMatch;

  if (bestCheap && !cheapIsValid) {
    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        event: "cheapshark_result_invalid_fallback_itad",
        reasons: [
          ...(cheapHasValidPrice ? [] : ["missing_or_invalid_price"]),
          ...(cheapHasValidMatch ? [] : ["missing_matchedTitle"]),
        ],
        cheapshark: {
          price: bestCheap.price ?? null,
          matchedTitle: bestCheap.matchedTitle ?? null,
          dealId: bestCheap.dealId ?? null,
          storeId: bestCheap.storeId ?? null,
          hasDealUrl: Boolean(bestCheap.dealUrl),
        },
      });
    }
  }

  if (cheapIsValid && bestCheap) {
    let storeName: string | undefined;
    if (bestCheap.storeId) {
      const stores = await cheapSharkGetStores({
        debug,
        debugLabel: params.debugLabel ? `${params.debugLabel}:stores` : undefined,
      });
      storeName = stores.find((s) => s.storeID === bestCheap.storeId)?.storeName;
    }

    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        provider_used: "cheapshark",
        provider: "cheapshark",
        selected: {
          matchedTitle: bestCheap.matchedTitle,
          dealId: bestCheap.dealId,
          storeId: bestCheap.storeId,
          storeName: storeName ?? null,
          price: bestCheap.price,
        },
      });
    }

    const mappedRaw: BestPriceResult = {
      price: bestCheap.price,
      provider: "cheapshark",
      currency: "USD",
      store: {
        id: bestCheap.storeId,
        name: storeName,
      },
      deal: {
        id: bestCheap.dealId,
        url: bestCheap.dealUrl,
      },
      matchedTitle: bestCheap.matchedTitle,
    };

    const gatedCheap = gatePricingByTitleMatch(params.title, mappedRaw, "cheapshark");
    if (gatedCheap) {
      const savedToCache = await setCachedPriceQuote({
        title: params.title,
        provider: "cheapshark",
        matchedTitle: bestCheap.matchedTitle ?? null,
        price: Number(bestCheap.price),
        currency: "USD",
        storeName: storeName ?? null,
        dealUrl: gatedCheap.deal?.url ?? null,
        rawPayload: debug ? bestCheap : null,
      });

      if (debug) {
        console.log("[pricing:service]", params.debugLabel ?? params.title, {
          saved_to_cache: savedToCache,
        });
      }

      return gatedCheap;
    }
    logPricingUnavailableSummary({
      debug,
      requestedTitle: params.title,
      stage: "cheapshark_gate_reject",
      provider: "cheapshark",
      matchedTitle: cheapMatchedTitle,
      dealUrl: bestCheap.dealUrl ?? null,
    });
  }

  // Fallback: ITAD (only if CheapShark returned null / no match / rate limited / failed).
  const bestItad = await itadLookupBestPrice({
    title: params.title,
    country: "US",
    debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:itad` : undefined,
  });
  if (!bestItad) {
    logPricingUnavailableSummary({
      debug,
      requestedTitle: params.title,
      stage: "itad_no_match_or_error",
      provider: "itad",
      matchedTitle: null,
      extra: {
        hadCheapsharkCandidate: Boolean(bestCheap),
        cheapsharkMatchedTitle: cheapMatchedTitle || null,
        cheapsharkWasValidPrice: cheapIsValid,
      },
    });
    return null;
  }

  if (debug) {
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      provider: "itad",
      receivedFromItad: bestItad,
    });
  }

  const mappedRaw: BestPriceResult = {
    price: bestItad.price,
    provider: "itad",
    currency: "USD",
    store: {
      id: bestItad.storeId,
      name: bestItad.storeName,
    },
    deal: {
      id: undefined,
      url: bestItad.dealUrl,
    },
    matchedTitle: bestItad.matchedTitle,
  };

  const gatedItad = gatePricingByTitleMatch(params.title, mappedRaw, "itad");
  if (!gatedItad) {
    logPricingUnavailableSummary({
      debug,
      requestedTitle: params.title,
      stage: "itad_gate_reject",
      provider: "itad",
      matchedTitle: bestItad.matchedTitle ?? null,
      dealUrl: bestItad.dealUrl ?? null,
    });
    return null;
  }

  const savedToCache = await setCachedPriceQuote({
    title: params.title,
    provider: "itad",
    matchedTitle: bestItad.matchedTitle ?? null,
    price: Number(bestItad.price),
    currency: "USD",
    storeName: bestItad.storeName ?? null,
    dealUrl: gatedItad.deal?.url ?? null,
    rawPayload: debug ? bestItad : null,
  });

  if (debug) {
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      provider_used: "itad",
      provider: "itad",
      returningToPage: gatedItad,
    });
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      saved_to_cache: savedToCache,
    });
  }

  return gatedItad;
}

export type VerifiedDealRow = {
  requestedTitle: string;
  matchedTitle: string;
  provider: "cheapshark";
  currency: string;
  store: { id: string; name?: string };
  salePrice: string;
  normalPrice: string;
  deal: { id: string; url?: string };
  gate: {
    score: number;
    acceptedPrice: boolean;
    trustedUrl: boolean;
    reason: string;
    requestedNorm: string;
    matchedNorm: string;
    isShortTitle: boolean;
  };
};

/** @deprecated use VerifiedDealRow */
export type DealRow = VerifiedDealRow;

function parseVerifiedDealSalePrice(deal: VerifiedDealRow): number {
  const n = Number(String(deal.salePrice).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/** Dedupe rows that CheapShark may repeat (same store + listing + sale price). */
export function dedupeVerifiedDealsForDisplay(deals: VerifiedDealRow[]): VerifiedDealRow[] {
  const seen = new Set<string>();
  const out: VerifiedDealRow[] = [];
  for (const d of deals) {
    const k = `${d.store.id}|${d.matchedTitle.trim().toLowerCase()}|${String(d.salePrice).trim()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
  }
  return out;
}

/** Ascending sale price; invalid prices sort last. */
export function sortVerifiedDealsBySalePriceAsc(deals: VerifiedDealRow[]): VerifiedDealRow[] {
  return [...deals].sort((a, b) => {
    const na = parseVerifiedDealSalePrice(a);
    const nb = parseVerifiedDealSalePrice(b);
    const aOk = !Number.isNaN(na);
    const bOk = !Number.isNaN(nb);
    if (aOk && bOk && na !== nb) return na - nb;
    if (aOk !== bOk) return aOk ? -1 : 1;
    return (a.store.name || "").localeCompare(b.store.name || "", "en", { sensitivity: "base" });
  });
}

export function prepareVerifiedDealsForDisplay(deals: VerifiedDealRow[]): VerifiedDealRow[] {
  return dedupeVerifiedDealsForDisplay(sortVerifiedDealsBySalePriceAsc(deals));
}

/** Cheapest gate-accepted row that also has a trusted store URL (CheapShark redirect). */
export function pickCheapestTrustedVerifiedDeal(deals: VerifiedDealRow[]): VerifiedDealRow | null {
  const trusted = deals.filter((d) => Boolean(d.deal.url) && !Number.isNaN(parseVerifiedDealSalePrice(d)));
  if (!trusted.length) return null;
  return trusted.reduce((best, cur) =>
    parseVerifiedDealSalePrice(cur) < parseVerifiedDealSalePrice(best) ? cur : best
  );
}

export async function lookupDeals(params: {
  title: string;
  limit?: number;
  debug?: boolean;
  debugLabel?: string;
}): Promise<VerifiedDealRow[]> {
  const requestedTitle = params.title.trim();
  const deals = (await cheapSharkLookupDealsByTitle({
    title: params.title,
    limit: params.limit ?? 8,
    debug: params.debug,
    debugLabel: params.debugLabel,
  })) as CheapSharkDeal[];

  if (!deals.length) {
    if (isDevPricingLog()) {
      console.log("[pricing:deals-summary]", {
        requestedTitle,
        totalDeals: 0,
        acceptedDeals: 0,
        rejectedDeals: 0,
      });
    }
    return [];
  }

  const stores = (await cheapSharkGetStores({
    debug: params.debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:stores` : undefined,
  })) as CheapSharkStoreInfo[];
  const storeNameById = new Map(stores.map((s) => [s.storeID, s.storeName]));

  const out: VerifiedDealRow[] = [];
  let rejectedDeals = 0;

  for (const d of deals) {
    if (!d?.dealID || !d.storeID || typeof d.title !== "string") {
      rejectedDeals += 1;
      continue;
    }

    const matchedTitle = d.title.trim();
    const dealUrl = `https://www.cheapshark.com/redirect?dealID=${d.dealID}`;
    const gate = evaluatePricingGate({
      requestedTitle,
      matchedTitle,
      dealUrl,
      provider: "cheapshark",
    });

    if (isDevPricingLog()) {
      console.log("[pricing:deal-gate]", {
        requestedTitle,
        matchedTitle,
        provider: "cheapshark",
        price: d.salePrice,
        currency: "USD",
        score: gate.score,
        acceptedPrice: gate.acceptedPrice,
        trustedUrl: gate.trustedUrl,
        reason: gate.reason,
        url: gate.trustedUrl ? dealUrl : null,
      });
    }

    if (!gate.acceptedPrice) {
      rejectedDeals += 1;
      continue;
    }

    out.push({
      requestedTitle,
      matchedTitle,
      provider: "cheapshark",
      currency: "USD",
      store: { id: d.storeID, name: storeNameById.get(d.storeID) },
      salePrice: d.salePrice,
      normalPrice: d.normalPrice,
      deal: {
        id: d.dealID,
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
    });
  }

  if (isDevPricingLog()) {
    console.log("[pricing:deals-summary]", {
      requestedTitle,
      totalDeals: deals.length,
      acceptedDeals: out.length,
      rejectedDeals,
    });
  }

  return prepareVerifiedDealsForDisplay(out);
}

