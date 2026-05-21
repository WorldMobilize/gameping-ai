export const DEFAULT_PRICING_COUNTRY = "US";

/** ISO-3166-1 alpha-2 codes accepted for Steam cc / ITAD country (non-exhaustive launch set). */
const SUPPORTED_PRICING_COUNTRIES = new Set([
  "US",
  "CA",
  "GB",
  "AU",
  "NZ",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "CH",
  "PL",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "PT",
  "CZ",
  "HU",
  "RO",
  "BG",
  "HR",
  "SK",
  "SI",
  "GR",
  "LU",
  "JP",
  "KR",
  "BR",
  "MX",
  "AR",
  "CL",
  "CO",
  "IN",
  "SG",
  "HK",
  "TW",
  "TH",
  "MY",
  "PH",
  "ID",
  "VN",
  "ZA",
  "AE",
  "SA",
  "IL",
  "TR",
  "UA",
]);

/** Likely storefront currency for regional offer selection (not FX conversion). */
const COUNTRY_PREFERRED_CURRENCY: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  KR: "KRW",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  IN: "INR",
  SG: "SGD",
  HK: "HKD",
  TW: "TWD",
  TH: "THB",
  MY: "MYR",
  PH: "PHP",
  ID: "IDR",
  VN: "VND",
  ZA: "ZAR",
  AE: "AED",
  SA: "SAR",
  IL: "ILS",
  TR: "TRY",
  UA: "UAH",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  CH: "CHF",
  PL: "PLN",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  FI: "EUR",
  IE: "EUR",
  PT: "EUR",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  HR: "EUR",
  SK: "EUR",
  SI: "EUR",
  GR: "EUR",
  LU: "EUR",
};

export function normalizePricingCountry(code: string | null | undefined): string {
  const raw = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(raw)) return DEFAULT_PRICING_COUNTRY;
  if (!SUPPORTED_PRICING_COUNTRIES.has(raw)) return DEFAULT_PRICING_COUNTRY;
  return raw;
}

export function preferredCurrencyForCountry(countryCode: string): string | null {
  const cc = normalizePricingCountry(countryCode);
  return COUNTRY_PREFERRED_CURRENCY[cc] ?? null;
}

export type ResolvePricingCountryInput = {
  headerCountry?: string | null;
  /** Dev-only ?country= override from page searchParams. */
  queryCountry?: string | null;
  nodeEnv?: string;
};

/**
 * Resolve visitor pricing region from Vercel geo header with safe fallbacks.
 * Query override is honored only in development.
 */
export function resolvePricingCountry(input: ResolvePricingCountryInput = {}): string {
  const envDefault = normalizePricingCountry(
    process.env.PRICING_DEFAULT_COUNTRY || DEFAULT_PRICING_COUNTRY
  );

  if (input.nodeEnv === "development" && input.queryCountry?.trim()) {
    return normalizePricingCountry(input.queryCountry);
  }

  const fromHeader = input.headerCountry?.trim();
  if (fromHeader) {
    return normalizePricingCountry(fromHeader);
  }

  return envDefault;
}

/** Composite cache segment for provider memo + Supabase keys. */
export function pricingCacheCountrySegment(countryCode: string): string {
  return normalizePricingCountry(countryCode);
}
