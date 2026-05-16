import {
  cheapSharkGetStores,
  cheapSharkLookupBestPrice,
  cheapSharkLookupDealsByTitle,
  cheapSharkLookupSteamAppId,
  type CheapSharkBestPrice,
  type CheapSharkDeal,
  type CheapSharkStoreInfo,
} from "@/lib/pricing/providers/cheapshark";
import { itadLookupBestPrice } from "@/lib/pricing/providers/isthereanydeal";
import {
  hasSteamStoreDealRow,
  steamLookupVerifiedDealRow,
} from "@/lib/pricing/providers/steam";
import {
  evaluatePricingGate,
  pricingExplicitRejectionLabel,
  shouldLogPricingDetailDebug,
} from "@/lib/pricing/match";
import {
  getCachedDealQuotes,
  getCachedPriceQuote,
  getStaleDealQuotes,
  setCachedDealQuotes,
  setCachedPriceQuote,
} from "@/lib/pricing/price-cache";
import {
  verifiedDealDisplayDedupeKey,
  verifiedDealStoreIdentity,
  type VerifiedDealRow,
} from "@/lib/pricing/verified-deal-row";

function logPricingUnavailableSummary(params: {
  debug: boolean;
  requestedTitle: string;
  stage: string;
  provider?: string | null;
  matchedTitle?: string | null;
  dealUrl?: string | null;
  extra?: Record<string, unknown>;
}) {
  if (!shouldLogPricingDetailDebug(params.debug)) return;
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
  provider: string,
  debug?: boolean
): BestPriceResult | null {
  const mt = (raw.matchedTitle ?? "").trim();
  if (!mt) {
    if (shouldLogPricingDetailDebug(debug)) {
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

  if (shouldLogPricingDetailDebug(debug)) {
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

  if (shouldLogPricingDetailDebug(debug)) {
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
    // F2P titles skip deal/price caches (avoid stale paid prices).
    const mapped: BestPriceResult = {
      price: "Free",
      provider: "free_to_play",
      currency: null,
      matchedTitle: params.title,
      deal: { id: undefined, url: undefined },
      store: { id: undefined, name: undefined },
    };
    const gated = gatePricingByTitleMatch(params.title, mapped, "free_to_play", debug);
    const out = gated ?? mapped;
    if (debug) {
      console.log("[pricing:service]", params.debugLabel ?? params.title, {
        provider_used: "free_to_play",
        returningToPage: out,
      });
    }
    return out;
  }

  const freshDealCache = await getCachedDealQuotes(params.title);
  if (freshDealCache.fresh && freshDealCache.deals.length) {
    const revalidated = revalidateVerifiedDealsForDisplay(params.title, freshDealCache.deals, {
      debug,
    });
    const cheapest = pickCheapestTrustedVerifiedDeal(revalidated);
    if (cheapest) {
      const mappedRaw: BestPriceResult = {
        price: cheapest.salePrice,
        provider: "cheapshark",
        currency: cheapest.currency ?? "USD",
        store: {
          id: cheapest.store.id,
          name: cheapest.store.name,
        },
        deal: {
          id: cheapest.deal.id,
          url: cheapest.deal.url,
        },
        matchedTitle: cheapest.matchedTitle,
      };
      const gatedFromDeals = gatePricingByTitleMatch(
        params.title,
        mappedRaw,
        "cheapshark",
        debug
      );
      if (gatedFromDeals) {
        if (debug) {
          console.log("[pricing:service]", params.debugLabel ?? params.title, {
            provider_used: "deal_cache",
            returningToPage: gatedFromDeals,
          });
        }
        return gatedFromDeals;
      }
    }
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
      `cache:${cache.row.provider ?? "unknown"}`,
      debug
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

    const gatedCheap = gatePricingByTitleMatch(params.title, mappedRaw, "cheapshark", debug);
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

  const gatedItad = gatePricingByTitleMatch(params.title, mappedRaw, "itad", debug);
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

export type { DealRow, VerifiedDealRow } from "@/lib/pricing/verified-deal-row";
export {
  verifiedDealDisplayDedupeKey,
  verifiedDealStoreIdentity,
} from "@/lib/pricing/verified-deal-row";

/** Whether a gated best-price row is from a different store than any verified deal row. */
export function isTrustedBestPriceDistinctStore(
  best: BestPriceResult,
  deals: VerifiedDealRow[]
): boolean {
  const bestId = best.store?.id?.trim().toLowerCase();
  const bestName = best.store?.name?.trim().toLowerCase();
  const bestKey =
    bestId ? `id:${bestId}` : bestName ? `name:${bestName}` : "";
  if (!bestKey) return true;

  return !deals.some((d) => verifiedDealStoreIdentity(d) === bestKey);
}

function parseVerifiedDealSalePrice(deal: VerifiedDealRow): number {
  const n = Number(String(deal.salePrice).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/** Dedupe true duplicates (same provider, store, title, price, and deal URL). */
export function dedupeVerifiedDealsForDisplay(
  deals: VerifiedDealRow[],
  opts?: { debug?: boolean; requestedTitle?: string }
): VerifiedDealRow[] {
  const seen = new Set<string>();
  const out: VerifiedDealRow[] = [];
  for (const d of deals) {
    const k = verifiedDealDisplayDedupeKey(d);
    if (seen.has(k)) {
      if (shouldLogPricingDetailDebug(opts?.debug)) {
        const g = d.gate;
        const rt = opts?.requestedTitle ?? d.requestedTitle;
        console.log("[pricing:aggregate-row]", {
          requestedTitle: rt,
          provider: d.provider,
          rawTitle: d.matchedTitle,
          matchedTitle: d.matchedTitle,
          store: d.store.name ?? d.store.id,
          salePrice: d.salePrice,
          normalPrice: d.normalPrice,
          score: g.score,
          accepted: false,
          rejected: true,
          gateReason: g.reason,
          explicitRejection: pricingExplicitRejectionLabel(g, { deduped: true }),
          hasUrl: Boolean(d.deal.url),
          deduped: true,
        });
      }
      continue;
    }
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

export function prepareVerifiedDealsForDisplay(
  deals: VerifiedDealRow[],
  opts?: { debug?: boolean; requestedTitle?: string }
): VerifiedDealRow[] {
  return dedupeVerifiedDealsForDisplay(sortVerifiedDealsBySalePriceAsc(deals), opts);
}

/** Cheapest gate-accepted row that also has a trusted store URL (CheapShark redirect). */
export function pickCheapestTrustedVerifiedDeal(deals: VerifiedDealRow[]): VerifiedDealRow | null {
  const trusted = deals.filter((d) => Boolean(d.deal.url) && !Number.isNaN(parseVerifiedDealSalePrice(d)));
  if (!trusted.length) return null;
  return trusted.reduce((best, cur) =>
    parseVerifiedDealSalePrice(cur) < parseVerifiedDealSalePrice(best) ? cur : best
  );
}

/** Re-run pricing gates on cached rows (rules may change; never trust stale JSON blindly). */
function revalidateVerifiedDealsForDisplay(
  requestedTitle: string,
  rows: VerifiedDealRow[],
  opts?: { debug?: boolean }
): VerifiedDealRow[] {
  const detailDebug = shouldLogPricingDetailDebug(opts?.debug);
  const out: VerifiedDealRow[] = [];

  for (const row of rows) {
    const dealUrl = row.deal.url ?? null;
    const gate = evaluatePricingGate({
      requestedTitle,
      matchedTitle: row.matchedTitle,
      dealUrl,
      provider: row.provider,
    });
    if (!gate.acceptedPrice) continue;

    out.push({
      ...row,
      requestedTitle,
      deal: {
        id: row.deal.id,
        url: gate.trustedUrl ? dealUrl ?? undefined : undefined,
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

  return prepareVerifiedDealsForDisplay(out, {
    debug: opts?.debug,
    requestedTitle,
  });
}

function buildVerifiedDealsFromCheapShark(
  requestedTitle: string,
  rawDeals: CheapSharkDeal[],
  storeNameById: Map<string, string>,
  debug?: boolean
): { accepted: VerifiedDealRow[]; rejectedDeals: number } {
  const detailDebug = shouldLogPricingDetailDebug(debug);
  const out: VerifiedDealRow[] = [];
  let rejectedDeals = 0;

  for (const d of rawDeals) {
    if (!d?.dealID || !d.storeID || typeof d.title !== "string") {
      rejectedDeals += 1;
      if (detailDebug) {
        console.log("[pricing:aggregate-row]", {
          requestedTitle,
          provider: "cheapshark",
          rawTitle: typeof d?.title === "string" ? d.title : "",
          matchedTitle: typeof d?.title === "string" ? d.title : "",
          store: typeof d?.storeID === "string" ? d.storeID : null,
          salePrice: typeof d?.salePrice === "string" ? d.salePrice : null,
          normalPrice: typeof d?.normalPrice === "string" ? d.normalPrice : null,
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

    const matchedTitle = d.title.trim();
    const dealUrl = `https://www.cheapshark.com/redirect?dealID=${d.dealID}`;
    const gate = evaluatePricingGate({
      requestedTitle,
      matchedTitle,
      dealUrl,
      provider: "cheapshark",
    });

    const storeLabel = storeNameById.get(d.storeID) ?? d.storeID;

    if (detailDebug) {
      const accepted = gate.acceptedPrice;
      console.log("[pricing:aggregate-row]", {
        requestedTitle,
        provider: "cheapshark",
        rawTitle: matchedTitle,
        matchedTitle,
        store: storeLabel,
        salePrice: d.salePrice,
        normalPrice: d.normalPrice,
        score: gate.score,
        accepted,
        rejected: !accepted,
        gateReason: gate.reason,
        explicitRejection:
          pricingExplicitRejectionLabel(gate) ?? (!accepted ? gate.reason : null),
        hasUrl: Boolean(gate.trustedUrl && d.dealID),
        deduped: false,
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

  return { accepted: out, rejectedDeals };
}

export type LookupDealsResult = {
  deals: VerifiedDealRow[];
  /** ISO timestamp when deal rows were last persisted or refreshed. */
  lastCheckedAt: string | null;
  /** True when served from Supabase deal cache (fresh or stale). */
  fromCache: boolean;
};

function shouldTrySteamVerifiedDealFallback(params: {
  rateLimited: boolean;
  dealCount: number;
  limit: number;
}): boolean {
  if (params.rateLimited) return true;
  if (params.dealCount === 0) return true;
  return params.dealCount < params.limit;
}

function resolveDealQuotesCacheProvider(deals: VerifiedDealRow[]): string {
  const providers = new Set(deals.map((d) => d.provider));
  if (providers.size > 1) return "mixed";
  return deals[0]?.provider ?? "cheapshark";
}

async function appendSteamVerifiedDealFallback(params: {
  requestedTitle: string;
  deals: VerifiedDealRow[];
  limit: number;
  rateLimited: boolean;
  debug?: boolean;
  debugLabel?: string;
  rawgStores?: unknown;
  steamAppIdHint?: number | string | null;
  cheapsharkSteamAppId?: string | null;
}): Promise<VerifiedDealRow[]> {
  if (hasSteamStoreDealRow(params.deals)) return params.deals;
  if (
    !shouldTrySteamVerifiedDealFallback({
      rateLimited: params.rateLimited,
      dealCount: params.deals.length,
      limit: params.limit,
    })
  ) {
    return params.deals;
  }

  const steamRow = await steamLookupVerifiedDealRow({
    title: params.requestedTitle,
    cheapsharkSteamAppId: params.cheapsharkSteamAppId,
    rawgStores: params.rawgStores,
    steamAppIdHint: params.steamAppIdHint,
    debug: params.debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:steam` : undefined,
  });

  if (!steamRow) return params.deals;
  return [...params.deals, steamRow];
}

export async function lookupDeals(params: {
  title: string;
  limit?: number;
  debug?: boolean;
  debugLabel?: string;
  /** RAWG game detail `stores` when available (Steam slug / URL only). */
  rawgStores?: unknown;
  /** Optional trusted Steam app id (e.g. from upstream mapping). */
  steamAppIdHint?: number | string | null;
}): Promise<LookupDealsResult> {
  const requestedTitle = params.title.trim();
  const detailDebug = shouldLogPricingDetailDebug(params.debug);
  const limit = params.limit ?? 8;

  const cheapsharkSteamAppIdPromise = cheapSharkLookupSteamAppId({
    title: params.title,
    debug: params.debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:steamAppId` : undefined,
  });

  const freshCache = await getCachedDealQuotes(params.title);
  if (freshCache.fresh && freshCache.deals.length) {
    const deals = revalidateVerifiedDealsForDisplay(requestedTitle, freshCache.deals, {
      debug: params.debug,
    }).slice(0, limit);

    if (deals.length) {
      if (detailDebug) {
        console.log("[pricing:deals-aggregate-summary]", {
          requestedTitle,
          cacheSource: "fresh",
          finalDisplayCount: deals.length,
        });
      }

      return {
        deals,
        lastCheckedAt: freshCache.updatedAt,
        fromCache: true,
      };
    }
  }

  const [cheapFetch, cheapsharkSteamAppId] = await Promise.all([
    cheapSharkLookupDealsByTitle({
      title: params.title,
      limit,
      debug: params.debug,
      debugLabel: params.debugLabel,
    }),
    cheapsharkSteamAppIdPromise,
  ]);

  const providerFailed = cheapFetch.rateLimited || !cheapFetch.deals.length;

  if (providerFailed) {
    const stale = await getStaleDealQuotes(params.title);
    if (stale.stale && stale.deals.length) {
      const revalidated = revalidateVerifiedDealsForDisplay(requestedTitle, stale.deals, {
        debug: params.debug,
      });
      const withSteam = await appendSteamVerifiedDealFallback({
        requestedTitle,
        deals: revalidated,
        limit,
        rateLimited: cheapFetch.rateLimited,
        debug: params.debug,
        debugLabel: params.debugLabel,
        rawgStores: params.rawgStores,
        steamAppIdHint: params.steamAppIdHint,
        cheapsharkSteamAppId,
      });
      const deals = prepareVerifiedDealsForDisplay(withSteam, {
        debug: params.debug,
        requestedTitle,
      }).slice(0, limit);

      if (detailDebug) {
        console.log("[pricing:deals-aggregate-summary]", {
          requestedTitle,
          cacheSource: "stale",
          rateLimited: cheapFetch.rateLimited,
          steamFallbackAppended: deals.length > revalidated.length,
          finalDisplayCount: deals.length,
        });
      }

      return {
        deals,
        lastCheckedAt: stale.updatedAt,
        fromCache: true,
      };
    }

    const steamOnly = await appendSteamVerifiedDealFallback({
      requestedTitle,
      deals: [],
      limit,
      rateLimited: cheapFetch.rateLimited,
      debug: params.debug,
      debugLabel: params.debugLabel,
      rawgStores: params.rawgStores,
      steamAppIdHint: params.steamAppIdHint,
      cheapsharkSteamAppId,
    });
    const steamFinal = prepareVerifiedDealsForDisplay(steamOnly, {
      debug: params.debug,
      requestedTitle,
    }).slice(0, limit);

    if (steamFinal.length) {
      const nowIso = new Date().toISOString();
      void setCachedDealQuotes({
        title: params.title,
        deals: steamFinal,
        provider: resolveDealQuotesCacheProvider(steamFinal),
        meta: {
          source: "live",
          provider: "steam",
          rateLimited: cheapFetch.rateLimited,
        },
      });

      if (detailDebug) {
        console.log("[pricing:deals-aggregate-summary]", {
          requestedTitle,
          providerReturnedCount: 0,
          rateLimited: cheapFetch.rateLimited,
          steamFallbackOnly: true,
          finalDisplayCount: steamFinal.length,
        });
      }

      return {
        deals: steamFinal,
        lastCheckedAt: nowIso,
        fromCache: false,
      };
    }

    if (detailDebug) {
      console.log("[pricing:deals-aggregate-summary]", {
        requestedTitle,
        providerReturnedCount: 0,
        rateLimited: cheapFetch.rateLimited,
        finalDisplayCount: 0,
      });
    }

    return { deals: [], lastCheckedAt: null, fromCache: false };
  }

  const stores = (await cheapSharkGetStores({
    debug: params.debug,
    debugLabel: params.debugLabel ? `${params.debugLabel}:stores` : undefined,
  })) as CheapSharkStoreInfo[];
  const storeNameById = new Map(stores.map((s) => [s.storeID, s.storeName]));

  const { accepted: out, rejectedDeals } = buildVerifiedDealsFromCheapShark(
    requestedTitle,
    cheapFetch.deals,
    storeNameById,
    params.debug
  );

  const withSteam = await appendSteamVerifiedDealFallback({
    requestedTitle,
    deals: out,
    limit,
    rateLimited: cheapFetch.rateLimited,
    debug: params.debug,
    debugLabel: params.debugLabel,
    rawgStores: params.rawgStores,
    steamAppIdHint: params.steamAppIdHint,
    cheapsharkSteamAppId,
  });

  const finalDeals = prepareVerifiedDealsForDisplay(withSteam, {
    debug: params.debug,
    requestedTitle,
  }).slice(0, limit);

  const nowIso = new Date().toISOString();
  if (finalDeals.length) {
    void setCachedDealQuotes({
      title: params.title,
      deals: finalDeals,
      provider: resolveDealQuotesCacheProvider(finalDeals),
      meta: {
        source: "live",
        provider: resolveDealQuotesCacheProvider(finalDeals),
        rateLimited: false,
      },
    });
  }

  if (detailDebug) {
    console.log("[pricing:deals-aggregate-summary]", {
      requestedTitle,
      providerReturnedCount: cheapFetch.deals.length,
      acceptedAfterGateCount: out.length,
      steamFallbackAppended: withSteam.length > out.length,
      trustedUrlCount: withSteam.filter((r) => r.gate.trustedUrl).length,
      dedupedCount: withSteam.length - finalDeals.length,
      finalDisplayCount: finalDeals.length,
      rejectedInvalidOrGate: rejectedDeals,
      cacheSource: "live",
    });
  }

  return {
    deals: finalDeals,
    lastCheckedAt: nowIso,
    fromCache: false,
  };
}

