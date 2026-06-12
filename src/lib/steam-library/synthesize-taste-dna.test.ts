import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTasteDna } from "@/lib/steam-library/build-taste-dna";
import { applyTasteDnaEnrichment } from "@/lib/steam-library/taste-dna-enrichment";

describe("applyTasteDnaEnrichment", () => {
  it("merges AI copy without changing evidence or confidence", () => {
    const base = buildTasteDna(
      [
        { title: "Fallout: New Vegas", playtimeForever: 200 * 60 },
        { title: "7 Days to Die", playtimeForever: 600 * 60 },
      ],
      "2026-05-28T12:00:00.000Z"
    );

    const enriched = applyTasteDnaEnrichment(base, {
      playerArchetype: "The Emergent Worldbuilder",
      summary:
        "You prefer games where you create your own stories through freedom, exploration, and long term progression.",
      coreMotivations: [
        {
          trait: "Player freedom",
          reason:
            "Your longest sessions sit in games where plans change and outcomes emerge from your choices.",
        },
      ],
      likes: ["open-ended worlds", "character progression", "meaningful choices"],
      avoidLikely: ["very linear progression"],
      recommendationHints: [
        "prioritize player agency over genre matching",
        "look for emergent gameplay",
      ],
    });

    assert.equal(enriched.enrichedByAi, true);
    assert.equal(enriched.playerArchetype, "The Emergent Worldbuilder");
    assert.ok(enriched.summary.includes("create your own stories"));
    assert.equal(enriched.coreMotivations[0]?.trait, "Player freedom");
    assert.equal(
      enriched.coreMotivations[0]?.confidence,
      base.coreMotivations[0]?.confidence
    );
    assert.deepEqual(
      enriched.coreMotivations[0]?.evidence,
      base.coreMotivations[0]?.evidence
    );
    assert.deepEqual(enriched.likes, [
      "open-ended worlds",
      "character progression",
      "meaningful choices",
    ]);
  });
});
