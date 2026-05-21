import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pricingCacheCountrySegment,
  resolvePricingCountry,
} from "@/lib/pricing/pricing-region";
import {
  isUsdFallbackProvider,
  pickCheapestTrustedVerifiedDeal,
} from "@/lib/pricing/pricing-selection";
import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";

function stubDeal(params: {
  provider: VerifiedDealRow["provider"];
  salePrice: string;
  currency: string;
  storeId?: string;
  storeName?: string;
}): VerifiedDealRow {
  return {
    requestedTitle: "Test Game",
    matchedTitle: "Test Game",
    provider: params.provider,
    currency: params.currency,
    store: {
      id: params.storeId ?? "store",
      name: params.storeName ?? "Store",
    },
    salePrice: params.salePrice,
    normalPrice: params.salePrice,
    deal: { id: `${params.provider}-1`, url: "https://store.example/buy" },
    gate: {
      score: 0.9,
      acceptedPrice: true,
      trustedUrl: true,
      reason: "test",
      requestedNorm: "test game",
      matchedNorm: "test game",
      isShortTitle: false,
    },
  };
}

describe("resolvePricingCountry", () => {
  it("uses Vercel geo header when present", () => {
    assert.equal(
      resolvePricingCountry({ headerCountry: "IT", nodeEnv: "production" }),
      "IT"
    );
  });

  it("falls back to US for invalid codes", () => {
    assert.equal(resolvePricingCountry({ headerCountry: "ZZ" }), "US");
    assert.equal(resolvePricingCountry({ headerCountry: "123" }), "US");
  });

  it("honors ?country= only in development", () => {
    assert.equal(
      resolvePricingCountry({
        queryCountry: "CA",
        nodeEnv: "development",
      }),
      "CA"
    );
    assert.equal(
      resolvePricingCountry({
        headerCountry: "IT",
        queryCountry: "CA",
        nodeEnv: "production",
      }),
      "IT"
    );
  });
});

describe("pricing cache country segment", () => {
  it("includes country in cache key segment", () => {
    assert.equal(pricingCacheCountrySegment("it"), "IT");
    assert.equal(pricingCacheCountrySegment("CA"), "CA");
    assert.notEqual(
      pricingCacheCountrySegment("US"),
      pricingCacheCountrySegment("IT")
    );
  });
});

describe("pickCheapestTrustedVerifiedDeal", () => {
  it("prefers EUR regional over lower USD CheapShark", () => {
    const deals = [
      stubDeal({ provider: "cheapshark", salePrice: "5.00", currency: "USD" }),
      stubDeal({ provider: "itad", salePrice: "8.00", currency: "EUR" }),
    ];
    const pick = pickCheapestTrustedVerifiedDeal(deals, { countryCode: "IT" });
    assert.equal(pick?.provider, "itad");
    assert.equal(pick?.currency, "EUR");
  });

  it("uses CheapShark USD when no regional offers exist", () => {
    const deals = [stubDeal({ provider: "cheapshark", salePrice: "9.99", currency: "USD" })];
    const pick = pickCheapestTrustedVerifiedDeal(deals, { countryCode: "IT" });
    assert.equal(pick?.provider, "cheapshark");
    assert.ok(isUsdFallbackProvider("cheapshark"));
  });

  it("prefers USD over lower EUR for CA (no cross-currency compare)", () => {
    const deals = [
      stubDeal({
        provider: "itad",
        salePrice: "5.00",
        currency: "EUR",
        storeName: "GamesPlanet UK",
      }),
      stubDeal({ provider: "cheapshark", salePrice: "12.00", currency: "USD" }),
    ];
    const pick = pickCheapestTrustedVerifiedDeal(deals, { countryCode: "CA" });
    assert.equal(pick?.currency, "USD");
    assert.equal(pick?.provider, "cheapshark");
  });

  it("does not pick lowest numeric value across incompatible currencies", () => {
    const deals = [
      stubDeal({ provider: "itad", salePrice: "4.00", currency: "EUR" }),
      stubDeal({ provider: "steam", salePrice: "15.00", currency: "CAD" }),
    ];
    const pick = pickCheapestTrustedVerifiedDeal(deals, { countryCode: "CA" });
    assert.equal(pick?.currency, "CAD");
  });
});
