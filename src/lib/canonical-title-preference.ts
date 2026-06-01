/** Prefer base/canonical game entries over side editions and weak franchise variants. */

const SIDE_EDITION_PATTERNS: RegExp[] = [
  /\bversus edition\b/i,
  /\bdemo\b/i,
  /\bprologue\b/i,
  /\bbeta\b/i,
  /\btest\b/i,
  /\bprototype\b/i,
  /\bfree edition\b/i,
  /\bstrategy edition\b/i,
  /\bstandalone mode\b/i,
]

const USER_SIDE_EDITION_HINTS: RegExp[] = [
  /\bversus edition\b/i,
  /\bdemo\b/i,
  /\bprologue\b/i,
  /\bbeta\b/i,
  /\bprototype\b/i,
  /\bfree edition\b/i,
  /\bstrategy edition\b/i,
  /\bstandalone mode\b/i,
]

const WARCRAFT_III_RE = /\bwarcraft\s+iii\b/i

function isEarlyWarcraftTitle(name: string): boolean {
  if (WARCRAFT_III_RE.test(name)) return false
  if (/\bwarcraft:\s*orcs\b/i.test(name)) return true
  if (/\borcs?\s*&\s*humans\b/i.test(name)) return true
  if (/\bwarcraft\s+ii\b/i.test(name)) return true
  return false
}
const SPELLFORCE_3_RE = /\bspellforce\s*3\b/i
const TOTAL_WAR_WARHAMMER_SPINOFF_RE =
  /\b(chaos gate|darktide|vermintide|blood bowl|gladius)\b/i

export function isNonCanonicalSideEdition(title: string): boolean {
  return SIDE_EDITION_PATTERNS.some((re) => re.test(title))
}

export function userAskedForSideEdition(userPrompt: string, title: string): boolean {
  const prompt = userPrompt.trim()
  if (!prompt) return false
  if (!isNonCanonicalSideEdition(title)) return false
  return USER_SIDE_EDITION_HINTS.some((re) => re.test(prompt))
}

export function shouldRejectNonCanonicalSideEdition(
  candidateName: string,
  userPrompt: string
): boolean {
  return (
    isNonCanonicalSideEdition(candidateName) &&
    !userAskedForSideEdition(userPrompt, candidateName)
  )
}

/** Generic strategy/mobile-like titles that are weak fits for fantasy race management prompts. */
export function isWeakFantasyStrategyFillerTitle(name: string): boolean {
  const n = name.toLowerCase()
  if (/\btactical monsters\b/i.test(n)) return true
  if (
    /\b(puzzle strategy|monster battle|card battler|idle strategy)\b/i.test(n) &&
    !/\b(fantasy|orc|elf|elven|warhammer|spellforce|warcraft|dwarf|faction)\b/i.test(n)
  ) {
    return true
  }
  return false
}

/** Dedupe tie-break: lower score is better. */
export function nonCanonicalSideEditionDedupePenalty(title: string): number {
  let penalty = 0
  if (isNonCanonicalSideEdition(title)) penalty += 42
  if (/\bversus edition\b/i.test(title)) penalty += 18
  if (/\bstrategy edition\b/i.test(title)) penalty += 16
  return penalty
}

export function scoreCanonicalTitlePreference(params: {
  suggestedTitle?: string
  candidateName: string
  userPrompt?: string
  /** When true, boost flagship fantasy RTS entries over spin-offs / early franchise titles. */
  preferFranchiseMainline?: boolean
}): number {
  const { suggestedTitle, candidateName, userPrompt = "", preferFranchiseMainline } = params
  let delta = 0

  if (shouldRejectNonCanonicalSideEdition(candidateName, userPrompt)) {
    delta -= 50
  }

  const suggested = (suggestedTitle ?? "").trim()
  if (suggested) {
    if (SPELLFORCE_3_RE.test(suggested) && /\bversus edition\b/i.test(candidateName)) {
      delta -= 40
    }
    if (SPELLFORCE_3_RE.test(suggested) && /\breforced\b/i.test(candidateName)) {
      delta += 10
    }
    if (/\bwarcraft\s+iii\b/i.test(suggested) && isEarlyWarcraftTitle(candidateName)) {
      delta -= 45
    }
    if (/\bwarcraft\s+iii\b/i.test(suggested) && WARCRAFT_III_RE.test(candidateName)) {
      delta += 25
    }
  }

  if (!preferFranchiseMainline) return delta

  const name = candidateName.toLowerCase()

  if (/\bwarcraft\b/.test(name)) {
    if (isEarlyWarcraftTitle(candidateName)) delta -= 58
    if (WARCRAFT_III_RE.test(name)) delta += 30
    if (/\breforged\b/i.test(name) && WARCRAFT_III_RE.test(name)) delta += 8
  }

  if (/\bspellforce\b/.test(name)) {
    if (/\bversus edition\b/i.test(name)) delta -= 48
    if (SPELLFORCE_3_RE.test(name) && !/\bversus\b/i.test(name)) delta += 18
  }

  if (/\btotal war\b/.test(name) && /\bwarhammer\b/.test(name)) {
    if (TOTAL_WAR_WARHAMMER_SPINOFF_RE.test(name)) delta -= 45
    else if (/\bwarhammer\s*(i{1,3}|[123])\b/i.test(name) || /\btotal war:\s*warhammer\b/i.test(name)) {
      delta += 22
    }
  }

  if (isWeakFantasyStrategyFillerTitle(candidateName)) delta -= 85

  return delta
}
