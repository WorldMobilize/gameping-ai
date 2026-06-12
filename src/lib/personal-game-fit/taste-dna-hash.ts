import { createHash } from "crypto";
import type { TasteDnaV2 } from "@/lib/steam-library/taste-dna-types";

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  const sortValue = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sortValue);
    if (seen.has(v)) return "[Circular]";
    const obj = v as Record<string, unknown>;
    seen.add(obj);
    return Object.keys(obj)
      .sort()
      .map((key) => [key, sortValue(obj[key])])
      .reduce<Record<string, unknown>>((acc, [key, val]) => {
        acc[key as string] = val;
        return acc;
      }, {});
  };

  return JSON.stringify(sortValue(value));
}

/** Cache invalidation key when Taste DNA changes. */
export function hashTasteDnaForFitCache(tasteDna: TasteDnaV2): string {
  const payload = {
    version: tasteDna.version,
    computedAt: tasteDna.computedAt,
    motivations: tasteDna.coreMotivations.map((motivation) => ({
      trait: motivation.trait,
      confidence: motivation.confidence,
    })),
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}
