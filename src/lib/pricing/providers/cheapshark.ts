import { containsBadWords, titleMatchScore } from "@/lib/pricing/match";

export type CheapSharkDeal = {
  dealID: string;
  storeID: string;
  title: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
};

export type CheapSharkStoreInfo = {
  storeID: string;
  storeName: string;
};

export type CheapSharkBestPrice = {
  provider: "cheapshark";
  price: string; // numeric string (e.g. "9.99")
  storeId?: string;
  storeName?: string;
  dealId?: string;
  dealUrl?: string;
  matchedTitle?: string;
  reason?: string;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchWith429Retry(url: string, init?: RequestInit) {
  const res1 = await fetch(url, init);
  if (res1.status !== 429) return res1;
  await sleep(800);
  return fetch(url, init);
}

export async function cheapSharkLookupDealsByTitle(params: {
  title: string;
  limit?: number;
}): Promise<CheapSharkDeal[]> {
  const { title, limit = 5 } = params;
  const url = `https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(
    title
  )}&pageSize=${encodeURIComponent(String(limit))}&sortBy=Price`;

  try {
    const res = await fetchWith429Retry(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as CheapSharkDeal[]) : [];
  } catch {
    return [];
  }
}

export async function cheapSharkGetStores(): Promise<CheapSharkStoreInfo[]> {
  try {
    const res = await fetchWith429Retry("https://www.cheapshark.com/api/1.0/stores", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as CheapSharkStoreInfo[]) : [];
  } catch {
    return [];
  }
}

export async function cheapSharkLookupBestPrice(params: {
  title: string;
}): Promise<CheapSharkBestPrice | null> {
  const { title } = params;
  const deals = await cheapSharkLookupDealsByTitle({ title, limit: 8 });
  if (!deals.length) {
    return null;
  }

  // The /deals endpoint can return fuzzy matches for short/generic queries.
  // Keep only plausible matches and ignore low-quality entries.
  const scored = deals
    .filter((d) => d && typeof d.title === "string" && !containsBadWords(d.title))
    .map((d) => ({
      deal: d,
      score: titleMatchScore(title, d.title),
    }))
    .filter((x) => x.score >= 0.62)
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.deal ?? null;
  if (!best) return null;

  return {
    provider: "cheapshark",
    price: best.salePrice,
    storeId: best.storeID,
    dealId: best.dealID,
    dealUrl: best.dealID ? `https://www.cheapshark.com/redirect?dealID=${best.dealID}` : undefined,
    matchedTitle: best.title,
  };
}

