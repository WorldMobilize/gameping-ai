import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";
import {
  findMatchingTrackedOffer,
  hasTrackedOfferIdentity,
  storeNameMatchesOffer,
} from "@/lib/tracked-offer-selection";

function row(partial: Partial<VerifiedDealRow> & Pick<VerifiedDealRow, "store" | "salePrice">): VerifiedDealRow {
  return {
    requestedTitle: "Stranded Deep",
    matchedTitle: "Stranded Deep",
    provider: "itad",
    currency: "EUR",
    normalPrice: partial.salePrice,
    deal: { id: "d1", url: "https://itad.link/example-a" },
    gate: {
      score: 1,
      acceptedPrice: true,
      trustedUrl: true,
      reason: "ok",
      requestedNorm: "stranded deep",
      matchedNorm: "stranded deep",
      isShortTitle: false,
    },
    ...partial,
  };
}

describe("findMatchingTrackedOffer", () => {
  it("prefers tracked URL slot over cheaper other store", () => {
    const offers = [
      row({
        salePrice: "7.99",
        store: { id: "steam", name: "Steam" },
        deal: { id: "s1", url: "https://store.steampowered.com/app/313120/" },
        provider: "steam",
      }),
      row({
        salePrice: "6.70",
        store: { id: "gamesplanet", name: "GamesPlanet UK" },
        deal: { id: "g1", url: "https://itad.link/example-gp" },
        provider: "itad",
      }),
    ];

    const match = findMatchingTrackedOffer(offers, {
      currency: "EUR",
      provider: "itad",
      storeName: "GamesPlanet UK",
      url: "https://itad.link/example-gp",
    });

    assert.ok(match);
    assert.equal(match.deal.salePrice, "6.70");
    assert.equal(match.reason, "tracked_url_match");
  });

  it("matches store name when URL missing", () => {
    const offers = [
      row({
        salePrice: "6.70",
        store: { id: "gp", name: "GamesPlanet UK · Stranded Deep" },
      }),
    ];

    const match = findMatchingTrackedOffer(offers, {
      currency: "EUR",
      provider: "itad",
      storeName: "GamesPlanet UK",
      url: null,
    });

    assert.ok(match);
    assert.equal(match.reason, "tracked_provider_store_match");
  });
});

describe("hasTrackedOfferIdentity", () => {
  it("is false when snapshot empty", () => {
    assert.equal(
      hasTrackedOfferIdentity({
        currency: "EUR",
        provider: null,
        storeName: null,
        url: null,
      }),
      false
    );
  });
});

describe("storeNameMatchesOffer", () => {
  it("matches prefixed ITAD store labels", () => {
    assert.equal(
      storeNameMatchesOffer("GamesPlanet UK · Stranded Deep", "GamesPlanet UK"),
      true
    );
  });
});
