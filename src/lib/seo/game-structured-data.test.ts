import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAggregateRatingJsonLd,
  buildVideoGameJsonLd,
  resolveSchemaRatingCount,
} from "./game-structured-data";

describe("resolveSchemaRatingCount", () => {
  it("prefers ratingCount then ratings_count", () => {
    assert.equal(resolveSchemaRatingCount({ ratingCount: 10 }), 10);
    assert.equal(resolveSchemaRatingCount({ ratings_count: 500 }), 500);
    assert.equal(
      resolveSchemaRatingCount({ ratingCount: 1, ratings_count: 999 }),
      1
    );
  });

  it("rejects zero, negative, and non-finite", () => {
    assert.equal(resolveSchemaRatingCount({ ratings_count: 0 }), null);
    assert.equal(resolveSchemaRatingCount({ ratings_count: -1 }), null);
    assert.equal(resolveSchemaRatingCount({ ratings_count: NaN }), null);
  });

  it("floors positive fractional counts", () => {
    assert.equal(resolveSchemaRatingCount({ ratings_count: 12.9 }), 12);
  });
});

describe("buildVideoGameJsonLd aggregateRating", () => {
  const base = {
    name: "Hades",
    path: "/game/hades",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Hades" }],
  };

  it("includes aggregateRating when rating and count exist", () => {
    const json = buildVideoGameJsonLd({
      ...base,
      rating: 4.5,
      ratingCount: 1234,
    }) as { aggregateRating?: Record<string, unknown> };

    assert.deepEqual(json.aggregateRating, buildAggregateRatingJsonLd(4.5, 1234));
  });

  it("omits aggregateRating when count is missing", () => {
    const json = buildVideoGameJsonLd({
      ...base,
      rating: 4.5,
    }) as { aggregateRating?: unknown };

    assert.equal("aggregateRating" in json, false);
  });

  it("omits aggregateRating when rating is missing", () => {
    const json = buildVideoGameJsonLd({
      ...base,
      ratingCount: 100,
    }) as { aggregateRating?: unknown };

    assert.equal("aggregateRating" in json, false);
  });
});
