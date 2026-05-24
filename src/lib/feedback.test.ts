import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFeedbackContextArea } from "@/lib/feedback";

describe("resolveFeedbackContextArea", () => {
  it("maps known routes", () => {
    assert.equal(resolveFeedbackContextArea("https://gamepingai.com/"), "homepage");
    assert.equal(resolveFeedbackContextArea("https://gamepingai.com/recommend"), "recommend");
    assert.equal(
      resolveFeedbackContextArea("https://gamepingai.com/game/hades"),
      "game_page"
    );
    assert.equal(
      resolveFeedbackContextArea("https://gamepingai.com/curated/games-like-hades"),
      "curated"
    );
    assert.equal(resolveFeedbackContextArea("https://gamepingai.com/games"), "games_directory");
  });

  it("returns other for unknown paths", () => {
    assert.equal(resolveFeedbackContextArea("https://gamepingai.com/unknown-page"), "other");
  });
});
