import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  expandReferenceTitleExcludes,
  matchesReferenceExclude,
} from "@/lib/reference-title-aliases"

describe("reference-title-aliases", () => {
  it("expands RDR2 and Fallout NV shorthand to canonical titles", () => {
    const expanded = expandReferenceTitleExcludes(["RDR2", "Fallout NV"])
    assert.ok(expanded.some((t) => /red dead redemption 2/i.test(t)))
    assert.ok(expanded.some((t) => /new vegas/i.test(t)))
    assert.equal(expanded.some((t) => /fallout 4/i.test(t)), false)
  })

  it("matches edition variants of excluded anchors", () => {
    assert.equal(
      matchesReferenceExclude("Red Dead Redemption 2: Ultimate Edition", [
        "RDR2",
      ]),
      true
    )
    assert.equal(
      matchesReferenceExclude("Fallout: New Vegas", ["Fallout NV"]),
      true
    )
    assert.equal(
      matchesReferenceExclude("Red Dead Redemption", ["RDR2"]),
      false
    )
  })
})
