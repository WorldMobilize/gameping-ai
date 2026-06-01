import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  applyRefineIntentAdjustments,
  buildRefineDiscoveryUserPrompt,
  extractMoreLikeReferenceTitles,
  formatRecommendRunPromptWithRefine,
  parseRefineContext,
  parseRefineContextRequest,
  REFINE_MESSAGE_MAX,
  resolveRefineExcludeAndReference,
  refineWantsMoreLikePrevious,
} from "@/lib/recommend-refine"

describe("recommend-refine", () => {
  it("rejects refine messages over the character limit", () => {
    assert.equal(REFINE_MESSAGE_MAX, 200)
    const long = "x".repeat(REFINE_MESSAGE_MAX + 1)
    const parsed = parseRefineContextRequest({
      refineContext: {
        originalPrompt: "cozy games",
        previousResultTitles: ["Hades"],
        refineMessage: long,
      },
    })
    assert.equal(parsed.ok, false)
    if (!parsed.ok) assert.equal(parsed.error, "refine_message_too_long")
  })

  it("parses refineContext from request body", () => {
    const ctx = parseRefineContext({
      refineContext: {
        originalPrompt: "cozy games",
        previousResultTitles: ["Stardew Valley", "Animal Crossing"],
        refineMessage: "less famous",
      },
    })
    assert.ok(ctx)
    assert.equal(ctx!.refineMessage, "less famous")
    assert.equal(ctx!.previousResultTitles.length, 2)
  })

  it("formats run log prompt with refine suffix", () => {
    assert.equal(
      formatRecommendRunPromptWithRefine("cozy games", "less famous"),
      "cozy games | refine: less famous"
    )
  })

  it("excludes previous titles unless more-like is requested", () => {
    const ctx = {
      originalPrompt: "fantasy RTS",
      previousResultTitles: ["SpellForce 3", "Warcraft III", "Age of Wonders 4"],
      refineMessage: "less grand strategy",
    }
    const plain = resolveRefineExcludeAndReference(ctx)
    assert.equal(plain.excludeTitles.length, 3)
    assert.equal(plain.referenceTitles.length, 0)

    const moreLike = resolveRefineExcludeAndReference({
      ...ctx,
      refineMessage: "more like the second game",
    })
    assert.ok(refineWantsMoreLikePrevious("more like the second game"))
    assert.deepEqual(moreLike.referenceTitles, ["Warcraft III"])
    assert.deepEqual(moreLike.excludeTitles, ["SpellForce 3", "Age of Wonders 4"])
  })

  it("extracts ordinal and numbered more-like references", () => {
    const prev = ["A", "B", "C"]
    assert.deepEqual(
      extractMoreLikeReferenceTitles("more like the second game", prev),
      ["B"]
    )
    assert.deepEqual(extractMoreLikeReferenceTitles("more like game 3", prev), ["C"])
  })

  it("applies deterministic intent adjustments", () => {
    const out = applyRefineIntentAdjustments("not multiplayer, more story", {
      normalizedIntent: "Games with friends",
      coreNeeds: [],
      avoid: [],
    })
    assert.match(out.normalizedIntent, /Refinement:/)
    assert.ok(out.avoid.some((a) => /multiplayer/i.test(a)))
    assert.ok(out.coreNeeds.some((n) => /story/i.test(n)))
  })

  it("builds discovery prompt with numbered previous picks", () => {
    const text = buildRefineDiscoveryUserPrompt({
      originalPrompt: "weird underrated games",
      refineMessage: "I already know these",
      previousResultTitles: ["Hades", "Celeste"],
    })
    assert.match(text, /Refinement/)
    assert.match(text, /1\. Hades/)
    assert.match(text, /2\. Celeste/)
  })
})
