import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  isNonCanonicalSideEdition,
  isWeakFantasyStrategyFillerTitle,
  scoreCanonicalTitlePreference,
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
})
