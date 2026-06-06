import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  isNonCanonicalSideEdition,
  isDirtyPlatformTitleVariant,
  isDirtyUnofficialTitleVariant,
  isWeakFantasyStrategyFillerTitle,
  scoreCanonicalTitlePreference,
  shouldRejectDirtyPlatformTitleVariant,
  shouldRejectDirtyUnofficialTitleVariant,
  shouldRejectNonCanonicalSideEdition,
} from "@/lib/canonical-title-preference"

describe("canonical-title-preference", () => {
  it("flags side editions unless the user asked for them", () => {
    assert.equal(isNonCanonicalSideEdition("SpellForce 3: Versus Edition"), true)
    assert.equal(
      shouldRejectNonCanonicalSideEdition(
        "SpellForce 3: Versus Edition",
        "Fantasy strategy with elves and orcs"
      ),
      true
    )
    assert.equal(
      shouldRejectNonCanonicalSideEdition(
        "SpellForce 3: Versus Edition",
        "I want the versus edition demo"
      ),
      false
    )
  })

  it("rejects tactical monsters as weak fantasy strategy filler", () => {
    assert.equal(
      isWeakFantasyStrategyFillerTitle("Tactical Monsters - Strategy Edition"),
      true
    )
    assert.equal(isWeakFantasyStrategyFillerTitle("Warcraft III: Reforged"), false)
  })

  it("prefers SpellForce 3 / Warcraft III over side or early franchise entries", () => {
    const fantasyPrompt =
      "Fantasy strategy game with elves, orcs, village building and faction management."
  const versus = scoreCanonicalTitlePreference({
      suggestedTitle: "SpellForce 3",
      candidateName: "SpellForce 3: Versus Edition",
      userPrompt: fantasyPrompt,
      preferFranchiseMainline: true,
    })
    const base = scoreCanonicalTitlePreference({
      suggestedTitle: "SpellForce 3",
      candidateName: "SpellForce 3: Reforced",
      userPrompt: fantasyPrompt,
      preferFranchiseMainline: true,
    })
    assert.ok(base > versus)

    const orcs = scoreCanonicalTitlePreference({
      candidateName: "Warcraft: Orcs & Humans",
      userPrompt: fantasyPrompt,
      preferFranchiseMainline: true,
    })
    const wc3 = scoreCanonicalTitlePreference({
      candidateName: "Warcraft III: Reforged",
      userPrompt: fantasyPrompt,
      preferFranchiseMainline: true,
    })
    assert.ok(wc3 > orcs)
  })

  it("flags dirty platform/region dump title variants", () => {
    assert.equal(
      isDirtyPlatformTitleVariant("Danganronpa: Trigger Happy Havoc On PSP (RUS)"),
      true
    )
    assert.equal(
      shouldRejectDirtyPlatformTitleVariant(
        "Danganronpa: Trigger Happy Havoc On PSP (RUS)",
        "turn based JRPG"
      ),
      true
    )
    assert.equal(
      isDirtyPlatformTitleVariant("Persona 5 Royal"),
      false
    )
    assert.equal(
      isDirtyPlatformTitleVariant("Dark Souls: Remastered"),
      false
    )
  })

  it("flags unofficial mod/multiplayer title variants but keeps legitimate editions", () => {
    assert.equal(isDirtyUnofficialTitleVariant("Undertale MULTIPLAYER"), true)
    assert.equal(
      shouldRejectDirtyUnofficialTitleVariant("Undertale MULTIPLAYER", "story RPG no grind"),
      true
    )
    assert.equal(isDirtyUnofficialTitleVariant("Persona 5 Royal"), false)
    assert.equal(isDirtyUnofficialTitleVariant("The Witcher 3: Wild Hunt"), false)
    assert.equal(isDirtyUnofficialTitleVariant("Baldur's Gate 3"), false)
  })
})
