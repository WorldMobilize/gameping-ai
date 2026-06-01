import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildSocialExportSlidePlan,
  proxiedSocialImageUrl,
} from "@/lib/social-export"

describe("social-export", () => {
  it("builds prompt, game, and CTA slide plan in order", () => {
    const plan = buildSocialExportSlidePlan(
      [
        { title: "To the Moon", match: 90, reason: "A" },
        { title: "Oxenfree", match: 85, reason: "B" },
      ],
      true
    )
    assert.equal(plan[0]?.id, "prompt")
    assert.equal(plan[1]?.id, "game-1")
    assert.equal(plan[2]?.id, "game-2")
    assert.equal(plan[3]?.id, "cta")
    assert.equal(plan.length, 4)
  })

  it("proxied URLs are unique per cache key for the same upstream URL", () => {
    const url = "https://media.rawg.io/foo/bar.jpg"
    const a = proxiedSocialImageUrl(url, "game-1-to-the-moon")
    const b = proxiedSocialImageUrl(url, "game-2-oxenfree")
    assert.notEqual(a, b)
  })
})
