import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTasteDna } from "@/lib/steam-library/build-taste-dna";
import { hashTasteDnaForFitCache } from "@/lib/personal-game-fit/taste-dna-hash";

describe("hashTasteDnaForFitCache", () => {
  it("is stable for the same DNA and changes when DNA changes", () => {
    const games = [
      { title: "7 Days to Die", playtimeForever: 600 * 60 },
      { title: "Fallout: New Vegas", playtimeForever: 200 * 60 },
    ];

    const dnaA = buildTasteDna(games, "2026-05-28T12:00:00.000Z");
    const dnaB = buildTasteDna(games, "2026-05-28T12:00:00.000Z");
    const dnaC = buildTasteDna(games, "2026-05-29T12:00:00.000Z");

    assert.equal(hashTasteDnaForFitCache(dnaA), hashTasteDnaForFitCache(dnaB));
    assert.notEqual(hashTasteDnaForFitCache(dnaA), hashTasteDnaForFitCache(dnaC));
  });
});
