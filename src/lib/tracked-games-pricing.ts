import { normalizePricingCountry } from "@/lib/pricing/pricing-region";
import { normalizeOfferCurrency } from "@/lib/pricing/pricing-regional";

const MAX_STORE_LEN = 120;
const MAX_URL_LEN = 2048;
const MAX_PROVIDER_LEN = 32;

export type TrackedOfferSnapshot = {
  currency: string | null;
  provider: string | null;
  storeName: string | null;
  url: string | null;
};

export function resolveTrackedPricingCountry(raw: unknown): string {
  if (typeof raw === "string" || typeof raw === "number") {
    return normalizePricingCountry(String(raw));
  }
  return normalizePricingCountry(null);
}

function trimOptionalString(
  raw: unknown,
  maxLen: number
): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t || t.length > maxLen) return null;
  return t;
}

export function parseTrackedOfferSnapshot(body: Record<string, unknown>): TrackedOfferSnapshot {
  const currencyRaw =
    body.lastKnownCurrency ?? body.currency ?? body.last_known_currency;
  const currency =
    typeof currencyRaw === "string" && currencyRaw.trim()
      ? normalizeOfferCurrency(currencyRaw)
      : null;

  const provider = trimOptionalString(
    body.provider ?? body.lastKnownProvider ?? body.last_known_provider,
    MAX_PROVIDER_LEN
  );

  const storeName = trimOptionalString(
    body.storeName ?? body.store ?? body.lastKnownStore ?? body.last_known_store,
    MAX_STORE_LEN
  );

  let url: string | null = null;
  const urlRaw = body.url ?? body.lastKnownUrl ?? body.last_known_url;
  if (typeof urlRaw === "string" && urlRaw.trim()) {
    try {
      const u = new URL(urlRaw.trim());
      if (u.protocol === "https:" && u.href.length <= MAX_URL_LEN) {
        url = u.href;
      }
    } catch {
      url = null;
    }
  }

  return { currency, provider, storeName, url };
}

export type AlertCurrencyDecision =
  | { action: "compare"; currency: string }
  | { action: "initialize"; currency: string }
  | { action: "rebaseline"; currency: string; from: string | null };

/**
 * Decide whether alert math may run for this cron tick.
 * Never compare unlike currencies numerically.
 */
export function resolveAlertCurrencyDecision(params: {
  storedCurrency: string | null | undefined;
  newCurrency: string | null | undefined;
}): AlertCurrencyDecision {
  const next = normalizeOfferCurrency(params.newCurrency || "USD");
  const storedRaw = (params.storedCurrency || "").trim();
  if (!storedRaw) {
    return { action: "initialize", currency: next };
  }
  const stored = normalizeOfferCurrency(storedRaw);
  if (stored !== next) {
    return { action: "rebaseline", currency: next, from: stored };
  }
  return { action: "compare", currency: next };
}
