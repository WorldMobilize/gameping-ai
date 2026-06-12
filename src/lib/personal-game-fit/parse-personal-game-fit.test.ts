import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOwnedPersonalGameFit,
  parsePersonalGameFit,
} from "@/lib/personal-game-fit/parse-personal-game-fit";

describe("parsePersonalGameFit", () => {
  it("parses a valid AI fit payload", () => {
    const fit = parsePersonalGameFit({
      fitTier: "different_but_worth_trying",
      fitScore: 58,
      headline: "Different from your usual games, but you may enjoy it",
      whyYouMayLike: [
        "You enjoy immersive worlds and atmosphere.",
        "Your Fallout playtime suggests you like attention to world detail.",
      ],
      potentialConcerns: [
        "More linear than your usual sandbox-heavy games.",
        "Less long-term progression than 7 Days to Die.",
      ],
    });

    assert.ok(fit);
    assert.equal(fit.fitTier, "different_but_worth_trying");
    assert.equal(fit.fitScore, 58);
    assert.equal(fit.whyYouMayLike.length, 2);
    assert.equal(fit.potentialConcerns.length, 2);
  });

  it("rejects invalid payloads", () => {
    assert.equal(parsePersonalGameFit(null), null);
    assert.equal(parsePersonalGameFit({ fitTier: "nope", fitScore: 10 }), null);
    assert.equal(
      parsePersonalGameFit({
        fitTier: "good_fit",
        fitScore: 200,
        headline: "Too high score",
      })?.fitScore,
      100
    );
  });
});

describe("buildOwnedPersonalGameFit", () => {
  it("returns an owned-library fit card", () => {
    const fit = buildOwnedPersonalGameFit("Fallout: New Vegas");
    assert.equal(fit.fitTier, "owned");
    assert.equal(fit.fitScore, 100);
    assert.ok(fit.headline.includes("Steam library"));
    assert.ok(fit.whyYouMayLike[0]?.includes("Fallout: New Vegas"));
  });
});
