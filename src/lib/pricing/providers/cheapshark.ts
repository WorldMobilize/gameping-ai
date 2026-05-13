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

type PricingDebugEvent =
  | {
      type: "http";
      url: string;
      status: number;
      retried: boolean;
    }
  | {
      type: "raw_deals";
      count: number;
      titles: string[];
    }
  | {
      type: "discard";
      title: string;
      reason: "bad_words" | "low_match_score";
      score?: number;
    }
  | {
      type: "selected";
      title: string;
      dealId?: string;
      storeId?: string;
      salePrice?: string;
      score: number;
    }
  | {
      type: "result";
      ok: boolean;
      reason?: string;
    };

export async function cheapSharkLookupDealsByTitle(params: {
  title: string;
  limit?: number;
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDeal[]> {
  const { title, limit = 5, debug = false, debugLabel } = params;
  const url = `https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(
    title
  )}&pageSize=${encodeURIComponent(String(limit))}&sortBy=Price`;

  try {
    const res1 = await fetch(url, { cache: "no-store" });
    let res = res1;
    let retried = false;
    if (res1.status === 429) {
      retried = true;
      await sleep(800);
      res = await fetch(url, { cache: "no-store" });
    }

    if (debug) {
      const evt: PricingDebugEvent = { type: "http", url, status: res.status, retried };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    const deals = Array.isArray(data) ? (data as CheapSharkDeal[]) : [];
    if (debug) {
      const titles = deals
        .map((d) => (d && typeof d.title === "string" ? d.title : ""))
        .filter(Boolean)
        .slice(0, 12);
      const evt: PricingDebugEvent = { type: "raw_deals", count: deals.length, titles };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    return deals;
  } catch {
    return [];
  }
}

export async function cheapSharkGetStores(params?: {
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkStoreInfo[]> {
  const debug = params?.debug ?? false;
  const debugLabel = params?.debugLabel;
  try {
    const url = "https://www.cheapshark.com/api/1.0/stores";
    const res1 = await fetch(url, { cache: "no-store" });
    let res = res1;
    let retried = false;
    if (res1.status === 429) {
      retried = true;
      await sleep(800);
      res = await fetch(url, { cache: "no-store" });
    }
    if (debug) {
      const evt: PricingDebugEvent = { type: "http", url, status: res.status, retried };
      console.log("[pricing:cheapshark]", debugLabel ?? "stores", evt);
    }
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as CheapSharkStoreInfo[]) : [];
  } catch {
    return [];
  }
}

export async function cheapSharkLookupBestPrice(params: {
  title: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkBestPrice | null> {
  const { title, debug = false, debugLabel } = params;
  const deals = await cheapSharkLookupDealsByTitle({ title, limit: 8, debug, debugLabel });
  if (!deals.length) {
    if (debug) {
      const evt: PricingDebugEvent = { type: "result", ok: false, reason: "no_deals" };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    return null;
  }

  // The /deals endpoint can return fuzzy matches for short/generic queries.
  // Keep only plausible matches and ignore low-quality entries.
  const scored: Array<{ deal: CheapSharkDeal; score: number }> = [];
  for (const d of deals) {
    if (!d || typeof d.title !== "string") continue;
    if (containsBadWords(d.title)) {
      if (debug) {
        const evt: PricingDebugEvent = { type: "discard", title: d.title, reason: "bad_words" };
        console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
      }
      continue;
    }
    const score = titleMatchScore(title, d.title);
    if (score < 0.68) {
      if (debug) {
        const evt: PricingDebugEvent = { type: "discard", title: d.title, reason: "low_match_score", score };
        console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
      }
      continue;
    }
    scored.push({ deal: d, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]?.deal ?? null;
  if (!best) return null;

  if (debug) {
    const bestScore = scored[0]?.score ?? 0;
    const evt: PricingDebugEvent = {
      type: "selected",
      title: best.title,
      dealId: best.dealID,
      storeId: best.storeID,
      salePrice: best.salePrice,
      score: bestScore,
    };
    console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    console.log("[pricing:cheapshark]", debugLabel ?? title, { type: "result", ok: true } satisfies PricingDebugEvent);
  }

  return {
    provider: "cheapshark",
    price: best.salePrice,
    storeId: best.storeID,
    dealId: best.dealID,
    dealUrl: best.dealID ? `https://www.cheapshark.com/redirect?dealID=${best.dealID}` : undefined,
    matchedTitle: best.title,
  };
}

