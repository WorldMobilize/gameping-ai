const ALLOWED_EDITION_MARKERS =
  /\b(hd remaster|definitive edition|royal|reload|complete edition|game of the year|goty|director's cut|ultimate edition|enhanced edition|special edition)\b/i

/** Region/platform dump markers — not legitimate retail editions. */
const DIRTY_PLATFORM_TITLE_MARKERS: RegExp[] = [
  /\(\s*RUS\s*\)/i,
  /\(\s*ENG\s*\)/i,
  /\(\s*JPN\s*\)/i,
  /\(\s*EUR\s*\)/i,
  /\bon psp\b/i,
  /\bon ps2\b/i,
  /\bon ps3\b/i,
  /\bon ps4\b/i,
  /\bon ps5\b/i,
  /\bon xbox\b/i,
  /\bon switch\b/i,
  /\bon nintendo\b/i,
  /\bon pc\b/i,
  /\bROM\b/i,
  /\bISO\b/i,
  /\bfan translation\b/i,
  /\bfantrans\b/i,
  /\b(pirate|bootleg)\b/i,
  /\bunofficial port\b/i,
]

/** Unofficial / modded / fan variants attached to otherwise canonical titles. */
const DIRTY_UNOFFICIAL_TITLE_MARKERS: RegExp[] = [
  /\bMULTIPLAYER\b/i,
  /\bMOD\b/i,
  /\bMODDED\b/i,
  /\bFAN\s*GAME\b/i,
  /\bFANMADE\b/i,
  /\bFAN-MADE\b/i,
  /\bUNOFFICIAL\b/i,
  /\bROMHACK\b/i,
  /\bROM\s*HACK\b/i,
  /\bHACK\s*ROM\b/i,
  /\bONLINE\s+UNOFFICIAL\b/i,
  /\bUNOFFICIAL\s+ONLINE\b/i,
]

/** Conservative: reject obvious ROM/region/platform dump titles, not retail remasters. */
export function isDirtyPlatformTitleVariant(title: string): boolean {
  const n = title.trim()
  if (!n) return false
  if (ALLOWED_EDITION_MARKERS.test(n) && !/\(\s*(RUS|ENG|JPN|EUR)\s*\)/i.test(n)) {
    return false
  }
  return DIRTY_PLATFORM_TITLE_MARKERS.some((re) => re.test(n))
}

/** Reject fan mods, multiplayer hacks, and other non-canonical title variants. */
export function isDirtyUnofficialTitleVariant(title: string): boolean {
  const n = title.trim()
  if (!n) return false
  if (ALLOWED_EDITION_MARKERS.test(n) && !DIRTY_UNOFFICIAL_TITLE_MARKERS.some((re) => re.test(n))) {
    return false
  }
  return DIRTY_UNOFFICIAL_TITLE_MARKERS.some((re) => re.test(n))
}

function userPromptMentionsTitleVariant(userPrompt: string, candidateName: string): boolean {
  const prompt = userPrompt.toLowerCase()
  const name = candidateName.toLowerCase()
  if (prompt.includes(name.slice(0, Math.min(24, name.length)))) return true
  return false
}

export function shouldRejectDirtyPlatformTitleVariant(
  candidateName: string,
  userPrompt = ""
): boolean {
  if (!isDirtyPlatformTitleVariant(candidateName)) return false
  const prompt = userPrompt.toLowerCase()
  if (userPromptMentionsTitleVariant(userPrompt, candidateName)) return false
  if (/\b(psp|ps2|rus|fan translation|rom)\b/i.test(prompt)) return false
  return true
}

export function shouldRejectDirtyUnofficialTitleVariant(
  candidateName: string,
  userPrompt = ""
): boolean {
  if (!isDirtyUnofficialTitleVariant(candidateName)) return false
  if (userPromptMentionsTitleVariant(userPrompt, candidateName)) return false
  const prompt = userPrompt.toLowerCase()
  if (/\b(multiplayer|mod|fan game|unofficial|rom hack|hack)\b/i.test(prompt)) return false
  return true
}

/** Dedupe/scoring penalty for non-canonical platform dump titles. */
export function dirtyPlatformTitleVariantPenalty(title: string): number {
  let penalty = 0
  if (isDirtyPlatformTitleVariant(title)) penalty += 58
  if (isDirtyUnofficialTitleVariant(title)) penalty += 62
  return penalty
}

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
  penalty += dirtyPlatformTitleVariantPenalty(title)
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
  if (shouldRejectDirtyPlatformTitleVariant(candidateName, userPrompt)) {
    delta -= 55
  }
  if (shouldRejectDirtyUnofficialTitleVariant(candidateName, userPrompt)) {
    delta -= 60
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
