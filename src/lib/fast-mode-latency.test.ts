import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  countHighConfidenceFastPicks,
  fastModeFallbackQueryLimit,
  shouldSkipFastModeRawgFallback,
} from "@/lib/fast-mode-latency"

describe("fast-mode-latency", () => {
  it("counts high-confidence fast picks", () => {
    assert.equal(
      countHighConfidenceFastPicks([
        { match: 90, matchTier: "best_match" },
        { match: 62, matchTier: "good_alternative" },
      ]),
      1
    )
    assert.equal(
      countHighConfidenceFastPicks([
        { match: 75, matchTier: "good_alternative" },
        { match: 82, matchTier: "partial_match" },
      ]),
      2
    )
  })

  it("skips fallback for quality/refine when two high-confidence picks exist", () => {
    assert.equal(
      shouldSkipFastModeRawgFallback({
        resultCountPolicy: "quality_first",
        isRefineRequest: false,
        pickedCount: 1,
        highConfidenceCount: 2,
      }),
      true
    )
    assert.equal(
      shouldSkipFastModeRawgFallback({
        resultCountPolicy: "broad",
        isRefineRequest: true,
        pickedCount: 1,
        highConfidenceCount: 2,
      }),
      true
    )
    assert.equal(
      shouldSkipFastModeRawgFallback({
        resultCountPolicy: "broad",
        isRefineRequest: false,
        pickedCount: 1,
        highConfidenceCount: 2,
      }),
      false
    )
  })

  it("uses fewer fallback queries for partial quality signal but keeps broad at six", () => {
    assert.equal(
      fastModeFallbackQueryLimit({
        resultCountPolicy: "broad",
        highConfidenceCount: 1,
        pickedCount: 1,
      }),
      6
    )
    assert.equal(
      fastModeFallbackQueryLimit({
        resultCountPolicy: "quality_first",
        highConfidenceCount: 1,
        pickedCount: 1,
      }),
      3
    )
  })
})
