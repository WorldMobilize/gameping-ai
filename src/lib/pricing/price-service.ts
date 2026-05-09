import {
  cheapSharkGetStores,
  cheapSharkLookupBestPrice,
  cheapSharkLookupDealsByTitle,
  type CheapSharkBestPrice,
  type CheapSharkDeal,
  type CheapSharkStoreInfo,
} from "@/lib/pricing/providers/cheapshark";

export type BestPriceResult = {
  price: string; // numeric string
  provider: "cheapshark";
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

export async function lookupBestPrice(params: { title: string }): Promise<BestPriceResult | null> {
  const best = (await cheapSharkLookupBestPrice({ title: params.title })) as CheapSharkBestPrice | null;
  if (!best) return null;

  let storeName: string | undefined;
  if (best.storeId) {
    const stores = await cheapSharkGetStores();
    storeName = stores.find((s) => s.storeID === best.storeId)?.storeName;
  }

  return {
    price: best.price,
    provider: "cheapshark",
    store: {
      id: best.storeId,
      name: storeName,
    },
    deal: {
      id: best.dealId,
      url: best.dealUrl,
    },
    matchedTitle: best.matchedTitle,
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
}): Promise<DealRow[]> {
  const deals = (await cheapSharkLookupDealsByTitle({
    title: params.title,
    limit: params.limit ?? 5,
  })) as CheapSharkDeal[];

  if (!deals.length) return [];

  const stores = (await cheapSharkGetStores()) as CheapSharkStoreInfo[];
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

