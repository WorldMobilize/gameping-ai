import { containsBadWords, titleMatchScore } from "@/lib/pricing/match";

type ItadSearchResult = {
  id?: unknown;
  title?: unknown;
  slug?: unknown;
  type?: unknown; // "game" | "dlc" | ...
};

type ItadPriceAmount = {
  amount?: unknown;
  currency?: unknown;
};

type ItadShop = {
  id?: unknown;
  name?: unknown;
};

type ItadDeal = {
  shop?: unknown;
  price?: unknown;
  url?: unknown;
};

type ItadPricesRow = {
  id?: unknown;
  deals?: unknown;
};

export type ItadBestPrice = {
  provider: "itad";
  price: string; // "12.34"
  storeId?: string;
  storeName?: string;
  dealUrl?: string;
  matchedTitle?: string;
  reason?: string;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function formatAmount2(amount: number) {
  // Always show 2 decimals to match UI expectations.
  return amount.toFixed(2);
}

async function fetchWith429Retry(url: string, init?: RequestInit) {
  const res1 = await fetch(url, init);
  if (res1.status !== 429) return { res: res1, retried: false };
  await sleep(800);
  const res2 = await fetch(url, init);
  return { res: res2, retried: true };
}

export async function itadLookupBestPrice(params: {
  title: string;
  country?: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<ItadBestPrice | null> {
  const { title, debug = false, debugLabel } = params;
  const apiKey = process.env.ITAD_API_KEY;
  if (!apiKey || typeof apiKey !== "string") {
    if (debug) {
      console.log("[pricing:itad]", debugLabel ?? title, {
        step: "env",
        ok: false,
        reason: "missing_ITAD_API_KEY",
      });
    }
    return null;
  }

  const country = params.country || "US";

  // 1) Search for best matching game id by title.
  const searchUrl = `https://api.isthereanydeal.com/games/search/v1?key=${encodeURIComponent(
    apiKey
  )}&title=${encodeURIComponent(title)}&results=20`;

  const searchFetch = await fetchWith429Retry(searchUrl, { cache: "no-store" });
  if (debug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "search",
      status: searchFetch.res.status,
      retried: searchFetch.retried,
    });
  }

  if (!searchFetch.res.ok) {
    return null;
  }

  const searchJson = (await searchFetch.res.json()) as unknown;
  const results: ItadSearchResult[] = Array.isArray(searchJson)
    ? (searchJson as ItadSearchResult[])
    : [];

  if (debug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "search_results",
      count: results.length,
      titles: results
        .map((r) => (typeof r?.title === "string" ? r.title : ""))
        .filter(Boolean)
        .slice(0, 12),
    });
  }

  type Scored = {
    id: string;
    matchedTitle: string;
    type: string;
    score: number;
  };

  const scored: Scored[] = [];
  for (const r of results) {
    const id = typeof r?.id === "string" ? r.id : "";
    const t = typeof r?.title === "string" ? r.title : "";
    const typ = typeof r?.type === "string" ? r.type : "";
    if (!id || !t) continue;

    // Prefer base games.
    if (typ && typ !== "game") continue;

    // Avoid obviously low-quality entries.
    if (containsBadWords(t)) continue;

    const score = titleMatchScore(title, t);
    scored.push({ id, matchedTitle: t, type: typ || "game", score });
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Strict threshold: better null than wrong price.
  if (!best || best.score < 0.72) {
    if (debug) {
      console.log("[pricing:itad]", debugLabel ?? title, {
        step: "select",
        ok: false,
        reason: best ? `low_match_score_${best.score.toFixed(2)}` : "no_game_match",
      });
    }
    return null;
  }

  if (debug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "select",
      ok: true,
      matchedTitle: best.matchedTitle,
      score: best.score,
    });
  }

  // 2) Fetch prices.
  const pricesUrl = `https://api.isthereanydeal.com/games/prices/v3?key=${encodeURIComponent(
    apiKey
  )}&country=${encodeURIComponent(country)}&deals=true&capacity=1`;

  const pricesFetch = await fetchWith429Retry(pricesUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify([best.id]),
  });

  if (debug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "prices",
      status: pricesFetch.res.status,
      retried: pricesFetch.retried,
    });
  }

  if (!pricesFetch.res.ok) {
    return null;
  }

  const pricesJson = (await pricesFetch.res.json()) as unknown;
  if (debug) {
    let preview: string;
    try {
      preview = JSON.stringify(pricesJson);
    } catch {
      preview = String(pricesJson);
    }
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "prices_raw_preview",
      preview: preview.slice(0, 1200),
      truncated: preview.length > 1200,
    });
  }
  const rows: ItadPricesRow[] = Array.isArray(pricesJson)
    ? (pricesJson as ItadPricesRow[])
    : [];

  const row = rows.find((r) => typeof r?.id === "string" && r.id === best.id) ?? rows[0];
  const deals = row && Array.isArray(row.deals) ? (row.deals as ItadDeal[]) : [];
  const first = deals[0];

  const shop = (first?.shop ?? null) as ItadShop | null;
  const price = (first?.price ?? null) as ItadPriceAmount | null;
  const url = typeof first?.url === "string" && first.url.trim() ? first.url.trim() : undefined;

  if (debug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "selected_deal",
      dealsCount: deals.length,
      selected: {
        shop: shop
          ? {
              id:
                typeof shop.id === "number" || typeof shop.id === "string"
                  ? String(shop.id)
                  : null,
              name: typeof shop.name === "string" ? shop.name : null,
            }
          : null,
        price: price
          ? {
              amount: typeof price.amount === "number" ? price.amount : price.amount ?? null,
              amountType: typeof price.amount,
              currency: typeof price.currency === "string" ? price.currency : null,
            }
          : null,
        url: url ?? null,
      },
    });
  }

  const amountRaw = price && typeof price.amount === "number" ? price.amount : NaN;
  const amount = Number.isFinite(amountRaw) ? amountRaw : NaN;
  if (!Number.isFinite(amount)) {
    if (debug) {
      console.log("[pricing:itad]", debugLabel ?? title, {
        step: "prices_parse",
        ok: false,
        reason: "no_price_amount",
      });
    }
    return null;
  }

  const storeId =
    shop && (typeof shop.id === "number" || typeof shop.id === "string")
      ? String(shop.id)
      : undefined;
  const storeName = shop && typeof shop.name === "string" ? shop.name : undefined;

  const mapped: ItadBestPrice = {
    provider: "itad",
    price: formatAmount2(amount),
    storeId,
    storeName,
    dealUrl: url,
    matchedTitle: best.matchedTitle,
  };

  if (debug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "result",
      ok: true,
      mapped,
    });
  }

  return mapped;
}

