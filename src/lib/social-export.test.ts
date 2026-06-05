import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildSocialExportSlidePlan,
  promptToSocialHook,
  proxiedSocialImageUrl,
} from "@/lib/social-export"

describe("social-export", () => {
  it("builds hook, prompt, game, and CTA slide plan in order", () => {
    const plan = buildSocialExportSlidePlan(
      [
        { title: "To the Moon", match: 90, reason: "A" },
        { title: "Oxenfree", match: 85, reason: "B" },
      ],
      true
    )
    assert.equal(plan[0]?.id, "hook")
    assert.equal(plan[1]?.id, "prompt")
    assert.equal(plan[2]?.id, "game-1")
    assert.equal(plan[3]?.id, "game-2")
    assert.equal(plan[4]?.id, "cta")
    assert.equal(plan.length, 5)
  })

  it("proxied URLs are unique per cache key for the same upstream URL", () => {
    const url = "https://media.rawg.io/foo/bar.jpg"
    const a = proxiedSocialImageUrl(url, "game-1-to-the-moon")
    const b = proxiedSocialImageUrl(url, "game-2-oxenfree")
    assert.notEqual(a, b)
  })
})

describe("promptToSocialHook", () => {
  it("maps example prompts to content-first hooks", () => {
    assert.equal(
      promptToSocialHook("games that make me love gaming again"),
      "GAMES THAT MAKE YOU LOVE GAMING AGAIN 🎮"
    )
    assert.equal(
      promptToSocialHook("games that mess with your mind"),
      "GAMES THAT MESS WITH YOUR MIND 👀"
    )
    assert.equal(
      promptToSocialHook("games that leave you empty after finishing"),
      "GAMES THAT LEAVE YOU EMPTY AFTER FINISHING"
    )
    assert.equal(
      promptToSocialHook("games you wish you could experience again"),
      "GAMES YOU WISH YOU COULD EXPERIENCE AGAIN"
    )
  })

  it("strips leading find-me phrasing", () => {
    assert.equal(
      promptToSocialHook("Find me games that mess with your mind"),
      "GAMES THAT MESS WITH YOUR MIND 👀"
    )
  })

  it("falls back when prompt is not game-themed", () => {
    assert.equal(promptToSocialHook("dark story under $20"), "GAMES MATCHING THIS VIBE 🎮")
    assert.equal(promptToSocialHook(""), "GAMES MATCHING THIS VIBE 🎮")
  })
})
