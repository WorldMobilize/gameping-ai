/** Expand shorthand game references and match candidates against reference anchors. */

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Shorthand → canonical titles to exclude (not whole-franchise overreach). */
const REFERENCE_ALIAS_EXPANSIONS: Readonly<Record<string, readonly string[]>> = {
  rdr2: ["RDR2", "Red Dead Redemption 2", "Red Dead Redemption II"],
  rdr: ["RDR", "Red Dead Redemption"],
  "fallout nv": ["Fallout NV", "Fallout: New Vegas", "Fallout New Vegas"],
  fnv: ["Fallout NV", "Fallout: New Vegas", "Fallout New Vegas"],
  "new vegas": ["Fallout: New Vegas", "Fallout New Vegas"],
}

function aliasKeysForTitle(title: string): string[] {
  const key = normalizeTitleKey(title)
  if (!key) return []
  return REFERENCE_ALIAS_EXPANSIONS[key] ? [key] : []
}

/** Add canonical spellings for known shorthand reference anchors. */
export function expandReferenceTitleExcludes(titles: string[]): string[] {
  const out = new Set<string>()
  for (const raw of titles) {
    const t = raw.trim()
    if (!t) continue
    out.add(t)
    for (const key of aliasKeysForTitle(t)) {
      const expansions = REFERENCE_ALIAS_EXPANSIONS[key]
      if (expansions) {
        for (const e of expansions) out.add(e)
      }
    }
  }
  return [...out].slice(0, 24)
}

/** True when a candidate is the same anchor title or an obvious edition suffix variant. */
export function matchesReferenceExclude(
  candidateName: string,
  excludeTitles: string[]
): boolean {
  const cand = normalizeTitleKey(candidateName)
  if (!cand) return false

  const expanded = expandReferenceTitleExcludes(excludeTitles)
  for (const ex of expanded) {
    const exNorm = normalizeTitleKey(ex)
    if (!exNorm || exNorm.length < 3) continue
    if (cand === exNorm) return true
    if (
      exNorm.length >= 10 &&
      (cand.startsWith(`${exNorm} `) || cand.startsWith(`${exNorm}:`))
    ) {
      return true
    }
  }
  return false
}
