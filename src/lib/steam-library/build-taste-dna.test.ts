import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTasteDna } from "@/lib/steam-library/build-taste-dna";

const FIXTURE_GAMES = [
  { title: "7 Days to Die", playtimeForever: 600 * 60 },
  { title: "Fallout: New Vegas", playtimeForever: 200 * 60 },
  { title: "Fallout 4", playtimeForever: 100 * 60 },
  { title: "Farming Simulator 22", playtimeForever: 100 * 60 },
  { title: "Phasmophobia", playtimeForever: 50 * 60 },
  { title: "The Sims 4", playtimeForever: 80 * 60 },
];

describe("buildTasteDna", () => {
  it("infers survival, RPG, and simulation signals from a mixed Steam library", () => {
    const dna = buildTasteDna(FIXTURE_GAMES, "2026-05-28T12:00:00.000Z");
    const likesText = dna.likes.join(" ").toLowerCase();

    assert.equal(dna.version, 1);
    assert.equal(dna.computedAt, "2026-05-28T12:00:00.000Z");
    assert.ok(likesText.includes("survival"));
    assert.ok(
      likesText.includes("rpg") ||
        likesText.includes("open world") ||
        likesText.includes("player freedom")
    );
    assert.ok(likesText.includes("simulation") || likesText.includes("sandbox"));
    assert.equal(dna.stats.ownedCount, 6);
    assert.equal(dna.stats.playedCount, 6);
    assert.equal(dna.stats.totalPlaytimeMin, 1130 * 60);
    assert.ok(dna.ownedTitleNorms.includes("fallout: new vegas"));
  });

  it("weights top-played games as favorite signals", () => {
    const dna = buildTasteDna(FIXTURE_GAMES, "2026-05-28T12:00:00.000Z");

    assert.deepEqual(dna.favoriteSignals.slice(0, 3), [
      "7 Days to Die",
      "Fallout: New Vegas",
      "Fallout 4",
    ]);
  });

  it("ignores very low playtime games for taste signals", () => {
    const dna = buildTasteDna(
      [
        { title: "7 Days to Die", playtimeForever: 600 * 60 },
        { title: "Unplayed Bundle Game", playtimeForever: 5 },
      ],
      "2026-05-28T12:00:00.000Z"
    );

    assert.equal(dna.stats.ownedCount, 2);
    assert.equal(dna.stats.playedCount, 1);
    assert.ok(dna.likes.some((like) => like.toLowerCase().includes("survival")));
    assert.ok(!dna.favoriteSignals.includes("Unplayed Bundle Game"));
  });
});
