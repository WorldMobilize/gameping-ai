import {
  containsBadWords,
  evaluatePricingGate,
  pricingExplicitRejectionLabel,
  shouldLogPricingDetailDebug,
  titleMatchScore,
} from "@/lib/pricing/match";
import { normalizePricingCountry } from "@/lib/pricing/pricing-region";

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

type PricingDebugEvent =
  | {
      type: "http";
      url: string;
      status: number;
      retried: boolean;
      retryAfterSeconds?: number | null;
      globalCooldownUntil?: number | null;
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
const dealsInflightByTitle = new Map<string, Promise<CheapSharkDealsFetchResult>>();

/** Default cooldown when CheapShark 429 has no Retry-After header. */
const CHEAPSHARK_429_COOLDOWN_MS = 8 * 60 * 1000;
const cheapShark429UntilByTitle = new Map<string, number>();

/** IP-level backoff: any 429 pauses all CheapShark calls until this timestamp (ms). */
let globalCheapSharkCooldownUntil = 0;

export type CheapSharkDealsFetchResult = {
  deals: CheapSharkDeal[];
  rateLimited: boolean;
};

function normalizeDealsMemoKey(title: string, countryCode?: string) {
  const cc = normalizePricingCountry(countryCode);
  const t = title.trim().toLowerCase();
  return `${cc}:${t}`;
}

/** Parse Retry-After (seconds) per CheapShark API docs. */
export function parseRetryAfterSeconds(
  header: string | null | undefined
): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;
  const asInt = Number.parseInt(trimmed, 10);
  if (Number.isFinite(asInt) && asInt >= 0) return asInt;
  const asDate = Date.parse(trimmed);
  if (Number.isFinite(asDate)) {
    const deltaSec = Math.ceil((asDate - Date.now()) / 1000);
    return Math.max(0, deltaSec);
  }
  return null;
}

export function getGlobalCheapSharkCooldownUntil(): number {
  return globalCheapSharkCooldownUntil;
}

export function isCheapSharkGloballyThrottled(now = Date.now()): boolean {
  if (globalCheapSharkCooldownUntil <= now) {
    if (globalCheapSharkCooldownUntil > 0) globalCheapSharkCooldownUntil = 0;
    return false;
  }
  return true;
}

function applyCheapShark429Cooldown(params: {
  retryAfterHeader: string | null;
  title?: string;
  now?: number;
}): { cooldownMs: number; retryAfterSeconds: number | null } {
  const now = params.now ?? Date.now();
  const retryAfterSeconds = parseRetryAfterSeconds(params.retryAfterHeader);
  const cooldownMs =
    retryAfterSeconds !== null
      ? retryAfterSeconds * 1000
      : CHEAPSHARK_429_COOLDOWN_MS;
  const until = now + cooldownMs;

  globalCheapSharkCooldownUntil = Math.max(globalCheapSharkCooldownUntil, until);

  if (params.title) {
    const key = normalizeDealsMemoKey(params.title);
    if (key) {
      const prev = cheapShark429UntilByTitle.get(key) ?? 0;
      cheapShark429UntilByTitle.set(key, Math.max(prev, until));
    }
  }

  return { cooldownMs, retryAfterSeconds };
}

function logCheapSharkDebug(
  debug: boolean,
  debugLabel: string | undefined,
  payload: Record<string, unknown>
) {
  if (!shouldLogPricingDetailDebug(debug)) return;
  console.log("[pricing:cheapshark]", debugLabel ?? "cheapshark", {
    globalCooldownUntil: globalCheapSharkCooldownUntil || null,
    ...payload,
  });
}

export function isCheapSharkDealsThrottled(
  title: string,
  countryCode?: string,
  now = Date.now()
): boolean {
  if (isCheapSharkGloballyThrottled(now)) return true;
  const key = normalizeDealsMemoKey(title, countryCode);
  if (!key) return false;
  const until = cheapShark429UntilByTitle.get(key);
  if (!until) return false;
  if (until <= now) {
    cheapShark429UntilByTitle.delete(key);
    return false;
  }
  return true;
}

type CheapSharkFetchOk = { ok: true; response: Response };
type CheapSharkFetchRateLimited = {
  ok: false;
  rateLimited: true;
  retryAfterSeconds: number | null;
};
type CheapSharkFetchFailed = { ok: false; rateLimited: false; response: Response };

type CheapSharkFetchResult =
  | CheapSharkFetchOk
  | CheapSharkFetchRateLimited
  | CheapSharkFetchFailed;

async function cheapSharkFetch(
  url: string,
  params: {
    debug: boolean;
    debugLabel?: string;
    endpoint: "deals" | "games" | "stores";
    titleForThrottle?: string;
  }
): Promise<CheapSharkFetchResult> {
  const { debug, debugLabel, endpoint, titleForThrottle } = params;

  if (isCheapSharkGloballyThrottled()) {
    logCheapSharkDebug(debug, debugLabel, {
      skipped: true,
      reason: "global_cooldown",
      endpoint,
      globalCooldownUntil: globalCheapSharkCooldownUntil,
    });
    return { ok: false, rateLimited: true, retryAfterSeconds: null };
  }

  if (titleForThrottle && isCheapSharkDealsThrottled(titleForThrottle)) {
    logCheapSharkDebug(debug, debugLabel, {
      skipped: true,
      reason: "title_cooldown",
      endpoint,
      globalCooldownUntil: globalCheapSharkCooldownUntil,
    });
    return { ok: false, rateLimited: true, retryAfterSeconds: null };
  }

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (res.status !== 429) {
      if (shouldLogPricingDetailDebug(debug)) {
        const evt: PricingDebugEvent = {
          type: "http",
          url,
          status: res.status,
          retried: false,
          globalCooldownUntil: globalCheapSharkCooldownUntil || null,
        };
        console.log("[pricing:cheapshark]", debugLabel ?? endpoint, evt);
      }
      return { ok: true, response: res };
    }

    const retryAfterHeader = res.headers.get("retry-after");
    const { retryAfterSeconds } = applyCheapShark429Cooldown({
      retryAfterHeader,
      title: titleForThrottle,
    });

    logCheapSharkDebug(debug, debugLabel, {
      status: 429,
      endpoint,
      retryAfterSeconds,
      retryAfterHeader: retryAfterHeader ?? null,
      globalCooldownUntil: globalCheapSharkCooldownUntil,
      immediateRetry: false,
    });

    if (shouldLogPricingDetailDebug(debug)) {
      const evt: PricingDebugEvent = {
        type: "http",
        url,
        status: 429,
        retried: false,
        retryAfterSeconds,
        globalCooldownUntil: globalCheapSharkCooldownUntil,
      };
      console.log("[pricing:cheapshark]", debugLabel ?? endpoint, evt);
    }

    return { ok: false, rateLimited: true, retryAfterSeconds };
  } catch {
    return { ok: false, rateLimited: false, response: new Response(null, { status: 0 }) };
  }
}

async function cheapSharkFetchDealsFromNetwork(params: {
  title: string;
  pageSize: number;
  debug: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDealsFetchResult> {
  const { title, pageSize, debug, debugLabel } = params;
  const url = `https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(
    title
  )}&pageSize=${encodeURIComponent(String(pageSize))}&sortBy=Price`;

  const fetched = await cheapSharkFetch(url, {
    debug,
    debugLabel,
    endpoint: "deals",
    titleForThrottle: title,
  });

  if (!fetched.ok) {
    if ("rateLimited" in fetched && fetched.rateLimited) {
      return { deals: [], rateLimited: true };
    }
    return { deals: [], rateLimited: false };
  }

  const res = fetched.response;
  if (!res.ok) return { deals: [], rateLimited: false };

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
  return { deals, rateLimited: false };
}

async function cheapSharkGetDealsShared(params: {
  title: string;
  countryCode?: string;
  debug: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDealsFetchResult> {
  const key = normalizeDealsMemoKey(params.title, params.countryCode);
  if (!key) return { deals: [], rateLimited: false };

  const now = Date.now();
  const cached = dealsMemoByTitle.get(key);
  if (cached && now - cached.fetchedAt < DEALS_MEMO_TTL_MS) {
    return { deals: cached.deals, rateLimited: false };
  }

  if (isCheapSharkDealsThrottled(params.title, params.countryCode, now)) {
    return { deals: [], rateLimited: true };
  }

  let inflight = dealsInflightByTitle.get(key);
  if (!inflight) {
    inflight = cheapSharkFetchDealsFromNetwork({
      title: params.title.trim(),
      pageSize: DEALS_FETCH_PAGE_SIZE,
      debug: params.debug,
      debugLabel: params.debugLabel,
    }).then((result) => {
      if (!result.rateLimited) {
        dealsMemoByTitle.set(key, { deals: result.deals, fetchedAt: Date.now() });
      }
      return result;
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
  countryCode?: string;
  limit?: number;
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkDealsFetchResult> {
  const { title, limit = 5, debug = false, debugLabel, countryCode } = params;
  const lim = Math.max(3, Math.min(limit, 12));
  const result = await cheapSharkGetDealsShared({
    title,
    countryCode,
    debug,
    debugLabel,
  });
  return {
    deals: result.deals.slice(0, lim),
    rateLimited: result.rateLimited,
  };
}

type CheapSharkGameLookup = {
  steamAppID?: string;
  external?: string;
};

const CHEAPSHARK_STEAM_APP_ID_MATCH_MIN = 0.68;

/** Trusted Steam app id from CheapShark /games when the listing title matches the request. */
export async function cheapSharkLookupSteamAppId(params: {
  title: string;
  countryCode?: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<string | null> {
  const requestedTitle = params.title.trim();
  if (!requestedTitle) return null;

  if (isCheapSharkGloballyThrottled()) {
    logCheapSharkDebug(params.debug ?? false, params.debugLabel, {
      skipped: true,
      reason: "global_cooldown",
      endpoint: "games",
    });
    return null;
  }

  const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
    requestedTitle
  )}&limit=5`;

  const fetched = await cheapSharkFetch(url, {
    debug: params.debug ?? false,
    debugLabel: params.debugLabel,
    endpoint: "games",
    titleForThrottle: requestedTitle,
  });

  if (!fetched.ok) {
    return null;
  }

  const res = fetched.response;
  if (!res.ok) return null;

  try {
    const games = (await res.json()) as unknown;
    if (!Array.isArray(games) || !games.length) return null;

    let best: { steamAppID: string; score: number } | null = null;

    for (const raw of games) {
      if (!raw || typeof raw !== "object") continue;
      const game = raw as CheapSharkGameLookup;
      const external =
        typeof game.external === "string" ? game.external.trim() : "";
      const steamAppID =
        typeof game.steamAppID === "string" ? game.steamAppID.trim() : "";
      if (!external || !steamAppID || !/^\d+$/.test(steamAppID)) continue;

      const score = titleMatchScore(requestedTitle, external);
      if (score < CHEAPSHARK_STEAM_APP_ID_MATCH_MIN) continue;
      if (!best || score > best.score) {
        best = { steamAppID, score };
      }
    }

    if (shouldLogPricingDetailDebug(params.debug)) {
      console.log("[pricing:cheapshark]", params.debugLabel ?? requestedTitle, {
        steamAppIdLookup: true,
        found: Boolean(best?.steamAppID),
        steamAppID: best?.steamAppID ?? null,
        globalCooldownUntil: globalCheapSharkCooldownUntil || null,
      });
    }

    return best?.steamAppID ?? null;
  } catch {
    return null;
  }
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

  if (isCheapSharkGloballyThrottled()) {
    logCheapSharkDebug(debug, debugLabel, {
      skipped: true,
      reason: "global_cooldown",
      endpoint: "stores",
    });
    return storesMemo?.stores ?? [];
  }

  if (!storesInflight) {
    storesInflight = (async () => {
      try {
        const url = "https://www.cheapshark.com/api/1.0/stores";
        const fetched = await cheapSharkFetch(url, {
          debug,
          debugLabel,
          endpoint: "stores",
        });
        if (!fetched.ok) {
          return storesMemo?.stores ?? [];
        }
        const res = fetched.response;
        if (!res.ok) return storesMemo?.stores ?? [];
        const data = (await res.json()) as unknown;
        return Array.isArray(data) ? (data as CheapSharkStoreInfo[]) : [];
      } catch {
        return storesMemo?.stores ?? [];
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
  countryCode?: string;
  debug?: boolean;
  debugLabel?: string;
}): Promise<CheapSharkBestPrice | null> {
  const { title, debug = false, debugLabel, countryCode } = params;
  const { deals, rateLimited } = await cheapSharkLookupDealsByTitle({
    title,
    countryCode,
    limit: DEALS_FETCH_PAGE_SIZE,
    debug,
    debugLabel,
  });
  if (rateLimited && !deals.length) {
    if (shouldLogPricingDetailDebug(debug)) {
      const evt: PricingDebugEvent = { type: "result", ok: false, reason: "rate_limited" };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    return null;
  }
  if (!deals.length) {
    if (shouldLogPricingDetailDebug(debug)) {
      const evt: PricingDebugEvent = { type: "result", ok: false, reason: "no_deals" };
      console.log("[pricing:cheapshark]", debugLabel ?? title, evt);
    }
    return null;
  }

  const detailDebug = shouldLogPricingDetailDebug(debug);

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
    console.log("[pricing:cheapshark]", debugLabel ?? title, {
      type: "result",
      ok: true,
    } satisfies PricingDebugEvent);
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
