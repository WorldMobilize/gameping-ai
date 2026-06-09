import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFeedbackRecommendContext,
  FEEDBACK_RECOMMEND_CONTEXT_MAX_BYTES,
  FEEDBACK_RECOMMEND_CONTEXT_MAX_GAMES,
  feedbackRecommendContextByteSize,
  sanitizeFeedbackRecommendContext,
} from "@/lib/feedback-recommend-context";

describe("buildFeedbackRecommendContext", () => {
  it("builds a minimal context", () => {
    const ctx = buildFeedbackRecommendContext({
      prompt: "games everyone should play once",
      games: [
        { title: "Hades", match: 92, matchTier: "best_match" },
        { title: "Journey", match: 85, matchTier: "good_alternative" },
      ],
    });
    assert.ok(ctx);
    assert.equal(ctx!.version, 1);
    assert.equal(ctx!.prompt, "games everyone should play once");
    assert.equal(ctx!.games.length, 2);
    assert.equal(ctx!.isRefine, false);
    assert.equal(ctx!.originalPrompt, undefined);
  });

  it("includes refine fields when isRefine is true", () => {
    const ctx = buildFeedbackRecommendContext({
      prompt: "cozy RPG",
      games: [{ title: "Stardew Valley", match: 80 }],
      isRefine: true,
      originalPrompt: "cozy RPG",
      refineMessage: "less farming, more story",
    });
    assert.ok(ctx);
    assert.equal(ctx!.isRefine, true);
    assert.equal(ctx!.originalPrompt, "cozy RPG");
    assert.equal(ctx!.refineMessage, "less farming, more story");
  });

  it("caps games at six", () => {
    const games = Array.from({ length: 10 }, (_, i) => ({
      title: `Game ${i + 1}`,
      match: 70 + i,
    }));
    const ctx = buildFeedbackRecommendContext({
      prompt: "many games",
      games,
    });
    assert.ok(ctx);
    assert.equal(ctx!.games.length, FEEDBACK_RECOMMEND_CONTEXT_MAX_GAMES);
  });
});

describe("sanitizeFeedbackRecommendContext", () => {
  it("strips unknown fields and invalid games", () => {
    const ctx = sanitizeFeedbackRecommendContext({
      version: 1,
      prompt: "story RPG",
      games: [
        { title: "Mass Effect", match: 90, matchTier: "best_match", reason: "strip me" },
        { title: "", match: 50 },
        { title: "Bad", match: "nope" },
      ],
      isRefine: false,
      resultedAt: "2026-05-28T12:00:00.000Z",
      image: "https://example.com/x.jpg",
      price: "19.99",
    });
    assert.ok(ctx);
    assert.equal(ctx!.games.length, 1);
    assert.equal(ctx!.games[0]?.title, "Mass Effect");
    assert.equal((ctx as Record<string, unknown>).image, undefined);
  });

  it("rejects invalid version and oversize payload", () => {
    assert.equal(sanitizeFeedbackRecommendContext({ version: 2, prompt: "x", games: [] }), null);
    const huge = buildFeedbackRecommendContext({
      prompt: "x".repeat(500),
      games: Array.from({ length: 6 }, () => ({
        title: "A".repeat(200),
        match: 99,
        matchTier: "best_match",
      })),
    });
    assert.ok(huge);
    assert.ok(feedbackRecommendContextByteSize(huge!) <= FEEDBACK_RECOMMEND_CONTEXT_MAX_BYTES);
  });

  it("clamps match to 0-100", () => {
    const ctx = sanitizeFeedbackRecommendContext({
      version: 1,
      prompt: "test",
      games: [{ title: "Game", match: 150 }],
      isRefine: false,
      resultedAt: "2026-05-28T12:00:00.000Z",
    });
    assert.equal(ctx?.games[0]?.match, 100);
  });
});
