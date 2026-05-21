import {
  containsBadWords,
  evaluatePricingGate,
  pricingExplicitRejectionLabel,
  shouldLogPricingDetailDebug,
  titleMatchScore,
} from "@/lib/pricing/match";

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

type ItadOverviewRow = {
  id?: unknown;
  current?: unknown;
  urls?: unknown;
};

export type ItadBestPrice = {
  provider: "itad";
  price: string; // "12.34"
  currency?: string | null;
  storeId?: string;
  storeName?: string;
  dealUrl?: string;
  matchedTitle?: string;
  reason?: string;
};

function readItadPriceCurrency(price: ItadPriceAmount | null | undefined): string | null {
  if (!price || typeof price.currency !== "string") return null;
  const c = price.currency.trim().toUpperCase();
  return c || null;
}

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
  const detailDebug = shouldLogPricingDetailDebug(debug);
  const apiKey = process.env.ITAD_API_KEY;
  if (!apiKey || typeof apiKey !== "string") {
    if (detailDebug) {
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
  if (detailDebug) {
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

  if (detailDebug) {
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

    if (!id || !t) {
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "itad",
          phase: "search",
          rawTitle: t,
          matchedTitle: t,
          store: null,
          salePrice: null,
          normalPrice: null,
          score: 0,
          accepted: false,
          rejected: true,
          gateReason: "invalid_search_row",
          explicitRejection: "invalid_pricing_row",
          hasUrl: false,
          deduped: false,
        });
      }
      continue;
    }

    const gate = evaluatePricingGate({
      requestedTitle: title,
      matchedTitle: t,
      dealUrl: null,
      provider: "itad",
    });

    if (typ && typ !== "game") {
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "itad",
          phase: "search",
          rawTitle: t,
          matchedTitle: t,
          resultType: typ,
          store: null,
          salePrice: null,
          normalPrice: null,
          score: gate.score,
          accepted: false,
          rejected: true,
          gateReason: gate.reason,
          explicitRejection: "rejected_itad_result_not_base_game",
          hasUrl: false,
          deduped: false,
        });
      }
      continue;
    }

    if (containsBadWords(t)) {
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "itad",
          phase: "search",
          rawTitle: t,
          matchedTitle: t,
          store: null,
          salePrice: null,
          normalPrice: null,
          score: gate.score,
          titleMatchScore: titleMatchScore(title, t),
          accepted: false,
          rejected: true,
          gateReason: gate.reason,
          explicitRejection: "rejected_title_provider_bad_words",
          hasUrl: false,
          deduped: false,
        });
      }
      continue;
    }

    const score = titleMatchScore(title, t);
    scored.push({ id, matchedTitle: t, type: typ || "game", score });

    if (detailDebug) {
      console.log("[pricing:aggregate-row]", {
        requestedTitle: title,
        provider: "itad",
        phase: "search_candidate",
        rawTitle: t,
        matchedTitle: t,
        store: null,
        salePrice: null,
        normalPrice: null,
        score: gate.score,
        titleMatchScore: score,
        accepted: true,
        rejected: false,
        gateReason: gate.reason,
        explicitRejection: pricingExplicitRejectionLabel(gate),
        hasUrl: false,
        deduped: false,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (detailDebug) {
    console.log("[pricing:itad-search-aggregate-summary]", {
      requestedTitle: title,
      providerReturnedCount: results.length,
      scoredCandidateCount: scored.length,
      bestTitle: best?.matchedTitle ?? null,
      bestTitleMatchScore: best?.score ?? null,
    });
  }

  // Strict threshold: better null than wrong price.
  if (!best || best.score < 0.72) {
    if (detailDebug) {
      if (best) {
        const gate = evaluatePricingGate({
          requestedTitle: title,
          matchedTitle: best.matchedTitle,
          dealUrl: null,
          provider: "itad",
        });
        console.log("[pricing:aggregate-row]", {
          requestedTitle: title,
          provider: "itad",
          phase: "search_selection",
          rawTitle: best.matchedTitle,
          matchedTitle: best.matchedTitle,
          store: null,
          salePrice: null,
          normalPrice: null,
          score: gate.score,
          titleMatchScore: best.score,
          accepted: false,
          rejected: true,
          gateReason: gate.reason,
          explicitRejection: "rejected_because_title_score_threshold",
          hasUrl: false,
          deduped: false,
        });
      }
      console.log("[pricing:itad]", debugLabel ?? title, {
        step: "select",
        ok: false,
        reason: best ? `low_match_score_${best.score.toFixed(2)}` : "no_game_match",
      });
    }
    return null;
  }

  if (detailDebug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "select",
      ok: true,
      matchedTitle: best.matchedTitle,
      score: best.score,
    });
  }

  // 2) Fetch prices.
  // NOTE: `deals=true` means "only prices with price cut".
  // For many games (including Terraria) there may be no cut at the moment, which returns an empty array.
  // We try deals-only first (prefer actual discounts), then fall back to "all prices".
  const pricesUrlDealsOnly = `https://api.isthereanydeal.com/games/prices/v3?key=${encodeURIComponent(
    apiKey
  )}&country=${encodeURIComponent(country)}&deals=true&capacity=1`;
  const pricesUrlAll = `https://api.isthereanydeal.com/games/prices/v3?key=${encodeURIComponent(
    apiKey
  )}&country=${encodeURIComponent(country)}&capacity=1`;

  const pricesFetchDealsOnly = await fetchWith429Retry(pricesUrlDealsOnly, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify([best.id]),
  });

  if (detailDebug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "prices_deals_only",
      status: pricesFetchDealsOnly.res.status,
      retried: pricesFetchDealsOnly.retried,
    });
  }

  const parsePricesRows = async (res: Response, step: string) => {
    const json = (await res.json()) as unknown;
    if (detailDebug) {
      let preview: string;
      try {
        preview = JSON.stringify(json);
      } catch {
        preview = String(json);
      }
      console.log("[pricing:itad]", debugLabel ?? title, {
        step,
        preview: preview.slice(0, 1200),
        truncated: preview.length > 1200,
      });
    }
    const rows: ItadPricesRow[] = Array.isArray(json) ? (json as ItadPricesRow[]) : [];
    return rows;
  };

  let rows: ItadPricesRow[] = [];

  if (pricesFetchDealsOnly.res.ok) {
    rows = await parsePricesRows(pricesFetchDealsOnly.res, "prices_raw_preview_deals_only");
  }

  // Fallback: all prices (no "deals only" restriction)
  if (rows.length === 0) {
    const pricesFetchAll = await fetchWith429Retry(pricesUrlAll, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify([best.id]),
    });

    if (detailDebug) {
      console.log("[pricing:itad]", debugLabel ?? title, {
        step: "prices_all",
        status: pricesFetchAll.res.status,
        retried: pricesFetchAll.retried,
      });
    }

    if (pricesFetchAll.res.ok) {
      rows = await parsePricesRows(pricesFetchAll.res, "prices_raw_preview_all");
    }
  }

  const row = rows.find((r) => typeof r?.id === "string" && r.id === best.id) ?? rows[0];
  const deals = row && Array.isArray(row.deals) ? (row.deals as ItadDeal[]) : [];

  if (detailDebug) {
    deals.forEach((deal, index) => {
      const shopX = (deal?.shop ?? null) as ItadShop | null;
      const priceX = (deal?.price ?? null) as ItadPriceAmount | null;
      const urlX = typeof deal?.url === "string" && deal.url.trim() ? deal.url.trim() : "";
      const gate = evaluatePricingGate({
        requestedTitle: title,
        matchedTitle: best.matchedTitle,
        dealUrl: urlX || null,
        provider: "itad",
      });
      const amountR = priceX && typeof priceX.amount === "number" ? priceX.amount : NaN;
      const saleStr = Number.isFinite(amountR) ? formatAmount2(amountR) : null;
      const storeLabel =
        shopX && typeof shopX.name === "string"
          ? shopX.name
          : shopX && (typeof shopX.id === "number" || typeof shopX.id === "string")
            ? String(shopX.id)
            : null;

      console.log("[pricing:aggregate-row]", {
        requestedTitle: title,
        provider: "itad",
        phase: "prices_v3_deal",
        dealIndex: index,
        rawTitle: best.matchedTitle,
        matchedTitle: best.matchedTitle,
        store: storeLabel,
        salePrice: saleStr,
        normalPrice: null,
        score: gate.score,
        accepted: gate.acceptedPrice,
        rejected: !gate.acceptedPrice,
        gateReason: gate.reason,
        explicitRejection:
          pricingExplicitRejectionLabel(gate) ?? (!gate.acceptedPrice ? gate.reason : null),
        hasUrl: Boolean(urlX && gate.trustedUrl),
        deduped: false,
      });
    });
  }

  const first = deals[0];

  const shop = (first?.shop ?? null) as ItadShop | null;
  const price = (first?.price ?? null) as ItadPriceAmount | null;
  const url = typeof first?.url === "string" && first.url.trim() ? first.url.trim() : undefined;

  if (detailDebug) {
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
    // Fallback: Overview endpoint can include a "current" best price even when prices/v3 returns no deals.
    const overviewUrl = `https://api.isthereanydeal.com/games/overview/v2?key=${encodeURIComponent(
      apiKey
    )}&country=${encodeURIComponent(country)}`;
    const overviewFetch = await fetchWith429Retry(overviewUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify([best.id]),
    });

    if (detailDebug) {
      console.log("[pricing:itad]", debugLabel ?? title, {
        step: "overview",
        status: overviewFetch.res.status,
        retried: overviewFetch.retried,
      });
    }

    if (overviewFetch.res.ok) {
      const overviewJson = (await overviewFetch.res.json()) as unknown;
      if (detailDebug) {
        let preview: string;
        try {
          preview = JSON.stringify(overviewJson);
        } catch {
          preview = String(overviewJson);
        }
        console.log("[pricing:itad]", debugLabel ?? title, {
          step: "overview_raw_preview",
          preview: preview.slice(0, 1200),
          truncated: preview.length > 1200,
        });
      }

      const pricesArr =
        overviewJson &&
        typeof overviewJson === "object" &&
        Array.isArray((overviewJson as { prices?: unknown }).prices)
          ? ((overviewJson as { prices: unknown[] }).prices as unknown[])
          : [];

      const firstRow = (pricesArr[0] ?? null) as ItadOverviewRow | null;
      const current = (firstRow && (firstRow.current as Record<string, unknown> | null)) || null;
      const currentShop = (current && (current.shop as ItadShop | null)) || null;
      const currentPrice = (current && (current.price as ItadPriceAmount | null)) || null;
      const currentUrl =
        current && typeof (current as Record<string, unknown>).url === "string"
          ? ((current as Record<string, unknown>).url as string).trim()
          : "";

      const ovAmountRaw =
        currentPrice && typeof currentPrice.amount === "number" ? currentPrice.amount : NaN;
      const ovAmount = Number.isFinite(ovAmountRaw) ? ovAmountRaw : NaN;
      if (Number.isFinite(ovAmount)) {
        const ovStoreId =
          currentShop && (typeof currentShop.id === "number" || typeof currentShop.id === "string")
            ? String(currentShop.id)
            : undefined;
        const ovStoreName = currentShop && typeof currentShop.name === "string" ? currentShop.name : undefined;
        const mapped: ItadBestPrice = {
          provider: "itad",
          price: formatAmount2(ovAmount),
          currency: readItadPriceCurrency(currentPrice) ?? null,
          storeId: ovStoreId,
          storeName: ovStoreName,
          dealUrl: currentUrl || undefined,
          matchedTitle: best.matchedTitle,
        };
        if (detailDebug) {
          console.log("[pricing:itad]", debugLabel ?? title, {
            step: "overview_mapped_result",
            ok: true,
            mapped,
          });
        }
        return mapped;
      }
    }

    if (detailDebug) {
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
    currency: readItadPriceCurrency(price) ?? null,
    storeId,
    storeName,
    dealUrl: url,
    matchedTitle: best.matchedTitle,
  };

  if (detailDebug) {
    console.log("[pricing:itad]", debugLabel ?? title, {
      step: "result",
      ok: true,
      mapped,
    });
  }

  return mapped;
}

