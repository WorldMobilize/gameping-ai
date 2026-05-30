import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STEAM_DECK_PLATFORM_CONSTRAINT,
  collapseSteamDeckPhrase,
  detectIntentSignals,
  isHorrorKeywordShovelwareTitle,
  isSteamDeckTitleKeywordSpam,
  isUnsafeSteamDeckDiscoveryQuery,
  mergeIntentAugmentation,
  promptForRetrievalKeywords,
  sanitizeDiscoveryQueries,
  sanitizeIntentKeywordSet,
  shouldRejectCandidateForSignals,
  splitSteamDeckIntent,
} from "./intent-normalization.ts";

describe("detectIntentSignals", () => {
  it("detects Steam Deck platform prompts", () => {
    assert.equal(detectIntentSignals("games for steam deck").steamDeck, true);
    assert.equal(detectIntentSignals("steamdeck").steamDeck, true);
    assert.equal(detectIntentSignals("best steam deck games").steamDeck, true);
    assert.equal(detectIntentSignals("valve handheld").steamDeck, true);
    assert.equal(
      detectIntentSignals("steamdeck recommendations").steamDeck,
      true
    );
  });

  it("detects psychological horror (Italian)", () => {
    assert.equal(detectIntentSignals("horror psicologico").psychologicalHorror, true);
  });
});

describe("splitSteamDeckIntent", () => {
  it("marks generic Steam Deck prompts as platform-only", () => {
    const split = splitSteamDeckIntent("games for steam deck");
    assert.ok(split);
    assert.equal(split.isPlatformOnly, true);
    assert.equal(split.contentPrompt, "");
  });

  it("preserves taste intent for compound prompts", () => {
    const cozy = splitSteamDeckIntent("cozy games for steam deck");
    assert.ok(cozy);
    assert.equal(cozy.isPlatformOnly, false);
    assert.match(cozy.contentPrompt, /cozy/i);

    const roguelike = splitSteamDeckIntent("roguelikes for steam deck");
    assert.ok(roguelike);
    assert.equal(roguelike.isPlatformOnly, false);
    assert.match(roguelike.contentPrompt, /roguelike/i);
  });
});

describe("promptForRetrievalKeywords", () => {
  it("strips steam/deck tokens from retrieval keywords", () => {
    const signals = {
      steamDeck: true,
      rpgCompanionParty: false,
      psychologicalHorror: false,
    };
    assert.equal(promptForRetrievalKeywords("games for steam deck", signals), "");
    assert.match(
      promptForRetrievalKeywords("cozy games for steam deck", signals),
      /cozy/i
    );
  });
});

describe("collapseSteamDeckPhrase", () => {
  it("collapses steam deck into platform constraint token", () => {
    const out = collapseSteamDeckPhrase("games for steam deck");
    assert.match(out, /Steam Deck platform/i);
    assert.doesNotMatch(out, /\bgames for steam deck\b/i);
  });
});

describe("isSteamDeckTitleKeywordSpam", () => {
  it("flags title keyword matches", () => {
    assert.equal(isSteamDeckTitleKeywordSpam("Steam Marines"), true);
    assert.equal(isSteamDeckTitleKeywordSpam("Heck Deck"), true);
  });

  it("allows normal Steam Deck-friendly titles", () => {
    assert.equal(isSteamDeckTitleKeywordSpam("Hades"), false);
    assert.equal(isSteamDeckTitleKeywordSpam("Dead Cells"), false);
  });
});

describe("sanitizeDiscoveryQueries", () => {
  it("removes unsafe steam/deck queries", () => {
    const out = sanitizeDiscoveryQueries(
      ["steam", "deck", "games with deck"],
      { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false },
      "games for steam deck"
    );
    assert.equal(out.some((q) => q === "steam"), false);
    assert.equal(out.some((q) => q === "deck"), false);
    assert.equal(out.some((q) => q === "games with deck"), false);
    assert.ok(out.length >= 2);
  });

  it("prioritizes content intent for compound prompts", () => {
    const out = sanitizeDiscoveryQueries(
      ["steam", "cozy farming sim"],
      { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false },
      "cozy games for steam deck"
    );
    assert.ok(out.some((q) => /cozy/i.test(q)));
    assert.equal(out.some((q) => q === "steam"), false);
  });
});

describe("isUnsafeSteamDeckDiscoveryQuery", () => {
  it("blocks bare steam/deck searches", () => {
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("steam"), true);
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("deck"), true);
  });

  it("allows platform-aware queries", () => {
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("steam deck verified games"), false);
    assert.equal(
      isUnsafeSteamDeckDiscoveryQuery("popular controller friendly indie"),
      false
    );
  });
});

describe("sanitizeIntentKeywordSet", () => {
  it("removes standalone steam and deck tokens", () => {
    const out = sanitizeIntentKeywordSet(
      new Set(["steam", "deck", "indie"]),
      { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false }
    );
    assert.equal(out.has("steam"), false);
    assert.equal(out.has("deck"), false);
    assert.equal(out.has("handheld"), true);
  });
});

describe("isHorrorKeywordShovelwareTitle", () => {
  it("flags keyword-stuffed horror titles", () => {
    assert.equal(
      isHorrorKeywordShovelwareTitle(
        "Psychological Horror Puzzle Game: Puppet's Nightmare"
      ),
      true
    );
  });

  it("allows established horror titles", () => {
    assert.equal(isHorrorKeywordShovelwareTitle("SOMA"), false);
    assert.equal(isHorrorKeywordShovelwareTitle("Signalis"), false);
  });
});

describe("shouldRejectCandidateForSignals", () => {
  it("rejects Steam Deck title keyword spam", () => {
    assert.equal(
      shouldRejectCandidateForSignals(
        { name: "Heck Deck", genres: [{ name: "Strategy" }] },
        { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false }
      ),
      true
    );
  });
});

describe("mergeIntentAugmentation", () => {
  it("platform-only prompts get platform-focused normalized intent", () => {
    const merged = mergeIntentAugmentation(
      {
        normalizedIntent: "games for steam deck",
        coreNeeds: [],
        avoid: [],
        fallbackDiscoveryQueries: ["steam", "deck"],
      },
      { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false },
      "games for steam deck"
    );
    assert.match(merged.normalizedIntent, /Steam Deck/i);
    assert.equal(
      merged.fallbackDiscoveryQueries.some((q) => q === "steam"),
      false
    );
    assert.ok(merged.coreNeeds.some((n) => /controller-friendly/i.test(n)));
  });

  it("compound prompts keep taste intent primary", () => {
    const merged = mergeIntentAugmentation(
      {
        normalizedIntent: "cozy games for steam deck",
        coreNeeds: [],
        avoid: [],
        fallbackDiscoveryQueries: ["steam deck games"],
      },
      { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false },
      "cozy games for steam deck"
    );
    assert.match(merged.normalizedIntent, /cozy/i);
    assert.match(merged.normalizedIntent, /Steam Deck/i);
    assert.ok(
      merged.fallbackDiscoveryQueries.some((q) => /cozy/i.test(q))
    );
    assert.match(merged.normalizedIntent, new RegExp(STEAM_DECK_PLATFORM_CONSTRAINT.slice(0, 12)));
  });
});
