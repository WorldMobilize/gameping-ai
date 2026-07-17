import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateCreatorCode } from "@/lib/creator-code-generate";

describe("generateCreatorCode", () => {
  it("has the requested length and only allowed chars", () => {
    const code = generateCreatorCode(6, () => 0.5);
    assert.equal(code.length, 6);
    assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
  });

  it("never emits ambiguous characters (0 O 1 I L)", () => {
    const chars = new Set<string>();
    for (let i = 0; i < 31; i++) chars.add(generateCreatorCode(1, () => i / 31));
    for (const c of chars) assert.ok(!"0O1IL".includes(c), `unexpected char: ${c}`);
  });

  it("is deterministic for the same rng sequence", () => {
    const make = () => {
      let i = 0;
      const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
      return () => seq[i++];
    };
    assert.equal(generateCreatorCode(6, make()), generateCreatorCode(6, make()));
  });
});
