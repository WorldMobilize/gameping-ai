import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STEAM_DECK_PLATFORM_CONSTRAINT,
  collapseSteamDeckPhrase,
  detectIntentSignals,
  detectResultCountPolicy,
  extractMustHaveConstraints,
  EMPTY_INTENT_SIGNALS,
  isDiscoveryShovelwareTitle,
  isRawgFallbackFillerPick,
  isStrongFastPick,
  scoreMustHaveConstraintBoost,
  violatesMustHaveConstraints,
  isHorrorKeywordShovelwareTitle,
  isSteamDeckTitleKeywordSpam,
  isUnsafeDiscoveryQuery,
  isUnsafeSteamDeckDiscoveryQuery,
  mergeIntentAugmentation,
  promptForRetrievalKeywords,
  sanitizeDiscoveryQueries,
  sanitizeIntentKeywordSet,
  reorderFastPicksByRelevance,
  shouldRejectCandidateForSignals,
  splitSteamDeckIntent,
} from "./intent-normalization.ts";

function sig(overrides: Partial<typeof EMPTY_INTENT_SIGNALS> = {}) {
  return { ...EMPTY_INTENT_SIGNALS, ...overrides };
}

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

  it("detects memorable discovery prompts", () => {
    const tired = detectIntentSignals(
      "I'm tired of AAA games. Surprise me with something unforgettable that I'll still be thinking about a week later."
    );
    assert.equal(tired.memorableDiscovery, true);
    assert.equal(tired.discoverySubkind, "anti_aaa");

    const lonely = detectIntentSignals(
      "I want a game that makes me feel genuinely lonely, but in a beautiful way."
    );
    assert.equal(lonely.memorableDiscovery, true);
    assert.equal(lonely.discoverySubkind, "lonely_beautiful");

    const underrated = detectIntentSignals(
      "Find me underrated games under $10 that feel special."
    );
    assert.equal(underrated.memorableDiscovery, true);
    assert.equal(underrated.discoverySubkind, "underrated");
  });

  it("detects cozy short session prompts", () => {
    const cozy = detectIntentSignals(
      "I want a relaxing cozy game for short evening sessions."
    );
    assert.equal(cozy.cozyShortSession, true);
    assert.equal(cozy.discoverySubkind, "cozy_short");
  });
});

describe("detectResultCountPolicy", () => {
  it("marks social/multiplayer prompts as broad", () => {
    assert.equal(
      detectResultCountPolicy("Games to play with friends", EMPTY_INTENT_SIGNALS),
      "broad"
    );
  });

  it("marks emotional discovery prompts as quality_first", () => {
    const signals = detectIntentSignals(
      "I want a game that makes me feel genuinely lonely, but in a beautiful way."
    );
    assert.equal(
      detectResultCountPolicy(
        "I want a game that makes me feel genuinely lonely, but in a beautiful way.",
        signals
      ),
      "quality_first"
    );
  });

  it("marks highly specific constraint prompts as quality_first", () => {
    assert.equal(
      detectResultCountPolicy(
        "Fantasy strategy game with elves, orcs, multiple races, village building and faction management",
        EMPTY_INTENT_SIGNALS
      ),
      "quality_first"
    );
  });

  it("keeps cozy evening prompts balanced", () => {
    const signals = detectIntentSignals(
      "I want a relaxing cozy game for short evening sessions."
    );
    assert.equal(
      detectResultCountPolicy(
        "I want a relaxing cozy game for short evening sessions.",
        signals
      ),
      "balanced"
    );
  });
});

const FANTASY_STRATEGY_PROMPT =
  "Fantasy strategy game with elves, orcs, multiple races, village building and faction management.";

describe("extractMustHaveConstraints", () => {
  it("extracts fantasy race strategy must-haves", () => {
    const c = extractMustHaveConstraints(FANTASY_STRATEGY_PROMPT, EMPTY_INTENT_SIGNALS);
    assert.equal(c.active, true);
    assert.ok(c.settings.includes("fantasy"));
    assert.ok(c.races.includes("elves"));
    assert.ok(c.races.includes("orcs"));
    assert.ok(c.mechanics.includes("strategy"));
    assert.ok(c.mechanics.includes("base-building"));
    assert.ok(c.mechanics.includes("faction-management"));
  });

  it("stays inactive for broad friends prompts", () => {
    assert.equal(
      extractMustHaveConstraints("Games to play with friends", EMPTY_INTENT_SIGNALS).active,
      false
    );
  });

  it("stays inactive for platform-only Steam Deck prompts", () => {
    const signals = detectIntentSignals("games for steam deck");
    assert.equal(
      extractMustHaveConstraints("games for steam deck", signals).active,
      false
    );
  });

  it("augments queries via merge for fantasy strategy", () => {
    const merged = mergeIntentAugmentation(
      {
        normalizedIntent: FANTASY_STRATEGY_PROMPT,
        coreNeeds: [],
        avoid: [],
        fallbackDiscoveryQueries: ["strategy factions", "city building"],
      },
      EMPTY_INTENT_SIGNALS,
      FANTASY_STRATEGY_PROMPT
    );
    assert.ok(merged.fallbackDiscoveryQueries.some((q) => /fantasy RTS/i.test(q)));
    assert.ok(merged.fallbackDiscoveryQueries.some((q) => /orcs elves/i.test(q)));
    assert.ok(merged.avoid.some((a) => /sci-fi/i.test(a)));
  });
});

describe("scoreMustHaveConstraintBoost", () => {
  it("heavily penalizes sci-fi strategy when fantasy races are required", () => {
    const constraints = extractMustHaveConstraints(
      FANTASY_STRATEGY_PROMPT,
      EMPTY_INTENT_SIGNALS
    );
    const planetfall = scoreMustHaveConstraintBoost(
      {
        name: "Age of Wonders: Planetfall",
        genres: [{ name: "Strategy" }, { name: "Sci-fi" }],
        tags: [{ name: "Turn-Based Strategy" }],
      },
      constraints
    );
    const spellforce = scoreMustHaveConstraintBoost(
      {
        name: "SpellForce 3",
        genres: [{ name: "Strategy" }, { name: "RPG" }],
        tags: [{ name: "Fantasy" }],
      },
      constraints
    );
    assert.ok(planetfall < -40);
    assert.ok(spellforce > planetfall);
  });

  it("rejects clear setting contradictions", () => {
    const constraints = extractMustHaveConstraints(
      FANTASY_STRATEGY_PROMPT,
      EMPTY_INTENT_SIGNALS
    );
    assert.equal(
      violatesMustHaveConstraints(
        {
          name: "Age of Wonders: Planetfall",
          genres: [{ name: "Strategy" }, { name: "Sci-fi" }],
          tags: [],
        },
        constraints
      ),
      true
    );
    assert.equal(
      violatesMustHaveConstraints(
        {
          name: "SpellForce 3",
          genres: [{ name: "Strategy" }],
          tags: [{ name: "Fantasy" }],
        },
        constraints
      ),
      false
    );
  });
});

describe("isStrongFastPick", () => {
  it("rejects RAWG fallback filler rows", () => {
    assert.equal(
      isStrongFastPick({
        pick: { match: 62, matchTier: "good_alternative", reason: "" },
        relevanceBoost: 0,
      }),
      false
    );
    assert.equal(isRawgFallbackFillerPick({ match: 62, reason: "" }), true);
  });

  it("accepts high-confidence best_match picks", () => {
    assert.equal(
      isStrongFastPick({
        pick: { match: 88, matchTier: "best_match", reason: "Fits the mood." },
        relevanceBoost: 10,
      }),
      true
    );
  });
});

describe("reorderFastPicksByRelevance", () => {
  it("does not restore dropped weak picks for quality_first", () => {
    const picks = [
      { id: 1, match: 90, matchTier: "best_match" as const, reason: "Strong" },
      { id: 2, match: 88, matchTier: "best_match" as const, reason: "Strong" },
      { id: 3, match: 58, matchTier: "partial_match" as const, reason: "Weak" },
    ];
    const candidates = new Map([
      [1, { name: "Gris", genres: [{ name: "Adventure" }], tags: [], ratings_count: 9000 }],
      [2, { name: "Ethan Carter", genres: [{ name: "Adventure" }], tags: [], ratings_count: 8000 }],
      [
        3,
        {
          name: "loneliness.",
          genres: [{ name: "Indie" }],
          tags: [],
          ratings_count: 40,
        },
      ],
    ]);
    const signals = detectIntentSignals(
      "I want a game that makes me feel genuinely lonely, but in a beautiful way."
    );
    const out = reorderFastPicksByRelevance({
      picks,
      getCandidate: (id) => candidates.get(id),
      signals,
      userPrompt:
        "I want a game that makes me feel genuinely lonely, but in a beautiful way.",
      normalizedIntent: "Melancholic atmospheric games",
      coreNeeds: [],
      resultCountPolicy: "quality_first",
    });
    assert.equal(out.length, 2);
    assert.equal(out.some((p) => p.id === 3), false);
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
    const signals = sig({ steamDeck: true });
    assert.equal(promptForRetrievalKeywords("games for steam deck", signals), "");
    assert.match(
      promptForRetrievalKeywords("cozy games for steam deck", signals),
      /cozy/i
    );
  });

  it("strips discovery fluff from retrieval keywords", () => {
    const signals = sig({ memorableDiscovery: true, discoverySubkind: "anti_aaa" });
    const out = promptForRetrievalKeywords(
      "I'm tired of AAA games. Surprise me with something unforgettable.",
      signals
    );
    assert.doesNotMatch(out, /surprise me/i);
    assert.doesNotMatch(out, /unforgettable/i);
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
      sig({ steamDeck: true }),
      "games for steam deck"
    );
    assert.equal(out.some((q) => q === "steam"), false);
    assert.equal(out.some((q) => q === "deck"), false);
    assert.equal(out.some((q) => q === "games with deck"), false);
    assert.ok(out.length >= 2);
  });

  it("replaces weak discovery queries with high-signal pools", () => {
    const out = sanitizeDiscoveryQueries(
      ["surprise", "experience", "indie"],
      sig({ memorableDiscovery: true, discoverySubkind: "anti_aaa" }),
      "I'm tired of AAA games. Surprise me with something unforgettable."
    );
    assert.equal(out.some((q) => q === "surprise"), false);
    assert.equal(out.some((q) => q === "experience"), false);
    assert.ok(out.some((q) => /cult classic indie/i.test(q)));
    assert.ok(out.some((q) => /memorable narrative/i.test(q)));
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

describe("isDiscoveryShovelwareTitle", () => {
  it("flags common discovery fallback junk", () => {
    assert.equal(isDiscoveryShovelwareTitle("Indie Game Battle"), true);
    assert.equal(isDiscoveryShovelwareTitle("Richie's Plank Experience"), true);
    assert.equal(isDiscoveryShovelwareTitle("loneliness."), true);
    assert.equal(isDiscoveryShovelwareTitle("R.I.C.E"), true);
  });

  it("allows established titles", () => {
    assert.equal(isDiscoveryShovelwareTitle("Outer Wilds"), false);
    assert.equal(isDiscoveryShovelwareTitle("Gris"), false);
  });
});

describe("isUnsafeDiscoveryQuery", () => {
  it("blocks bare fluff queries", () => {
    assert.equal(isUnsafeDiscoveryQuery("surprise"), true);
    assert.equal(isUnsafeDiscoveryQuery("experience"), true);
    assert.equal(isUnsafeDiscoveryQuery("indie game battle"), true);
  });

  it("allows high-signal queries", () => {
    assert.equal(isUnsafeDiscoveryQuery("cult classic indie games"), false);
    assert.equal(isUnsafeDiscoveryQuery("memorable narrative indie games"), false);
  });
});

describe("sanitizeIntentKeywordSet", () => {
  it("removes standalone steam and deck tokens", () => {
    const out = sanitizeIntentKeywordSet(
      new Set(["steam", "deck", "indie"]),
      sig({ steamDeck: true })
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
        sig({ steamDeck: true })
      ),
      true
    );
  });

  it("rejects discovery shovelware titles", () => {
    assert.equal(
      shouldRejectCandidateForSignals(
        { name: "Indie Game Battle", genres: [{ name: "Action" }] },
        sig({ memorableDiscovery: true, discoverySubkind: "anti_aaa" })
      ),
      true
    );
  });

  it("rejects fantasy-contradicting candidates when must-haves active", () => {
    assert.equal(
      shouldRejectCandidateForSignals(
        {
          name: "Age of Wonders: Planetfall",
          genres: [{ name: "Strategy" }, { name: "Sci-fi" }],
          tags: [],
        },
        EMPTY_INTENT_SIGNALS,
        FANTASY_STRATEGY_PROMPT
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
      sig({ steamDeck: true }),
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
      sig({ steamDeck: true }),
      "cozy games for steam deck"
    );
    assert.match(merged.normalizedIntent, /cozy/i);
    assert.match(merged.normalizedIntent, /Steam Deck/i);
    assert.ok(
      merged.fallbackDiscoveryQueries.some((q) => /cozy/i.test(q))
    );
    assert.match(merged.normalizedIntent, new RegExp(STEAM_DECK_PLATFORM_CONSTRAINT.slice(0, 12)));
  });

  it("memorable discovery augments queries and intent", () => {
    const merged = mergeIntentAugmentation(
      {
        normalizedIntent: "surprise me",
        coreNeeds: [],
        avoid: [],
        fallbackDiscoveryQueries: ["surprise", "experience"],
      },
      sig({ memorableDiscovery: true, discoverySubkind: "anti_aaa" }),
      "I'm tired of AAA games. Surprise me with something unforgettable."
    );
    assert.match(merged.normalizedIntent, /not mainstream AAA|Distinctive memorable/i);
    assert.equal(merged.fallbackDiscoveryQueries.some((q) => q === "surprise"), false);
    assert.ok(merged.fallbackDiscoveryQueries.some((q) => /cult classic/i.test(q)));
    assert.ok(merged.avoid.some((a) => /shovelware/i.test(a)));
  });
});
