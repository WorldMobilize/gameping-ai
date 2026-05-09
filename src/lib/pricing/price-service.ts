import {
  cheapSharkGetStores,
  cheapSharkLookupBestPrice,
  cheapSharkLookupDealsByTitle,
  type CheapSharkBestPrice,
  type CheapSharkDeal,
  type CheapSharkStoreInfo,
} from "@/lib/pricing/providers/cheapshark";
import { itadLookupBestPrice } from "@/lib/pricing/providers/isthereanydeal";
import { getCachedPriceQuote, setCachedPriceQuote } from "@/lib/pricing/price-cache";

export type BestPriceResult = {
  price: string; // numeric string
  provider: "cheapshark" | "itad" | "free_to_play";
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
      matchedTitle: params.title,
      deal: { id: undefined, url: undefined },
      store: { id: undefined, name: undefined },
    };
    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        provider_used: "free_to_play",
        returningToPage: mapped,
      });
    }
    return mapped;
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
    const cached: BestPriceResult = {
      price: cache.row.price.toFixed(2),
      provider: cache.row.provider === "itad" ? "itad" : "cheapshark",
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
    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        provider_used: "cache",
        returningToPage: cached,
      });
    }
    return cached;
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

    const mapped: BestPriceResult = {
      price: bestCheap.price,
      provider: "cheapshark",
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

    const savedToCache = await setCachedPriceQuote({
      title: params.title,
      provider: "cheapshark",
      matchedTitle: bestCheap.matchedTitle ?? null,
      price: Number(bestCheap.price),
      currency: "USD",
      storeName: storeName ?? null,
      dealUrl: bestCheap.dealUrl ?? null,
      rawPayload: debug ? bestCheap : null,
    });

    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        saved_to_cache: savedToCache,
      });
    }

    return mapped;
  }

  // Fallback: ITAD (only if CheapShark returned null / no match / rate limited / failed).
  const bestItad = await itadLookupBestPrice({
    title: params.title,
    country: "US",
    debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:itad` : undefined,
  });
  if (!bestItad) return null;

  if (debug) {
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      provider: "itad",
      receivedFromItad: bestItad,
    });
  }

  const mapped: BestPriceResult = {
    price: bestItad.price,
    provider: "itad",
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

  const savedToCache = await setCachedPriceQuote({
    title: params.title,
    provider: "itad",
    matchedTitle: bestItad.matchedTitle ?? null,
    price: Number(bestItad.price),
    currency: "USD",
    storeName: bestItad.storeName ?? null,
    dealUrl: bestItad.dealUrl ?? null,
    rawPayload: debug ? bestItad : null,
  });

  if (debug) {
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      provider_used: "itad",
      provider: "itad",
      returningToPage: mapped,
    });
    console.log("[pricing:service]", params.debugLabel ?? params.title, {
      saved_to_cache: savedToCache,
    });
  }

  return mapped;
}

export type DealRow = {
  provider: "cheapshark";
  store: { id: string; name?: string };
  salePrice: string;
  normalPrice: string;
  deal: { id: string; url: string };
};

export async function lookupDeals(params: {
  title: string;
  limit?: number;
  debug?: boolean;
  debugLabel?: string;
}): Promise<DealRow[]> {
  const deals = (await cheapSharkLookupDealsByTitle({
    title: params.title,
    limit: params.limit ?? 5,
    debug: params.debug,
    debugLabel: params.debugLabel,
  })) as CheapSharkDeal[];

  if (!deals.length) return [];

  const stores = (await cheapSharkGetStores({
    debug: params.debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:stores` : undefined,
  })) as CheapSharkStoreInfo[];
  const storeNameById = new Map(stores.map((s) => [s.storeID, s.storeName]));

  return deals
    .filter((d) => d?.dealID && d?.storeID)
    .map((d) => ({
      provider: "cheapshark" as const,
      store: { id: d.storeID, name: storeNameById.get(d.storeID) },
      salePrice: d.salePrice,
      normalPrice: d.normalPrice,
      deal: {
        id: d.dealID,
        url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
      },
    }));
}

