import {
  DEFAULT_PRICING_COUNTRY,
  normalizePricingCountry,
  type ResolvePricingCountryInput,
  resolvePricingCountry,
} from "@/lib/pricing/pricing-region";

export type PricingContext = {
  countryCode: string;
};

export function createPricingContext(countryCode?: string | null): PricingContext {
  return { countryCode: normalizePricingCountry(countryCode ?? DEFAULT_PRICING_COUNTRY) };
}

export function resolvePricingContext(input: ResolvePricingCountryInput = {}): PricingContext {
  return createPricingContext(resolvePricingCountry(input));
}

export { DEFAULT_PRICING_COUNTRY, normalizePricingCountry, resolvePricingCountry };
