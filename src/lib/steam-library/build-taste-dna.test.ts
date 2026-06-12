import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTasteDna, buildTasteDnaV1 } from "@/lib/steam-library/build-taste-dna";
import {
  isTasteDna,
  isTasteDnaV1,
  isTasteDnaV2,
  TASTE_DNA_V2_VERSION,
} from "@/lib/steam-library/taste-dna-types";

const FIXTURE_GAMES = [
  { title: "7 Days to Die", playtimeForever: 600 * 60 },
  { title: "Fallout: New Vegas", playtimeForever: 200 * 60 },
  { title: "Fallout 4", playtimeForever: 100 * 60 },
  { title: "Farming Simulator 22", playtimeForever: 100 * 60 },
  { title: "Phasmophobia", playtimeForever: 50 * 60 },
  { title: "The Sims 4", playtimeForever: 80 * 60 },
];

const SANDBOX_FIXTURE = [
  { title: "7 Days to Die", playtimeForever: 600 * 60 },
  { title: "Fallout: New Vegas", playtimeForever: 200 * 60 },
  { title: "Fallout 4", playtimeForever: 100 * 60 },
];

describe("buildTasteDna v2", () => {
  it("builds motivation-level DNA for sandbox RPG players", () => {
    const dna = buildTasteDna(SANDBOX_FIXTURE, "2026-05-28T12:00:00.000Z");

    assert.equal(dna.version, TASTE_DNA_V2_VERSION);
    assert.equal(dna.playerArchetype, "The Sandbox Explorer");
    assert.ok(dna.summary.toLowerCase().includes("freedom"));
    assert.ok(dna.coreMotivations.length >= 2);

    const traits = dna.coreMotivations.map((m) => m.trait);
    assert.ok(traits.includes("Player freedom"));
    assert.ok(
      traits.some((trait) =>
        /sandbox|emergent|survival|progression/i.test(trait)
      )
    );

    const freedom = dna.coreMotivations.find((m) => m.trait === "Player freedom");
    assert.ok(freedom);
    assert.ok(freedom.confidence >= 0.8);
    assert.ok(freedom.evidence.includes("Fallout: New Vegas"));
    assert.ok(freedom.reason.length > 20);

    const likesText = dna.likes.join(" ").toLowerCase();
    assert.ok(likesText.includes("open-ended") || likesText.includes("agency"));
    assert.ok(
      likesText.includes("progression") || likesText.includes("choice")
    );
    assert.ok(dna.avoidLikely.some((item) => /linear/i.test(item)));
    assert.ok(
      dna.recommendationHints.some((hint) => /agency|emergent/i.test(hint))
    );
  });

  it("infers mixed-library motivations from a broader Steam library", () => {
    const dna = buildTasteDna(FIXTURE_GAMES, "2026-05-28T12:00:00.000Z");

    assert.equal(dna.stats.ownedCount, 6);
    assert.equal(dna.stats.playedCount, 6);
    assert.equal(dna.stats.totalPlaytimeMin, 1130 * 60);
    assert.ok(dna.ownedTitleNorms.includes("fallout: new vegas"));
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
    assert.ok(dna.coreMotivations.length > 0);
    assert.ok(!dna.favoriteSignals.includes("Unplayed Bundle Game"));
  });
});

describe("taste DNA compatibility", () => {
  it("validates v1 and v2 payloads", () => {
    const v1 = buildTasteDnaV1(
      [{ title: "Hades", playtimeForever: 120 * 60 }],
      "2026-05-28T12:00:00.000Z"
    );
    const v2 = buildTasteDna(
      [{ title: "Hades", playtimeForever: 120 * 60 }],
      "2026-05-28T12:00:00.000Z"
    );

    assert.ok(isTasteDnaV1(v1));
    assert.ok(isTasteDnaV2(v2));
    assert.ok(isTasteDna(v1));
    assert.ok(isTasteDna(v2));
    assert.ok(!isTasteDnaV2(v1));
    assert.ok(!isTasteDnaV1(v2));
  });
});
