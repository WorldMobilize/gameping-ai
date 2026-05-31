import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildVerifiedBySuggestedTitle,
  lookupVerifiedForFastPickTitle,
} from "@/lib/fast-pick-verified-lookup"

const FANTASY_RTS_CASES = [
  {
    aiTitle: "Warcraft III",
    rawgName: "Warcraft III: Reforged",
  },
  {
    aiTitle: "The Lord of the Rings: The Battle for Middle-earth II",
    rawgName: "The Lord of the Rings: The Battle for Middle-earth 2",
  },
  {
    aiTitle: "Warlords Battlecry",
    rawgName: "Warlords Battlecry III",
  },
  {
    aiTitle: "SpellForce 3",
    rawgName: "SpellForce 3",
  },
] as const

describe("fast-pick verified lookup", () => {
  it("joins AI titles to RAWG edition names via _suggested.title", () => {
    for (const { aiTitle, rawgName } of FANTASY_RTS_CASES) {
      const verified = [
        {
          name: rawgName,
          _suggested: { title: aiTitle, titleMatch: 0.93 },
        },
      ]
      const bySuggested = buildVerifiedBySuggestedTitle(verified)
      const resolved = lookupVerifiedForFastPickTitle(aiTitle, verified, bySuggested)
      assert.ok(resolved, `expected join for ${aiTitle}`)
      assert.equal(resolved.name, rawgName)
    }
  })

  it("does not join when suggested title differs and fuzzy match is below threshold", () => {
    const verified = [
      {
        name: "Warcraft III: Reforged",
        _suggested: { title: "Warcraft III", titleMatch: 0.93 },
      },
    ]
    const bySuggested = buildVerifiedBySuggestedTitle(verified)
    assert.equal(
      lookupVerifiedForFastPickTitle("StarCraft II", verified, bySuggested),
      undefined
    )
  })

  it("falls back to fuzzy title match when _suggested metadata is missing", () => {
    const verified = [{ name: "Warcraft III: Reforged" }]
    const bySuggested = buildVerifiedBySuggestedTitle(verified)
    const resolved = lookupVerifiedForFastPickTitle(
      "Warcraft III",
      verified,
      bySuggested
    )
    assert.ok(resolved)
    assert.equal(resolved.name, "Warcraft III: Reforged")
  })
})
