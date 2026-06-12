import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPersonalGameFitPromptPayload,
  compactGameDescription,
  stripHtmlToText,
} from "@/lib/personal-game-fit/build-game-fit-prompt";
import { buildTasteDna } from "@/lib/steam-library/build-taste-dna";

describe("buildPersonalGameFitPromptPayload", () => {
  it("builds compact player and game payloads for AI", () => {
    const tasteDna = buildTasteDna(
      [
        { title: "7 Days to Die", playtimeForever: 600 * 60 },
        { title: "Fallout: New Vegas", playtimeForever: 200 * 60 },
      ],
      "2026-05-28T12:00:00.000Z"
    );

    const payload = buildPersonalGameFitPromptPayload({
      tasteDna,
      game: {
        rawgId: 123,
        title: "Alan Wake II",
        genres: ["Action", "Adventure"],
        tags: ["Horror", "Story Rich", "Atmospheric"],
        description: "A survival horror narrative experience.",
      },
    });

    assert.ok(payload.playerProfile.coreMotivations.length > 0);
    assert.ok(payload.playerProfile.topPlayedGames.includes("7 Days to Die"));
    assert.equal(payload.game.title, "Alan Wake II");
    assert.ok(payload.game.tags.includes("Atmospheric"));
  });
});

describe("compactGameDescription", () => {
  it("strips HTML and truncates long descriptions", () => {
    const text = stripHtmlToText("<p>Immersive <strong>world</strong>.</p>");
    assert.equal(text, "Immersive world.");

    const long = "word ".repeat(120);
    assert.ok(compactGameDescription(long).endsWith("…"));
  });
});
