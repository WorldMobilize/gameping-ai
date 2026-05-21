import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPriceLine } from "@/lib/pricing/display";
import {
  parseTrackedOfferSnapshot,
  resolveAlertCurrencyDecision,
  resolveTrackedPricingCountry,
} from "@/lib/tracked-games-pricing";

describe("resolveTrackedPricingCountry", () => {
  it("accepts supported countries", () => {
    assert.equal(resolveTrackedPricingCountry("IT"), "IT");
    assert.equal(resolveTrackedPricingCountry("ca"), "CA");
  });

  it("falls back to US for invalid codes", () => {
    assert.equal(resolveTrackedPricingCountry("ZZ"), "US");
    assert.equal(resolveTrackedPricingCountry(""), "US");
  });
});

describe("parseTrackedOfferSnapshot", () => {
  it("normalizes currency and rejects non-https urls", () => {
    const snap = parseTrackedOfferSnapshot({
      currency: "eur",
      provider: "itad",
      storeName: "Steam",
      url: "http://evil.example",
    });
    assert.equal(snap.currency, "EUR");
    assert.equal(snap.provider, "itad");
    assert.equal(snap.storeName, "Steam");
    assert.equal(snap.url, null);
  });
});

describe("resolveAlertCurrencyDecision", () => {
  it("initializes when stored currency is missing", () => {
    assert.deepEqual(resolveAlertCurrencyDecision({ storedCurrency: null, newCurrency: "EUR" }), {
      action: "initialize",
      currency: "EUR",
    });
  });

  it("rebases when currency changes", () => {
    assert.deepEqual(
      resolveAlertCurrencyDecision({ storedCurrency: "USD", newCurrency: "EUR" }),
      { action: "rebaseline", currency: "EUR", from: "USD" }
    );
  });

  it("allows compare when currencies match", () => {
    assert.deepEqual(
      resolveAlertCurrencyDecision({ storedCurrency: "CAD", newCurrency: "cad" }),
      { action: "compare", currency: "CAD" }
    );
  });
});

describe("alert email price copy", () => {
  it("labels non-US USD fallback as approximate", () => {
    const line = formatPriceLine({
      price: "12.00",
      currency: "USD",
      usdFallback: true,
    });
    assert.match(line, /Approx\.\s+\$12\.00 USD/);
  });

  it("shows regional EUR without approximate prefix", () => {
    const line = formatPriceLine({
      price: "8.00",
      currency: "EUR",
      usdFallback: false,
    });
    assert.equal(line, "€8.00");
  });
});
