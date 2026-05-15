import {
  containsBadWords,
  evaluatePricingGate,
  pricingExplicitRejectionLabel,
  shouldLogPricingDetailDebug,
  titleMatchScore,
} from "@/lib/pricing/match";

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

/** Shared page size for /deals so best-price (needs up to 8) and deals list (5) share one HTTP response. */
const DEALS_FETCH_PAGE_SIZE = 8;

const DEALS_MEMO_TTL_MS = 25_000;
const dealsMemoByTitle = new Map<string, { deals: CheapSharkDeal[]; fetchedAt: number }>();
const dealsInflightByTitle = new Map<string, Promise<CheapSharkDeal[]>>();

function normalizeDealsMemoKey(title: string) {
  return title.trim().toLowerCase();
}

async function cheapSharkFetchDealsFromNetwork(params: {
  title: string;
  pageSize: number;
  debug: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDeal[]> {
  const { title, pageSize, debug, debugLabel } = params;
  const url = `https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(
    title
  )}&pageSize=${encodeURIComponent(String(pageSize))}&sortBy=Price`;

  try {
    const res1 = await fetch(url, { cache: "no-store" });
    let res = res1;
    let retried = false;
    if (res1.status === 429) {
      retried = true;
      await sleep(800);
      res = await fetch(url, { cache: "no-store" });
    }

    if (shouldLogPricingDetailDebug(debug)) {
      const evt: PricingDebugEvent = { type: "http", url, status: res.status, retried };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    const deals = Array.isArray(data) ? (data as CheapSharkDeal[]) : [];
    if (shouldLogPricingDetailDebug(debug)) {
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

async function cheapSharkGetDealsShared(params: {
  title: string;
  debug: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDeal[]> {
  const key = normalizeDealsMemoKey(params.title);
  if (!key) return [];

  const now = Date.now();
  const cached = dealsMemoByTitle.get(key);
  if (cached && now - cached.fetchedAt < DEALS_MEMO_TTL_MS) {
    return cached.deals;
  }

  let inflight = dealsInflightByTitle.get(key);
  if (!inflight) {
    inflight = cheapSharkFetchDealsFromNetwork({
      title: params.title.trim(),
      pageSize: DEALS_FETCH_PAGE_SIZE,
      debug: params.debug,
      debugLabel: params.debugLabel,
    }).then((deals) => {
      dealsMemoByTitle.set(key, { deals, fetchedAt: Date.now() });
      return deals;
    });
    dealsInflightByTitle.set(key, inflight);
    inflight.finally(() => {
      dealsInflightByTitle.delete(key);
    });
  }

  return inflight;
}

export async function cheapSharkLookupDealsByTitle(params: {
  title: string;
  limit?: number;
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDeal[]> {
  const { title, limit = 5, debug = false, debugLabel } = params;
  const lim = Math.max(3, Math.min(limit, 12));
  const all = await cheapSharkGetDealsShared({ title, debug, debugLabel });
  return all.slice(0, lim);
}

const STORES_MEMO_TTL_MS = 60_000;
let storesMemo: { stores: CheapSharkStoreInfo[]; fetchedAt: number } | null = null;
let storesInflight: Promise<CheapSharkStoreInfo[]> | null = null;

export async function cheapSharkGetStores(params?: {
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkStoreInfo[]> {
  const debug = params?.debug ?? false;
  const debugLabel = params?.debugLabel;
  const now = Date.now();
  if (storesMemo && now - storesMemo.fetchedAt < STORES_MEMO_TTL_MS) {
    return storesMemo.stores;
  }

  if (!storesInflight) {
    storesInflight = (async () => {
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
        if (shouldLogPricingDetailDebug(debug)) {
          const evt: PricingDebugEvent = { type: "http", url, status: res.status, retried };
          console.log("[pricing:cheapshark]", debugLabel ?? "stores", evt);
        }
        if (!res.ok) return [];
        const data = (await res.json()) as unknown;
        return Array.isArray(data) ? (data as CheapSharkStoreInfo[]) : [];
      } catch {
        return [];
      } finally {
        storesInflight = null;
      }
    })();
  }

  const stores = await storesInflight;
  storesMemo = { stores, fetchedAt: Date.now() };
  return stores;
}

export async function cheapSharkLookupBestPrice(params: {
  title: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkBestPrice | null> {
  const { title, debug = false, debugLabel } = params;
  const deals = await cheapSharkLookupDealsByTitle({
    title,
    limit: DEALS_FETCH_PAGE_SIZE,
    debug,
    debugLabel,
  });
  if (!deals.length) {
    if (shouldLogPricingDetailDebug(debug)) {
      const evt: PricingDebugEvent = { type: "result", ok: false, reason: "no_deals" };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    return null;
  }

  const detailDebug = shouldLogPricingDetailDebug(debug);

  // The /deals endpoint can return fuzzy matches for short/generic queries.
  // Keep only plausible matches and ignore low-quality entries.
  const scored: Array<{ deal: CheapSharkDeal; score: number }> = [];
  for (const d of deals) {
    if (!d || typeof d.title !== "string") {
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "cheapshark",
          rawTitle: "",
          matchedTitle: "",
          store: null,
          salePrice: null,
          normalPrice: null,
          score: 0,
          accepted: false,
          rejected: true,
          gateReason: "invalid_incomplete_row",
          explicitRejection: "invalid_pricing_row",
          hasUrl: false,
          deduped: false,
        });
      }
      continue;
    }

    const dealUrl = d.dealID ? `https://www.cheapshark.com/redirect?dealID=${d.dealID}` : "";
    const gate = evaluatePricingGate({
      requestedTitle: title,
      matchedTitle: d.title,
      dealUrl,
      provider: "cheapshark",
    });
    const matchScore = titleMatchScore(title, d.title);

    if (containsBadWords(d.title)) {
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "cheapshark",
          rawTitle: d.title,
          matchedTitle: d.title,
          store: d.storeID,
          salePrice: d.salePrice,
          normalPrice: d.normalPrice,
          score: gate.score,
          titleMatchScore: matchScore,
          accepted: false,
          rejected: true,
          gateReason: gate.reason,
          explicitRejection: "rejected_title_provider_bad_words",
          hasUrl: Boolean(gate.trustedUrl && d.dealID),
          deduped: false,
        });
      }
      continue;
    }
    if (matchScore < 0.68) {
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "cheapshark",
          rawTitle: d.title,
          matchedTitle: d.title,
          store: d.storeID,
          salePrice: d.salePrice,
          normalPrice: d.normalPrice,
          score: gate.score,
          titleMatchScore: matchScore,
          accepted: false,
          rejected: true,
          gateReason: gate.reason,
          explicitRejection: "rejected_title_provider_low_match_score",
          hasUrl: Boolean(gate.trustedUrl && d.dealID),
          deduped: false,
        });
      }
      continue;
    }

    if (detailDebug) {
      const accepted = gate.acceptedPrice;
      console.log("[pricing:aggregate-row]", {
        requestedTitle: title,
        provider: "cheapshark",
        rawTitle: d.title,
        matchedTitle: d.title,
        store: d.storeID,
        salePrice: d.salePrice,
        normalPrice: d.normalPrice,
        score: gate.score,
        titleMatchScore: matchScore,
        accepted,
        rejected: !accepted,
        gateReason: gate.reason,
        explicitRejection:
          pricingExplicitRejectionLabel(gate) ?? (!accepted ? gate.reason : null),
        hasUrl: Boolean(gate.trustedUrl && d.dealID),
        deduped: false,
      });
    }

    scored.push({ deal: d, score: matchScore });
  }
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]?.deal ?? null;
  if (!best) return null;

  if (detailDebug) {
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

