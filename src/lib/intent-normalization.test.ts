import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STEAM_DECK_PLATFORM_INTENT,
  collapseSteamDeckPhrase,
  detectIntentSignals,
  isHorrorKeywordShovelwareTitle,
  isSteamDeckTitleKeywordSpam,
  isUnsafeSteamDeckDiscoveryQuery,
  mergeIntentAugmentation,
  sanitizeDiscoveryQueries,
  sanitizeIntentKeywordSet,
  shouldRejectCandidateForSignals,
} from "./intent-normalization.ts";

describe("detectIntentSignals", () => {
  it("detects Steam Deck platform prompts", () => {
    assert.equal(detectIntentSignals("games for steam deck").steamDeck, true);
    assert.equal(detectIntentSignals("steamdeck").steamDeck, true);
    assert.equal(detectIntentSignals("best steam deck games").steamDeck, true);
    assert.equal(detectIntentSignals("valve handheld").steamDeck, true);
  });

  it("detects psychological horror (Italian)", () => {
    assert.equal(detectIntentSignals("horror psicologico").psychologicalHorror, true);
  });
});

describe("collapseSteamDeckPhrase", () => {
  it("collapses steam deck into protected platform intent", () => {
    const out = collapseSteamDeckPhrase("games for steam deck");
    assert.match(out, /Steam Deck-compatible handheld PC games/i);
    assert.doesNotMatch(out, /\bgames for steam deck\b/i);
  });
});

describe("isSteamDeckTitleKeywordSpam", () => {
  it("flags title keyword matches", () => {
    assert.equal(isSteamDeckTitleKeywordSpam("Steam Marines"), true);
    assert.equal(isSteamDeckTitleKeywordSpam("Heck Deck"), true);
    assert.equal(isSteamDeckTitleKeywordSpam("Gestalt: Steam & Cinder"), true);
    assert.equal(isSteamDeckTitleKeywordSpam("Steam Bandits: Outpost"), true);
  });

  it("allows normal Steam Deck-friendly titles", () => {
    assert.equal(isSteamDeckTitleKeywordSpam("Hades"), false);
    assert.equal(isSteamDeckTitleKeywordSpam("Balatro"), false);
    assert.equal(isSteamDeckTitleKeywordSpam("Vampire Survivors"), false);
    assert.equal(isSteamDeckTitleKeywordSpam("Slay the Spire"), false);
  });
});

describe("sanitizeDiscoveryQueries", () => {
  it("replaces unsafe steam/deck queries with handheld-friendly fallbacks", () => {
    const out = sanitizeDiscoveryQueries(
      ["steam", "deck", "games with deck", "steam deck verified games"],
      { steamDeck: true, rpgCompanionParty: false, psychologicalHorror: false }
    );
    assert.ok(out.some((q) => /handheld-friendly/i.test(q)));
    assert.ok(out.some((q) => /steam deck verified/i.test(q)));
    assert.equal(out.some((q) => q === "steam"), false);
    assert.equal(out.some((q) => q === "deck"), false);
    assert.equal(out.some((q) => q === "games with deck"), false);
  });
});

describe("isUnsafeSteamDeckDiscoveryQuery", () => {
  it("blocks bare steam/deck searches", () => {
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("steam"), true);
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("deck"), true);
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("games with deck"), true);
  });

  it("allows platform-aware queries", () => {
    assert.equal(isUnsafeSteamDeckDiscoveryQuery("steam deck verified games"), false);
    assert.equal(
      isUnsafeSteamDeckDiscoveryQuery("best handheld-friendly PC games"),
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
    assert.equal(
      isHorrorKeywordShovelwareTitle("Prelude: Psychological Horror Game"),
      true
    );
  });

  it("allows established horror titles", () => {
    assert.equal(isHorrorKeywordShovelwareTitle("SOMA"), false);
    assert.equal(isHorrorKeywordShovelwareTitle("Signalis"), false);
    assert.equal(isHorrorKeywordShovelwareTitle("Amnesia: The Dark Descent"), false);
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

  it("rejects horror shovelware", () => {
    assert.equal(
      shouldRejectCandidateForSignals(
        {
          name: "Prelude: Psychological Horror Game",
          genres: [{ name: "Adventure" }],
        },
        { steamDeck: false, rpgCompanionParty: false, psychologicalHorror: true }
      ),
      true
    );
  });
});

describe("mergeIntentAugmentation", () => {
  it("rewrites normalized intent for Steam Deck", () => {
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
    assert.match(merged.normalizedIntent, /Steam Deck-compatible/i);
    assert.equal(
      merged.fallbackDiscoveryQueries.some((q) => q === "steam"),
      false
    );
    assert.ok(merged.fallbackDiscoveryQueries.length > 0);
    assert.match(merged.normalizedIntent, new RegExp(STEAM_DECK_PLATFORM_INTENT.slice(0, 20)));
  });
});
