import {
  cheapSharkGetStores,
  cheapSharkLookupBestPrice,
  cheapSharkLookupDealsByTitle,
  type CheapSharkBestPrice,
  type CheapSharkDeal,
  type CheapSharkStoreInfo,
} from "@/lib/pricing/providers/cheapshark";
import { itadLookupBestPrice } from "@/lib/pricing/providers/isthereanydeal";

export type BestPriceResult = {
  price: string; // numeric string
  provider: "cheapshark" | "itad";
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

export async function lookupBestPrice(params: {
  title: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<BestPriceResult | null> {
  const debug = params.debug ?? false;

  const bestCheap = (await cheapSharkLookupBestPrice({
    title: params.title,
    debug,
    debugLabel: params.debugLabel,
  })) as CheapSharkBestPrice | null;

  if (bestCheap) {
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

    return {
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
  }

  // Fallback: ITAD (only if CheapShark returned null / no match / rate limited / failed).
  const bestItad = await itadLookupBestPrice({
    title: params.title,
    country: "US",
    debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:itad` : undefined,
  });
  if (!bestItad) return null;

  return {
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

