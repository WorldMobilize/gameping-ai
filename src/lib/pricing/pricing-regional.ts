import {
  normalizePricingCountry,
  preferredCurrencyForCountry,
} from "@/lib/pricing/pricing-region";

export type RegionalCurrencyTier = "preferred" | "fallback" | "global";

/** Currency preference order when the regional currency is unavailable (no FX conversion). */
const COUNTRY_CURRENCY_CHAIN: Record<string, string[]> = {
  US: ["USD"],
  CA: ["CAD", "USD"],
  GB: ["GBP", "USD"],
  AU: ["AUD", "USD"],
  NZ: ["NZD", "USD"],
  MX: ["MXN", "USD"],
  BR: ["BRL", "USD"],
  JP: ["JPY"],
  KR: ["KRW"],
  CH: ["CHF", "EUR"],
};

const EU_EUR_COUNTRIES = new Set([
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "FI",
  "IE",
  "PT",
  "HR",
  "SK",
  "SI",
  "GR",
  "LU",
]);

export function normalizeOfferCurrency(currency: string | null | undefined): string {
  const c = (currency || "").trim().toUpperCase();
  return c || "USD";
}

export function fallbackCurrenciesForCountry(countryCode: string | null | undefined): string[] {
  const cc = normalizePricingCountry(countryCode);
  const explicit = COUNTRY_CURRENCY_CHAIN[cc];
  if (explicit) return [...explicit];

  const preferred = preferredCurrencyForCountry(cc);
  if (EU_EUR_COUNTRIES.has(cc) && preferred === "EUR") return ["EUR"];
  if (preferred) return [preferred, "USD"];
  return ["USD"];
}

export function regionalCurrencyTier(
  countryCode: string | null | undefined,
  currency: string | null | undefined
): RegionalCurrencyTier {
  const cur = normalizeOfferCurrency(currency);
  const chain = fallbackCurrenciesForCountry(countryCode);
  if (chain[0] === cur) return "preferred";
  if (chain.includes(cur)) return "fallback";
  return "global";
}

/** Higher = better regional fit (not a price comparison across currencies). */
export function scoreRegionalOffer(params: {
  countryCode: string | null | undefined;
  currency: string | null | undefined;
  storeName?: string | null;
  provider?: string | null;
}): number {
  const cc = normalizePricingCountry(params.countryCode);
  const tier = regionalCurrencyTier(cc, params.currency);
  let score = tier === "preferred" ? 100 : tier === "fallback" ? 65 : 20;

  const store = (params.storeName || "").toLowerCase();
  if (store) {
    const ukish = /\b(uk|u\.k\.|britain|great britain)\b/.test(store);
    const gamesPlanetUk = /\bgamesplanet\b/.test(store) && /\buk\b/.test(store);

    if (cc === "CA" || cc === "US") {
      if (ukish || gamesPlanetUk) score -= 55;
    } else if (EU_EUR_COUNTRIES.has(cc)) {
      if (ukish || gamesPlanetUk) score -= 20;
    }
  }

  if ((params.provider || "").toLowerCase() === "cheapshark") {
    score = Math.min(score, 15);
  }

  return score;
}

export function shouldLogRegionalPricingDebug(debug?: boolean): boolean {
  if (typeof process === "undefined") return Boolean(debug);
  return (
    process.env.PRICING_REGION_DEBUG === "true" ||
    process.env.NODE_ENV !== "production" ||
    Boolean(debug)
  );
}

export function logRegionalPricingSelection(payload: Record<string, unknown>): void {
  if (!shouldLogRegionalPricingDebug(payload.debug as boolean | undefined)) return;
  console.log("[pricing:region-select]", payload);
}
