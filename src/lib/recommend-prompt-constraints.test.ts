import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractPromptConstraints,
  hasPlayerDeductionGameplay,
  isPassiveDetectiveExperience,
  isStoryOnlyAdventureMismatch,
  scorePromptConstraintBoost,
  violatesPromptConstraints,
} from "./recommend-prompt-constraints.ts";

function mockCandidate(
  name: string,
  genres: string[] = [],
  tags: string[] = []
) {
  return {
    name,
    genres: genres.map((g) => ({ name: g })),
    tags: tags.map((t) => ({ name: t })),
  };
}

describe("extractPromptConstraints", () => {
  it("detects story RPG with anti-grind requirements", () => {
    const c = extractPromptConstraints(
      "I want an RPG with a great story but I hate grinding and difficult combat"
    );
    assert.equal(c.active, true);
    assert.ok(c.genreIdentity.includes("rpg"));
    assert.ok(c.avoidRequirements.includes("grind"));
    assert.ok(c.avoidRequirements.includes("difficult-combat"));
  });

  it("detects smaller Witcher-like accessible RPG", () => {
    const c = extractPromptConstraints(
      "I want something like The Witcher 3 but smaller and less overwhelming"
    );
    assert.equal(c.active, true);
    assert.ok(c.genreIdentity.includes("rpg"));
    assert.ok(c.gameplayRequirements.includes("accessible"));
    assert.ok(c.avoidRequirements.includes("overwhelming"));
  });

  it("detects detective deduction requirements", () => {
    const c = extractPromptConstraints(
      "I want a detective game where I actually have to think and solve the mystery myself"
    );
    assert.equal(c.active, true);
    assert.ok(c.genreIdentity.includes("detective"));
    assert.ok(c.gameplayRequirements.includes("player-deduction"));
  });
});

describe("scorePromptConstraintBoost", () => {
  it("penalizes story-only adventures for RPG prompts", () => {
    const constraints = extractPromptConstraints(
      "I want an RPG with a great story but I hate grinding"
    );
    const firewatch = mockCandidate("Firewatch", ["Adventure"], ["Narrative"]);
    const massEffect = mockCandidate("Mass Effect", ["RPG", "Action"], ["Story Rich"]);

    const fw = scorePromptConstraintBoost(firewatch, constraints);
    const me = scorePromptConstraintBoost(massEffect, constraints);
    assert.ok(fw < -40);
    assert.ok(me > fw);
    assert.ok(isStoryOnlyAdventureMismatch(firewatch));
  });

  it("penalizes hardcore scope for smaller Witcher prompts", () => {
    const constraints = extractPromptConstraints(
      "Something like The Witcher 3 but smaller and less overwhelming"
    );
    const outward = mockCandidate("Outward", ["RPG", "Survival"], ["Open World"]);
    const dragonAge = mockCandidate("Dragon Age: Origins", ["RPG"], ["Story Rich"]);

    assert.ok(scorePromptConstraintBoost(outward, constraints) < -20);
    assert.ok(
      scorePromptConstraintBoost(dragonAge, constraints) >
        scorePromptConstraintBoost(outward, constraints)
    );
  });

  it("prefers deduction gameplay over passive detective adventures", () => {
    const constraints = extractPromptConstraints(
      "Detective game where I solve the mystery myself"
    );
    const wolf = mockCandidate("The Wolf Among Us", ["Adventure"], ["Detective"]);
    const obra = mockCandidate("Return of the Obra Dinn", ["Adventure"], ["Puzzle"]);

    assert.ok(isPassiveDetectiveExperience(wolf));
    assert.ok(hasPlayerDeductionGameplay(obra));
    assert.ok(
      scorePromptConstraintBoost(obra, constraints) >
        scorePromptConstraintBoost(wolf, constraints)
    );
    assert.equal(violatesPromptConstraints(wolf, constraints), true);
  });

  it("boosts accessible story RPG canon for no-grind RPG prompts", () => {
    const constraints = extractPromptConstraints(
      "I want an RPG with a great story but I hate grinding and difficult combat"
    );
    const massEffect = mockCandidate("Mass Effect 2", ["RPG", "Action"], ["Story Rich"]);
    const xenoblade = mockCandidate("Xenoblade Chronicles 2", ["RPG"], ["JRPG"]);

    assert.ok(
      scorePromptConstraintBoost(massEffect, constraints) >
        scorePromptConstraintBoost(xenoblade, constraints)
    );
  });

  it("rejects Life is Strange even with spurious RPG metadata", () => {
    const constraints = extractPromptConstraints(
      "I want an RPG with a great story but I hate grinding and difficult combat"
    );
    const lis = mockCandidate("Life is Strange: Before the Storm", ["Adventure", "RPG"], [
      "Story Rich",
      "Choices Matter",
    ]);

    assert.ok(isStoryOnlyAdventureMismatch(lis));
    assert.equal(violatesPromptConstraints(lis, constraints), true);
    assert.ok(scorePromptConstraintBoost(lis, constraints) < -40);
  });
});

describe("constraint preservation regression", () => {
  it("does not activate for unrelated cozy prompts", () => {
    const c = extractPromptConstraints("cozy farming sim for one more hour before bed");
    assert.equal(c.genreIdentity.includes("rpg"), false);
    assert.equal(c.genreIdentity.includes("detective"), false);
  });
});
