import {
  isWeakFantasyStrategyFillerTitle,
  scoreCanonicalTitlePreference,
  shouldRejectDirtyPlatformTitleVariant,
  shouldRejectNonCanonicalSideEdition,
} from "@/lib/canonical-title-preference"
import {
  hasObscureDiscoveryIntent,
  isDiscoveryCanonTitle,
  isFamousIndieForObscurePrompt,
} from "@/lib/recommend-diversity-core"
import type { RawgCandidate } from "@/lib/rawg-discovery"

export type DiscoverySubkind =
  | "anti_aaa"
  | "lonely_beautiful"
  | "underrated"
  | "cozy_short"
  | "weekend_finish"
  | "generic"

export type IntentSignals = {
  steamDeck: boolean
  rpgCompanionParty: boolean
  psychologicalHorror: boolean
  /** Open-ended emotional / surprise-me / hidden-gem discovery prompts. */
  memorableDiscovery: boolean
  /** Cozy + short-session evening play (distinct ranking/query pool). */
  cozyShortSession: boolean
  discoverySubkind: DiscoverySubkind | null
}

export const EMPTY_INTENT_SIGNALS: IntentSignals = {
  steamDeck: false,
  rpgCompanionParty: false,
  psychologicalHorror: false,
  memorableDiscovery: false,
  cozyShortSession: false,
  discoverySubkind: null,
}

/** Platform constraint label — metadata, not a RAWG title keyword. */
export const STEAM_DECK_PLATFORM_CONSTRAINT =
  "Steam Deck platform (handheld PC, controller-friendly, portable play)"

/** @deprecated Use STEAM_DECK_PLATFORM_CONSTRAINT */
export const STEAM_DECK_PLATFORM_INTENT = STEAM_DECK_PLATFORM_CONSTRAINT

export type SteamDeckIntentSplit = {
  /** Genre/mood/pacing from the user prompt after removing Steam Deck phrasing. */
  contentPrompt: string
  /** True when the user only asked for Steam Deck with no other taste signal. */
  isPlatformOnly: boolean
}

export type IntentAugmentFields = {
  normalizedIntent: string
  coreNeeds: string[]
  avoid: string[]
  fallbackDiscoveryQueries: string[]
}

function normalizeIntentText(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .trim()
}

/** Collapse Steam Deck phrasing into platform constraint token (not title keywords). */
export function collapseSteamDeckPhrase(text: string): string {
  return text
    .replace(/\bgames?\s+for\s+steam\s*deck\b/gi, STEAM_DECK_PLATFORM_CONSTRAINT)
    .replace(/\bbest\s+steam\s*deck\s+games?\b/gi, STEAM_DECK_PLATFORM_CONSTRAINT)
    .replace(/\bsteamdeck\s+recommendations?\b/gi, STEAM_DECK_PLATFORM_CONSTRAINT)
    .replace(/\bsteam\s*deck\b/gi, STEAM_DECK_PLATFORM_CONSTRAINT)
    .replace(/\bsteamdeck\b/gi, STEAM_DECK_PLATFORM_CONSTRAINT)
    .replace(/\bvalve\s+handheld\b/gi, STEAM_DECK_PLATFORM_CONSTRAINT)
}

/** Remove Steam Deck platform phrasing so retrieval keywords reflect taste/genre only. */
export function stripSteamDeckPhrases(text: string): string {
  return text
    .replace(/\bgames?\s+for\s+steam\s*deck\b/gi, " ")
    .replace(/\bbest\s+steam\s*deck\s+games?\b/gi, " ")
    .replace(/\bsteamdeck\s+recommendations?\b/gi, " ")
    .replace(/\bsteam\s*deck\b/gi, " ")
    .replace(/\bsteamdeck\b/gi, " ")
    .replace(/\bvalve\s+handheld\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function splitSteamDeckIntent(userPrompt: string): SteamDeckIntentSplit | null {
  if (!detectIntentSignals(userPrompt).steamDeck) return null

  let contentPrompt = stripSteamDeckPhrases(userPrompt)
  contentPrompt = contentPrompt
    .replace(/^(best|good|great|top|any|some)\s+/i, "")
    .replace(/\b(recommendations?|recommend|games?|game)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()

  const isPlatformOnly =
    contentPrompt.length < 3 ||
    /^(games?|recommendations?|recommend)?$/i.test(contentPrompt)

  return { contentPrompt, isPlatformOnly }
}

/** Text used for RAWG keyword retrieval — excludes platform/discovery fluff when intent detected. */
export function promptForRetrievalKeywords(
  userPrompt: string,
  signals: IntentSignals
): string {
  let text = userPrompt
  if (signals.steamDeck) {
    const split = splitSteamDeckIntent(userPrompt)
    text = split?.contentPrompt ?? ""
  }
  if (signals.memorableDiscovery || signals.cozyShortSession) {
    text = stripDiscoveryFluffPhrases(text)
  }
  return text
}

/** High-signal RAWG category searches for memorable-discovery prompts (pools, not game lists). */
const MEMORABLE_DISCOVERY_BASE_POOLS = [
  "cult classic indie games",
  "memorable narrative indie games",
  "acclaimed story rich indie",
  "emotional atmospheric adventure",
  "critically acclaimed indie adventure",
] as const

const DISCOVERY_ANTI_AAA_POOLS = [
  "cult classic indie games",
  "memorable narrative indie games",
  "critically acclaimed indie adventure",
  "unique indie games acclaimed",
  "emotional atmospheric indie",
] as const

const DISCOVERY_LONELY_POOLS = [
  "beautiful lonely exploration games",
  "melancholic atmospheric indie",
  "emotional walking simulator indie",
  "contemplative adventure indie",
] as const

const DISCOVERY_UNDERRATED_POOLS = [
  "underrated story rich indie",
  "hidden gem adventure games",
  "overlooked acclaimed indie",
  "cult classic indie games",
] as const

const DISCOVERY_WEEKEND_POOLS = [
  "short unforgettable indie games",
  "memorable narrative indie under 15 hours",
  "acclaimed short story games",
] as const

const COZY_SHORT_SESSION_POOLS = [
  "cozy relaxing indie short sessions",
  "wholesome cozy adventure game",
  "relaxing farming sim indie",
  "comforting life sim indie",
] as const

/** Bare or low-signal tokens that must not drive RAWG search alone. */
const UNSAFE_DISCOVERY_QUERY_RE =
  /^(surprise|experience|indie|weird|unforgettable|memorable|hidden gem|underrated|special|emotional|lonely|loneliness|surprise me|vr experience|indie battle|indie game battle|stupiscimi|gemme nascoste)$/i

const DISCOVERY_TITLE_KEYWORD_RE =
  /\b(surprise|unforgettable|memorable|loneliness|lonely|weird|experience|hidden gem|underrated|emotional|indie battle|stupiscimi)\b/i

/** Broad category RAWG searches for platform-only prompts (pools, not game lists). */
const PLATFORM_ONLY_DISCOVERY_POOLS = [
  "popular controller friendly indie",
  "handheld pc adventure games",
  "well rated portable indie",
  "action roguelike indie",
  "cozy relaxing indie game",
] as const

export const STEAM_DECK_PLATFORM_CORE_NEEDS = [
  "controller-friendly",
  "handheld-friendly",
  "good portable play sessions",
  "performs well on Steam Deck hardware",
] as const

/** Detect common misinterpretation patterns from free-text prompts. */
export function detectIntentSignals(text: string): IntentSignals {
  const n = normalizeIntentText(text)

  const steamDeck =
    /\bsteam\s*deck\b/.test(n) ||
    /\bsteamdeck\b/.test(n) ||
    /\bvalve\s+handheld\b/.test(n) ||
    /\bgames?\s+for\s+steam\s*deck\b/.test(n) ||
    /\bbest\s+steam\s*deck\b/.test(n) ||
    /\bsteamdeck\s+recommendations?\b/.test(n)

  const hasRpg =
    /\b(rpg|crpg|jrpg|role[\s-]?playing|gdr|giochi?\s+di\s+ruolo)\b/.test(n)
  const hasPartyContext =
    /\b(party|partito|compagni|companions?|companion|squad|crew|persistente|persistent)\b/.test(
      n
    )
  const rpgCompanionParty = hasRpg && hasPartyContext

  const psychologicalHorror =
    /\b(psychological\s+horror|psych\s+horror|horror\s+psicolog\w*)\b/.test(n) ||
    (/\bhorror\b/.test(n) && /\bpsicolog\w*\b/.test(n))

  const memorableDiscovery =
    /\b(surprise\s+me|stupiscimi|something\s+unforgettable|unforgettable|hidden\s+gem|overlooked\s+gem|cult\s+classic|sottovalutat\w*|underrated|tired\s+of\s+aaa|weird\s+but|memorable|think(?:ing)?\s+about\s+(?:it|them|this)\s+(?:later|after|week)|still\s+be\s+thinking|gemme\s+nascoste|qualcosa\s+di\s+special\w*|qualcosa\s+che\s+non\s+dimenticher\w*|love\s+gaming\s+again|make\s+you\s+love\s+gaming|fall\s+in\s+love\s+with\s+gaming|restore\s+(?:my\s+)?faith\s+in\s+gaming|rekindle.*gaming)\b/.test(
      n
    ) ||
    (/\b(special|meaningful|emotional(?:ly)?\s+memorable|genuinely\s+lonely|lonely\s+but\s+beautiful|beautiful\s+way)\b/.test(
      n
    ) &&
      /\b(feel|game|gioch\w*|experience|atmosphere|emotional|lonely|beautiful)\b/.test(
        n
      ))

  const cozyShortSession =
    /\b(cozy|cosy|rilassante|relaxing|chill|wholesome|comfort)\b/.test(n) &&
    /\b(short|evening|sera|quick|brief|breve|session|sessions|before\s+bed|wind\s+down)\b/.test(
      n
    )

  let discoverySubkind: DiscoverySubkind | null = null
  if (memorableDiscovery || cozyShortSession || hasObscureDiscoveryIntent(n)) {
    discoverySubkind = detectDiscoverySubkind(n)
  }

  return {
    steamDeck,
    rpgCompanionParty,
    psychologicalHorror,
    memorableDiscovery,
    cozyShortSession,
    discoverySubkind,
  }
}

/** Refine discovery intent for query pools and ranking weights. */
export function detectDiscoverySubkind(normalizedText: string): DiscoverySubkind {
  const n = normalizedText
  if (/\b(tired\s+of\s+aaa|surprise\s+me|stupiscimi|unforgettable|think(?:ing)?\s+about)\b/.test(n)) {
    return "anti_aaa"
  }
  if (/\b(lonely|loneliness|solitud\w*|genuinely\s+lonely|beautiful\s+way)\b/.test(n)) {
    return "lonely_beautiful"
  }
  if (
    /\b(not the usual indie|not usual indie|not usual recommendations|no usual indie|less obvious indie|without the usual indie|under the radar|not mainstream indie)\b/.test(
      n
    ) ||
    /\b(underrated|sottovalutat\w*|hidden\s+gem|overlooked|less famous|obscure|weird underrated|under\s+\$\d+|under\s+\d+\s*(?:usd|eur|\$|€)?)\b/.test(
      n
    )
  ) {
    return "underrated"
  }
  if (/\b(one\s+weekend|finish\s+in\s+a\s+weekend|short\s+unforgettable|lasting\s+impression|finire\s+in\s+un\s+weekend)\b/.test(n)) {
    return "weekend_finish"
  }
  if (/\b(cozy|cosy|rilassante|relaxing|evening\s+session|short\s+session)\b/.test(n)) {
    return "cozy_short"
  }
  return "generic"
}

export function isUnsafeDiscoveryQuery(query: string): boolean {
  const n = query.trim().toLowerCase()
  if (!n) return true
  if (UNSAFE_DISCOVERY_QUERY_RE.test(n)) return true
  if (/^(surprise|experience|indie|weird|unforgettable|memorable|emotional|lonely|loneliness)\s+(me|games?|game)?$/i.test(n)) {
    return true
  }
  if (/\b(vr\s+experience|indie\s+game\s+battle|game\s+battle|tech\s+demo)\b/i.test(n)) {
    return true
  }
  // Single fluff word + optional "game"
  const tokens = n.split(/\s+/).filter(Boolean)
  if (tokens.length <= 2 && UNSAFE_DISCOVERY_QUERY_RE.test(tokens[0] ?? "")) {
    return true
  }
  return false
}

/** Strip discovery-fluff so retrieval keywords reflect taste, not vague adjectives. */
export function stripDiscoveryFluffPhrases(text: string): string {
  return text
    .replace(
      /\b(surprise\s+me|stupiscimi|something\s+unforgettable|tired\s+of\s+aaa\s+games?|hidden\s+gems?|overlooked\s+gems?|cult\s+classic|underrated\s+but\s+special|still\s+be\s+thinking\s+about\s+it\s+(?:a\s+week\s+later)?)\b/gi,
      " "
    )
    .replace(/\b(give\s+me\s+a\s+game|find\s+me|i\s+want\s+a\s+game|i\s+only\s+have)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Low-quality titles common in discovery RAWG fallback (keyword spam, VR demos, literal mood words).
 */
export function isDiscoveryShovelwareTitle(title: string): boolean {
  const n = title.toLowerCase().trim()
  if (!n) return true
  if (/\b(indie\s+game\s+battle|game\s+battle)\b/i.test(n)) return true
  if (/\b(vr|virtual\s+reality)\s+experience\b/i.test(n)) return true
  if (/\b(plank|tech)\s+experience\b/i.test(n)) return true
  if (/^loneliness\.?$/i.test(n)) return true
  if (/^(surprise|unforgettable|memorable|emotional|weird|experience|indie)\.?$/i.test(n)) {
    return true
  }
  if (/:\s*.*\b(experience|simulator)\b/i.test(n) && n.length <= 48) {
    if (!/\b(story|adventure|horror|rpg|puzzle)\b/i.test(n)) return true
  }
  // Acronym-only or very short opaque titles with "experience" pattern
  if (/^[A-Z][.\sA-Z]{1,8}$/.test(title.trim()) && n.length <= 12) return true
  return false
}

/** Title matches discovery fluff keywords without genre/tag support. */
export function isDiscoveryTitleKeywordSpam(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags" | "ratings_count">
): boolean {
  if (isDiscoveryShovelwareTitle(candidate.name)) return true

  const titleHit = DISCOVERY_TITLE_KEYWORD_RE.test(candidate.name)
  if (!titleHit) return false

  const genres = genreBlob(candidate)
  const hasGenreSignal =
    /\b(adventure|indie|narrative|story|atmospheric|exploration|puzzle|horror|rpg|simulation|casual)\b/i.test(
      genres
    )
  const ratings =
    typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0

  if (!hasGenreSignal && ratings < 3500) return true
  return false
}

function discoveryPoolForSubkind(subkind: DiscoverySubkind | null): readonly string[] {
  switch (subkind) {
    case "anti_aaa":
      return DISCOVERY_ANTI_AAA_POOLS
    case "lonely_beautiful":
      return DISCOVERY_LONELY_POOLS
    case "underrated":
      return DISCOVERY_UNDERRATED_POOLS
    case "weekend_finish":
      return DISCOVERY_WEEKEND_POOLS
    case "cozy_short":
      return COZY_SHORT_SESSION_POOLS
    default:
      return MEMORABLE_DISCOVERY_BASE_POOLS
  }
}

function augmentMemorableDiscoveryQueries(
  queries: string[],
  userPrompt: string,
  signals: IntentSignals
): string[] {
  const sanitized = queries
    .map((q) => q.trim())
    .filter(Boolean)
    .filter((q) => !isUnsafeDiscoveryQuery(q))

  const content = stripDiscoveryFluffPhrases(userPrompt)
  const pool = discoveryPoolForSubkind(signals.discoverySubkind)

  const extras: string[] = [...pool]
  if (content.length >= 4) {
    extras.unshift(content, `${content} indie game`, `${content} acclaimed indie`)
  }

  if (signals.discoverySubkind === "anti_aaa") {
    extras.unshift("critically acclaimed indie adventure", "unique cult indie games")
  }
  if (signals.discoverySubkind === "lonely_beautiful") {
    extras.unshift("melancholic exploration indie", "atmospheric emotional indie")
  }
  if (signals.discoverySubkind === "underrated") {
    extras.unshift("hidden gem adventure games", "underrated story rich games")
  }

  if (sanitized.length >= 2) {
    return mergeUniqueStrings([...sanitized, ...extras], 10)
  }
  return mergeUniqueStrings([...sanitized, ...extras], 10)
}

function augmentCozyShortSessionQueries(queries: string[], userPrompt: string): string[] {
  const sanitized = queries
    .map((q) => q.trim())
    .filter(Boolean)
    .filter((q) => !isUnsafeDiscoveryQuery(q))

  const content = stripDiscoveryFluffPhrases(userPrompt)
  const extras: string[] = [...COZY_SHORT_SESSION_POOLS]
  if (content.length >= 3) {
    extras.unshift(content, `${content} cozy indie`)
  }

  return mergeUniqueStrings([...sanitized, ...extras], 8)
}

/**
 * Game title matches prompt keywords "steam" or "deck" — not valid Steam Deck recommendations.
 * Excludes games like Steam Marines, Heck Deck, Gestalt: Steam & Cinder.
 */
export function isSteamDeckTitleKeywordSpam(title: string): boolean {
  const n = title.toLowerCase()
  if (/\bsteam\s*deck\b/.test(n)) return false
  if (/\bsteam\b/.test(n)) return true
  if (/\bdeck\b/.test(n)) return true
  return false
}

/** Low-quality horror titles that only stuff genre keywords into the name. */
export function isHorrorKeywordShovelwareTitle(title: string): boolean {
  const n = title.toLowerCase()
  if (
    /psychological\s+horror/i.test(n) &&
    /\b(game|puzzle|prelude|puppet|nightmare)\b/i.test(n)
  ) {
    return true
  }
  if (/:\s*.*\bhorror\s+game\b/i.test(n)) return true
  if (/^prelude:\s/i.test(n) && /\bhorror\b/i.test(n)) return true
  if (/\bhorror\s+puzzle\s+game\b/i.test(n)) return true

  const horrorWordCount = (
    n.match(/\b(horror|psychological|psychologic|nightmare|terror|puppet)\b/g) ?? []
  ).length
  if (horrorWordCount >= 2 && n.length <= 72) {
    return true
  }
  return false
}

export function isUnsafeSteamDeckDiscoveryQuery(query: string): boolean {
  const n = query.trim().toLowerCase()
  if (!n) return true
  if (/^(steam|deck)$/.test(n)) return true
  if (/^games?\s+(with|for)\s+deck\b/.test(n)) return true
  if (/^steam\s+games?\b/.test(n)) return true
  if (/\bdeck\b/.test(n) && !/\bsteam deck\b/.test(n)) {
    if (!/\b(handheld|portable|verified|friendly|controller|builder|building)\b/.test(n)) {
      return true
    }
  }
  if (/\bsteam\b/.test(n) && !/\bsteam deck\b/.test(n)) {
    if (!/\b(handheld|portable|verified|friendly|controller|indie|deck)\b/.test(n)) {
      return true
    }
  }
  return false
}

/** Strip unsafe RAWG queries; augment when the pool is thin. */
export function sanitizeDiscoveryQueries(
  queries: string[],
  signals: IntentSignals,
  userPrompt = ""
): string[] {
  let filtered = queries
    .map((q) => q.trim())
    .filter(Boolean)

  if (signals.memorableDiscovery || signals.cozyShortSession) {
    filtered = filtered.filter((q) => !isUnsafeDiscoveryQuery(q))
  }

  if (signals.steamDeck) {
    filtered = filtered.filter((q) => !isUnsafeSteamDeckDiscoveryQuery(q))

    if (filtered.length < 2) {
      const split = splitSteamDeckIntent(userPrompt)
      if (split && !split.isPlatformOnly && split.contentPrompt.length >= 3) {
        filtered = mergeUniqueStrings(
          [
            ...filtered,
            split.contentPrompt,
            `${split.contentPrompt} indie game`,
            `${split.contentPrompt} pc game`,
          ],
          8
        )
      } else if (!signals.memorableDiscovery && !signals.cozyShortSession) {
        filtered = mergeUniqueStrings([...filtered, ...PLATFORM_ONLY_DISCOVERY_POOLS], 8)
      }
    } else if (!signals.memorableDiscovery && !signals.cozyShortSession) {
      return mergeUniqueStrings(filtered, 8)
    }
  }

  if (signals.memorableDiscovery) {
    return augmentMemorableDiscoveryQueries(filtered, userPrompt, signals)
  }

  if (signals.cozyShortSession) {
    return augmentCozyShortSessionQueries(filtered, userPrompt)
  }

  return mergeUniqueStrings(filtered, 8)
}

export function sanitizeCoreKeywordsForSignals(
  keywords: string[],
  signals: IntentSignals
): string[] {
  let out = keywords
  if (signals.steamDeck) {
    out = out.filter((k) => {
      const n = k.toLowerCase().trim()
      if (n === "steam" || n === "deck") return false
      if (n === "steam deck") return false
      return true
    })
  }
  if (signals.memorableDiscovery || signals.cozyShortSession) {
    const fluff = new Set([
      "surprise",
      "unforgettable",
      "memorable",
      "experience",
      "indie",
      "weird",
      "hidden",
      "gem",
      "underrated",
      "emotional",
      "lonely",
      "loneliness",
      "aaa",
      "special",
      "stupiscimi",
    ])
    out = out.filter((k) => !fluff.has(k.toLowerCase().trim()))
  }
  return out
}

export function shouldRejectCandidateForSignals(
  candidate: Pick<
    RawgCandidate,
    "name" | "genres" | "tags" | "ratings_count" | "rating"
  >,
  signals: IntentSignals,
  userPrompt = ""
): boolean {
  if (signals.steamDeck && isSteamDeckTitleKeywordSpam(candidate.name)) {
    return true
  }
  if (signals.psychologicalHorror && isHorrorKeywordShovelwareTitle(candidate.name)) {
    return true
  }
  if (signals.psychologicalHorror) {
    const genres = [
      ...(candidate.genres ?? []).map((g) => g.name),
      ...(candidate.tags ?? []).map((t) => t.name),
    ]
      .join(" ")
      .toLowerCase()
    const titleHorror = HORROR_TITLE_KEYWORD_RE.test(candidate.name)
    const genreHorror = /\bhorror\b/i.test(genres)
    const ratings =
      typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0
    if (titleHorror && !genreHorror && ratings < 2500) return true
  }
  if (signals.memorableDiscovery || signals.cozyShortSession) {
    if (isDiscoveryShovelwareTitle(candidate.name)) return true
    if (isDiscoveryTitleKeywordSpam(candidate)) return true
    const ratings =
      typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0
    const rating = typeof candidate.rating === "number" ? candidate.rating : 0
    if (ratings < 80 && rating <= 0) return true
  }

  const mustHave = extractMustHaveConstraints(userPrompt, signals)
  if (violatesMustHaveConstraints(candidate, mustHave)) return true
  if (shouldRejectNonCanonicalSideEdition(candidate.name, userPrompt)) return true
  if (shouldRejectDirtyPlatformTitleVariant(candidate.name, userPrompt)) return true
  if (isFantasyRaceStrategyMustHave(mustHave) && isWeakFantasyStrategyFillerTitle(candidate.name)) {
    return true
  }

  return false
}

/** Clarify ambiguous phrasing for the discovery model (does not replace the user prompt in caches). */
export function enrichPromptForDiscovery(
  userPrompt: string,
  signals: IntentSignals
): string {
  const base = userPrompt.trim()
  if (!base) return base

  const hints: string[] = []
  if (signals.steamDeck) {
    const split = splitSteamDeckIntent(base)
    if (split?.isPlatformOnly) {
      hints.push(
        `Platform filter: ${STEAM_DECK_PLATFORM_CONSTRAINT}. User wants broadly appealing Deck-friendly games — vary genres and styles. Do NOT match games because \"steam\" or \"deck\" appears in the title.`
      )
    } else if (split?.contentPrompt) {
      hints.push(
        `Primary taste intent: \"${split.contentPrompt}\" (genre/mood/pacing — this must dominate picks and fallbackDiscoveryQueries).`,
        `Platform filter (secondary): ${STEAM_DECK_PLATFORM_CONSTRAINT}. Filter for compatibility only — do NOT match title keywords steam/deck.`
      )
    } else {
      hints.push(
        `Platform filter: ${STEAM_DECK_PLATFORM_CONSTRAINT}. Do NOT match title keywords steam/deck.`
      )
    }
  }
  if (signals.rpgCompanionParty) {
    hints.push(
      "Intent note: party in RPG context = persistent companion/party systems in single-player CRPGs/tactical RPGs, not multiplayer party modes."
    )
  }
  if (signals.psychologicalHorror) {
    hints.push(
      "Intent note: psychological horror — established, recognizable horror-genre games only; never obscure titles whose names are keyword lists like \"Psychological Horror Game\"."
    )
  }
  if (signals.memorableDiscovery) {
    hints.push(
      "Intent note: open-ended discovery — recommend critically respected indie/cult classics with strong emotional or narrative reputation (memorable, not generic). Avoid shovelware, VR demos, and games selected only because the title contains words like surprise, experience, unforgettable, or loneliness."
    )
    if (signals.discoverySubkind === "anti_aaa") {
      hints.push(
        "User is tired of mainstream AAA — prefer distinctive cult/indie picks with lasting impact; downrank obvious blockbuster franchises unless uniquely fitting."
      )
    }
    if (signals.discoverySubkind === "lonely_beautiful") {
      hints.push(
        "Prefer melancholic atmospheric exploration, contemplative narrative adventures, and emotional art games — not literal title matches on lonely/loneliness."
      )
    }
    if (signals.discoverySubkind === "underrated") {
      hints.push(
        "User wants hidden gems / under-the-radar / not-usual-indie picks — do NOT default to famous indie canon (Hollow Knight, Undertale, Celeste, Edith Finch, Oxenfree, Night in the Woods, Gris, A Short Hike). Prefer acclaimed lower-awareness titles with proven quality."
      )
    }
    if (
      /\b(love gaming again|restore my love for games|remind me why games are special|magic of gaming)\b/i.test(
        base
      ) &&
      !hasObscureDiscoveryIntent(base)
    ) {
      hints.push(
        "User wants memorable / magical games that restore love for gaming — NOT hidden gems. Mix classics, ambitious games, and unique experiences; avoid clustering narrative indie safe picks or curator-default discovery darlings."
      )
    }
  }
  if (signals.cozyShortSession) {
    hints.push(
      "Intent note: cozy short evening sessions — prefer relaxing, low-pressure games with gentle loops (farming sim, wholesome adventure, life sim); avoid grind-heavy or stressful picks."
    )
  }

  const mustHave = extractMustHaveConstraints(base, signals)
  if (mustHave.active) {
    hints.push(
      `Must-have constraints (hard requirements — do not suggest contradicting games): settings=[${mustHave.settings.join(", ") || "none"}], races=[${mustHave.races.join(", ") || "none"}], mechanics=[${mustHave.mechanics.join(", ") || "none"}], genres=[${mustHave.genres.join(", ") || "none"}]. Example: fantasy+elves/orcs required → reject sci-fi-only strategy like space/planetfall settings; JRPG/turn-based required → reject story-only walking sims.`
    )
  }

  if (hints.length === 0) return base
  return `${base}\n${hints.join("\n")}`
}

export function buildDisambiguationRules(
  signals: IntentSignals,
  userPrompt = ""
): string[] {
  const rules: string[] = []
  if (signals.steamDeck) {
    rules.push(
      "Steam Deck is a PLATFORM FILTER (handheld PC, controller-friendly, portable) — NOT a title keyword search. NEVER pick games because the title contains \"Steam\" or \"Deck\"."
    )
    rules.push(
      "When the user also names a genre/mood (cozy, roguelike, horror, etc.), that taste MUST dominate suggestedTitles and fallbackDiscoveryQueries; Steam Deck only constrains compatibility in reasons."
    )
    rules.push(
      "fallbackDiscoveryQueries must never be bare \"steam\" or \"deck\", or searches for games with steam/deck in the title."
    )
  }
  if (signals.rpgCompanionParty) {
    rules.push(
      "RPG + party (e.g. \"party persistente\") = companion/persistent party CRPGs or tactical RPGs — NOT multiplayer party modes, party minigames, or generic co-op party games."
    )
  }
  if (signals.psychologicalHorror) {
    rules.push(
      "Psychological horror: only established horror-genre games — reject keyword-stuffed titles like \"Psychological Horror Puzzle Game\" or \"Prelude: Psychological Horror Game\"."
    )
  }
  if (signals.memorableDiscovery) {
    rules.push(
      "Memorable discovery: suggest critically respected indie/cult classics with strong player reputation — NOT obscure shovelware, VR demos, or titles that only match keywords (surprise, experience, unforgettable, loneliness)."
    )
    rules.push(
      "fallbackDiscoveryQueries must use high-signal phrases (e.g. cult classic indie, memorable narrative indie, emotional atmospheric adventure) — NEVER bare surprise, experience, indie, weird, or unforgettable alone."
    )
  }
  if (signals.cozyShortSession) {
    rules.push(
      "Cozy short sessions: prefer wholesome relaxing indies with gentle loops — farming sim, life sim, cozy adventure — not stressful grind games."
    )
  }
  const mustHave = extractMustHaveConstraints(userPrompt, signals)
  if (mustHave.active) {
    rules.push(
      "Highly specific prompt: treat setting, races, and mechanics as MUST-HAVE constraints — not soft preferences. Do not recommend games that contradict the required setting (e.g. sci-fi/space when fantasy+elves/orcs are required)."
    )
    rules.push(
      "For fantasy race strategy prompts, fallbackDiscoveryQueries must include high-signal phrases like \"fantasy RTS orcs elves\", \"fantasy faction strategy\" — not generic \"strategy factions\" or \"city building\" alone."
    )
  }
  return rules
}

function mergeUniqueStrings(items: string[], max: number) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const t = item.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

export function normalizeIntentForSignals(
  normalizedIntent: string,
  userPrompt: string,
  signals: IntentSignals
): string {
  if (signals.steamDeck) {
    const split = splitSteamDeckIntent(userPrompt)
    const aiIntent = (normalizedIntent || userPrompt).trim()

    if (split?.isPlatformOnly) {
      return `Recommend broadly appealing games that play well on Steam Deck (${STEAM_DECK_PLATFORM_CONSTRAINT}).`
    }
    if (split?.contentPrompt) {
      const content = split.contentPrompt
      const cleanedAi = stripSteamDeckPhrases(aiIntent)
      const taste =
        cleanedAi.length >= 3 && !/steam deck/i.test(cleanedAi)
          ? cleanedAi
          : content
      return `Recommend ${taste} that play well on Steam Deck (${STEAM_DECK_PLATFORM_CONSTRAINT}).`
    }
    return collapseSteamDeckPhrase(aiIntent)
  }
  if (signals.psychologicalHorror) {
    const base = (normalizedIntent || userPrompt).trim()
    if (/\bpsicolog|psychological/i.test(base)) return base
    return `Psychological horror games with atmospheric dread. ${base}`.trim()
  }
  if (signals.memorableDiscovery) {
    const base = stripDiscoveryFluffPhrases((normalizedIntent || userPrompt).trim())
    if (signals.discoverySubkind === "anti_aaa") {
      return `Distinctive memorable indie/cult games with lasting impact (not mainstream AAA). ${base}`.trim()
    }
    if (signals.discoverySubkind === "lonely_beautiful") {
      return `Melancholic atmospheric games that feel lonely in a beautiful way. ${base}`.trim()
    }
    if (signals.discoverySubkind === "underrated") {
      return `Underrated acclaimed games that feel special. ${base}`.trim()
    }
    if (signals.discoverySubkind === "weekend_finish") {
      return `Short memorable games finishable in a weekend with lasting impact. ${base}`.trim()
    }
    return `Memorable discovery picks with strong emotional or narrative reputation. ${base}`.trim()
  }
  if (signals.cozyShortSession) {
    const base = (normalizedIntent || userPrompt).trim()
    return `Relaxing cozy games suited to short evening sessions. ${base}`.trim()
  }
  return normalizedIntent
}

/** Merge signal-specific needs/avoid/queries into AI discovery output. */
export function mergeIntentAugmentation(
  intent: IntentAugmentFields,
  signals: IntentSignals,
  userPrompt = ""
): IntentAugmentFields {
  const coreNeeds = [...intent.coreNeeds]
  const avoid = [...intent.avoid]
  let fallbackDiscoveryQueries = [...intent.fallbackDiscoveryQueries]
  let normalizedIntent = intent.normalizedIntent

  normalizedIntent = normalizeIntentForSignals(
    normalizedIntent,
    userPrompt,
    signals
  )

  if (signals.steamDeck) {
    coreNeeds.push(...STEAM_DECK_PLATFORM_CORE_NEEDS)
    avoid.push(
      "games with steam in the title",
      "games with deck in the title",
      "card games",
      "deckbuilders",
      "deck building",
      "playing cards",
      "TCG",
      "title keyword matching"
    )

    const split = splitSteamDeckIntent(userPrompt)
    const sanitizedAi = fallbackDiscoveryQueries
      .map((q) => q.trim())
      .filter(Boolean)
      .filter((q) => !isUnsafeSteamDeckDiscoveryQuery(q))

    if (split && !split.isPlatformOnly && split.contentPrompt.length >= 3) {
      fallbackDiscoveryQueries = mergeUniqueStrings(
        [
          ...sanitizedAi,
          split.contentPrompt,
          `${split.contentPrompt} indie`,
          `${split.contentPrompt} game`,
        ],
        8
      )
    } else {
      fallbackDiscoveryQueries = sanitizeDiscoveryQueries(
        sanitizedAi,
        signals,
        userPrompt
      )
    }
  }

  if (signals.rpgCompanionParty) {
    coreNeeds.push(
      "persistent companion party",
      "CRPG party dynamics",
      "tactical party RPG"
    )
    avoid.push(
      "party multiplayer",
      "party minigames",
      "party game collection",
      "co-op party modes"
    )
    fallbackDiscoveryQueries.push(
      "crpg companion party",
      "tactical rpg party",
      "story rpg companions"
    )
  }

  if (signals.psychologicalHorror) {
    coreNeeds.push(
      "psychological horror",
      "atmospheric dread",
      "narrative horror",
      "established horror genre"
    )
    avoid.push(
      "keyword-stuffed horror titles",
      "obscure horror spam",
      "Psychological Horror Game in title"
    )
    fallbackDiscoveryQueries = mergeUniqueStrings(
      [
        "psychological horror",
        "narrative survival horror",
        "atmospheric horror adventure",
        ...fallbackDiscoveryQueries.filter(
          (q) => !/^(horror|psychological)$/i.test(q.trim())
        ),
      ],
      8
    )
  }

  if (signals.memorableDiscovery) {
    coreNeeds.push(
      "critically respected",
      "memorable narrative or emotional impact",
      "strong player reputation",
      "distinctive indie or cult appeal"
    )
    avoid.push(
      "shovelware",
      "VR tech demos",
      "keyword-stuffed titles",
      "literal title keyword matches",
      "random experience games",
      "indie game battle"
    )
    if (signals.discoverySubkind === "anti_aaa") {
      avoid.push("mainstream AAA blockbusters", "obvious franchise safe picks")
      coreNeeds.push("non-obvious cult or indie picks")
    }
    if (signals.discoverySubkind === "lonely_beautiful") {
      coreNeeds.push("melancholic atmosphere", "contemplative exploration", "emotional art direction")
    }
    fallbackDiscoveryQueries = augmentMemorableDiscoveryQueries(
      fallbackDiscoveryQueries,
      userPrompt,
      signals
    )
  }

  if (signals.cozyShortSession) {
    coreNeeds.push(
      "cozy relaxing tone",
      "low-pressure gentle loops",
      "good for short sessions"
    )
    avoid.push("stressful grind", "hardcore survival pressure", "long mandatory sessions")
    fallbackDiscoveryQueries = augmentCozyShortSessionQueries(
      fallbackDiscoveryQueries,
      userPrompt
    )
  }

  const mustHave = extractMustHaveConstraints(userPrompt, signals)
  if (mustHave.active) {
    for (const s of mustHave.settings) {
      coreNeeds.push(`${s} setting`)
    }
    for (const r of mustHave.races) {
      coreNeeds.push(r === "fantasy-races" ? "multiple fantasy races" : r)
    }
    for (const m of mustHave.mechanics) {
      coreNeeds.push(m.replace(/-/g, " "))
    }
    for (const g of mustHave.genres) {
      coreNeeds.push(g.replace(/-/g, " "))
    }
    if (requiresRpgGenreCombat(mustHave)) {
      avoid.push(
        "walking simulator",
        "story-only adventure",
        "visual novel without RPG combat",
        "Life is Strange-style narrative"
      )
    }
    if (requiresTurnBasedRpg(mustHave)) {
      avoid.push(
        "action JRPG",
        "real-time combat JRPG",
        "action RPG combat loop",
        "Xenoblade-style action combat"
      )
      coreNeeds.push("turn-based combat", "command-based battles")
    }
    if (mustHave.settings.includes("fantasy")) {
      avoid.push(
        "sci-fi only",
        "space setting without fantasy",
        "science fiction strategy without fantasy races"
      )
    }
    fallbackDiscoveryQueries = augmentMustHaveDiscoveryQueries(
      fallbackDiscoveryQueries,
      mustHave
    )
  }

  return {
    normalizedIntent,
    coreNeeds: mergeUniqueStrings(coreNeeds, 12),
    avoid: mergeUniqueStrings(avoid, 12),
    fallbackDiscoveryQueries: mergeUniqueStrings(
      fallbackDiscoveryQueries,
      mustHave.active && isFantasyRaceStrategyMustHave(mustHave) ? 16 : 14
    ),
  }
}

/** Prevent lone \"steam\" / \"deck\" tokens from driving title-keyword retrieval. */
export function sanitizeIntentKeywordSet(
  keywords: Set<string>,
  signals: IntentSignals
): Set<string> {
  const out = new Set(keywords)
  if (signals.steamDeck) {
    out.delete("deck")
    out.delete("steam")
    out.delete("steamdeck")
    out.add("handheld")
    out.add("portable")
    out.add("controller-friendly")
  }
  if (signals.memorableDiscovery || signals.cozyShortSession) {
    const fluff = [
      "surprise",
      "unforgettable",
      "memorable",
      "experience",
      "weird",
      "hidden",
      "gem",
      "underrated",
      "emotional",
      "lonely",
      "loneliness",
      "aaa",
      "special",
      "indie",
      "stupiscimi",
    ]
    for (const f of fluff) out.delete(f)
    out.add("narrative")
    out.add("atmospheric")
    out.add("acclaimed")
  }
  return out
}

export function buildSubjectContextForIntent(
  intentBlob: string,
  signals?: IntentSignals
): Record<string, string[]> {
  const ctx: Record<string, string[]> = {}
  const steamDeck =
    signals?.steamDeck ||
    /\bsteam\s*deck\b|\bsteamdeck\b|\bvalve\s+handheld\b|Steam Deck platform/i.test(
      intentBlob
    )
  if (steamDeck) {
    const platformCtx = [
      "handheld",
      "portable",
      "verified",
      "linux",
      "controller",
      "indie",
      "action",
      "adventure",
    ]
    ctx.deck = platformCtx
    ctx.steam = platformCtx
  }
  return ctx
}

function candidateBlob(candidate: Pick<RawgCandidate, "name" | "genres" | "tags">) {
  const genreText = (candidate.genres ?? []).map((g) => g.name).join(" | ")
  const tagText = (candidate.tags ?? []).map((t) => t.name).join(" | ")
  return `${candidate.name} | ${genreText} | ${tagText}`.toLowerCase()
}

function genreBlob(candidate: Pick<RawgCandidate, "genres" | "tags">) {
  return [
    ...(candidate.genres ?? []).map((g) => g.name),
    ...(candidate.tags ?? []).map((t) => t.name),
  ]
    .join(" ")
    .toLowerCase()
}

const DECKBUILDER_RE =
  /\b(deckbuilder|deck builder|deck-building|deckbuilding|card game|tcg|trading card|playing cards?)\b/i
const PARTY_GAME_RE =
  /\b(party game|party games|minigame|minigames|multiplayer party|mario party)\b/i
const HORROR_TITLE_KEYWORD_RE =
  /\b(horror|psicolog|psycholog|fear|nightmare|terror|dread)\b/i

/**
 * Heuristic relevance adjustment for verified/final candidates.
 * Positive = better fit; negative = demote or drop.
 */
export function scoreCandidateRelevanceBoost(params: {
  signals: IntentSignals
  userPrompt: string
  normalizedIntent: string
  coreNeeds: string[]
  candidate: Pick<
    RawgCandidate,
    "name" | "genres" | "tags" | "ratings_count" | "rating" | "added"
  >
  matchTier?: string
}): number {
  const { signals, normalizedIntent, candidate, matchTier } = params
  const blob = candidateBlob(candidate)
  const genres = genreBlob(candidate)
  let delta = 0

  if (signals.steamDeck) {
    if (isSteamDeckTitleKeywordSpam(candidate.name)) delta -= 120
    if (DECKBUILDER_RE.test(blob)) delta -= 42
    if (/\bsteam deck\b/i.test(blob) || /\bverified\b/i.test(blob)) delta += 14
    if (/\b(handheld|portable|controller)\b/i.test(blob)) delta += 10

    const ratings =
      typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0
    const added = typeof candidate.added === "number" ? candidate.added : 0
    if (!isSteamDeckTitleKeywordSpam(candidate.name) && (ratings > 5000 || added > 5000)) {
      delta += 8
    }
  }

  if (signals.rpgCompanionParty) {
    if (PARTY_GAME_RE.test(blob)) delta -= 36
    if (/\b(rpg|role-playing|crpg|tactical|story rich|party)\b/i.test(genres)) delta += 10
    if (/\b(companion|companions|character|choices matter)\b/i.test(genres)) delta += 8
    if (/\b(multiplayer|co-op|online)\b/i.test(genres) && !/\b(rpg|role)\b/i.test(genres)) {
      delta -= 12
    }
  }

  if (signals.psychologicalHorror) {
    if (isHorrorKeywordShovelwareTitle(candidate.name)) delta -= 120

    const genreHasHorror = /\bhorror\b/i.test(genres)
    const titleKeywordHit = HORROR_TITLE_KEYWORD_RE.test(candidate.name)
    const psychTag =
      /\b(psychological|psych|survival horror|atmospheric|narrative)\b/i.test(genres)

    if (titleKeywordHit && !genreHasHorror) delta -= 55
    if (genreHasHorror && psychTag) delta += 20
    else if (genreHasHorror) delta += 12

    const ratings = typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0
    if (titleKeywordHit && !genreHasHorror && ratings < 2500) delta -= 35
    if (matchTier === "partial_match" && !genreHasHorror && titleKeywordHit) delta -= 30
    if (genreHasHorror && ratings > 8000) delta += 10
  }

  if (signals.memorableDiscovery || signals.cozyShortSession) {
    if (isDiscoveryShovelwareTitle(candidate.name)) delta -= 120
    if (isDiscoveryTitleKeywordSpam(candidate)) delta -= 70

    const ratings =
      typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0
    const added = typeof candidate.added === "number" ? candidate.added : 0
    const rating = typeof candidate.rating === "number" ? candidate.rating : 0

    const genreNarrative = /\b(story|narrative|adventure|atmospheric|indie|exploration|emotional|walking simulator)\b/i.test(
      genres
    )
    const genreCozy = /\b(cozy|relaxing|farming|life sim|wholesome|casual|simulation)\b/i.test(
      genres
    )

    if (genreNarrative && ratings > 1500) delta += 14
    if (rating >= 3.8 && ratings > 800) delta += 10
    if (ratings > 5000 && rating >= 3.5) delta += 8
    if (!genreNarrative && DISCOVERY_TITLE_KEYWORD_RE.test(candidate.name)) delta -= 45
    if (ratings < 150 && rating <= 0) delta -= 40

    if (signals.discoverySubkind === "anti_aaa" && added > 75000 && ratings > 40000) {
      delta -= 28
    }
    const obscureIntent =
      signals.discoverySubkind === "underrated" ||
      hasObscureDiscoveryIntent(params.userPrompt)
    if (obscureIntent) {
      if (isFamousIndieForObscurePrompt(candidate.name)) {
        delta -= 44
      }
      if (added > 50_000 && ratings > 25_000) delta -= 32
      else if (added > 30_000 && ratings > 15_000) delta -= 24
      else if (added > 15_000 && ratings > 8_000) delta -= 16
      const nameLower = candidate.name.toLowerCase()
      if (
        isDiscoveryCanonTitle(candidate.name) &&
        ratings >= 250 &&
        rating >= 3.5
      ) {
        delta += 4
      } else if (
        /\b(hypnospace outlaw|chants of sennaar|void stranger|obra dinn|in stars and time|pathologic|sable|dredge|tunic|animal well|golden idol|eliza|1000xresist|felvidek|cosmic wheel sisterhood)\b/i.test(
          `${nameLower} ${blob}`
        ) &&
        ratings >= 250 &&
        rating >= 3.5
      ) {
        delta += 8
      }
    }
    if (signals.discoverySubkind === "lonely_beautiful") {
      if (/\b(exploration|atmospheric|adventure|indie|narrative|walking)\b/i.test(genres)) {
        delta += 12
      }
      if (/\b(multiplayer|battle royale|fps|shooter|sports)\b/i.test(genres) && !genreNarrative) {
        delta -= 18
      }
    }
    if (signals.cozyShortSession || signals.discoverySubkind === "cozy_short") {
      if (genreCozy) delta += 16
      if (/\b(soulslike|hardcore|survival|horror|stressful|competitive)\b/i.test(genres) && !genreCozy) {
        delta -= 14
      }
    }
  }

  const intentBlob = `${params.userPrompt} ${normalizedIntent}`.toLowerCase()
  if (
    signals.steamDeck &&
    /\bdeck\b/i.test(intentBlob) &&
    DECKBUILDER_RE.test(blob)
  ) {
    delta -= 10
  }

  const mustHave = extractMustHaveConstraints(params.userPrompt, signals)
  delta += scoreMustHaveConstraintBoost(candidate, mustHave)
  delta += scoreCanonicalTitlePreference({
    candidateName: candidate.name,
    userPrompt: params.userPrompt,
    preferFranchiseMainline: isFantasyRaceStrategyMustHave(mustHave),
  })

  return delta
}

export function shouldDropWeakFastPick(params: {
  signals: IntentSignals
  userPrompt?: string
  match: number
  matchTier: string
  reason?: string
  relevanceBoost: number
  candidate?: Pick<RawgCandidate, "name" | "genres" | "tags" | "ratings_count">
}): boolean {
  const { signals, match, matchTier, relevanceBoost, candidate, userPrompt = "", reason = "" } =
    params

  if (candidate && shouldRejectCandidateForSignals(candidate, signals, userPrompt)) {
    return true
  }

  if (signals.steamDeck && candidate && isSteamDeckTitleKeywordSpam(candidate.name)) {
    return true
  }

  if (signals.psychologicalHorror) {
    if (candidate && isHorrorKeywordShovelwareTitle(candidate.name)) return true
    if (relevanceBoost <= -40) return true
    if (matchTier === "partial_match" && relevanceBoost < -15 && match < 82) return true
  }

  if (signals.psychologicalHorror && matchTier === "partial_match") {
    if (relevanceBoost >= -18) return false
    return match < 76
  }

  if (signals.memorableDiscovery || signals.cozyShortSession) {
    if (candidate && isDiscoveryShovelwareTitle(candidate.name)) return true
    if (candidate && isDiscoveryTitleKeywordSpam(candidate)) return true
    if (relevanceBoost <= -45) return true
    if (matchTier === "partial_match" && relevanceBoost < -20 && match < 78) return true
  }

  const mustHave = extractMustHaveConstraints(userPrompt, signals)
  if (mustHave.active && candidate && violatesMustHaveConstraints(candidate, mustHave)) {
    return true
  }
  if (
    mustHave.active &&
    requiresFantasyRaces(mustHave) &&
    candidate &&
    matchTier === "partial_match" &&
    !hasFantasyRaceEvidence(candidate)
  ) {
    return true
  }
  if (mustHave.active && relevanceBoost <= -50) return true
  if (
    mustHave.active &&
    matchTier === "partial_match" &&
    relevanceBoost < -25 &&
    match < 85
  ) {
    return true
  }
  if (
    mustHave.active &&
    isRawgFallbackFillerPick({ match, reason }) &&
    !isStrongFastPick({
      pick: { match, matchTier, reason },
      relevanceBoost,
      candidate,
      mustHaveConstraints: mustHave,
      userPrompt,
    })
  ) {
    return true
  }

  return false
}

export type ResultCountPolicy = "broad" | "balanced" | "quality_first"

/** Broad social/multiplayer prompts should still aim for fuller result sets. */
export function detectResultCountPolicy(
  userPrompt: string,
  signals: IntentSignals
): ResultCountPolicy {
  const n = normalizeIntentText(userPrompt)

  if (
    /\b(friends?|with friends|multiplayer|multi[\s-]?player|co[\s-]?op|online with|party games?|together|local coop|split screen|giocare con|in compagnia|multigiocatore)\b/.test(
      n
    )
  ) {
    return "broad"
  }

  if (
    signals.memorableDiscovery ||
    signals.psychologicalHorror ||
    isHighlySpecificPrompt(n)
  ) {
    return "quality_first"
  }

  return "balanced"
}

function isHighlySpecificPrompt(normalizedText: string): boolean {
  const n = normalizedText
  const words = n.split(/\s+/).filter(Boolean)
  if (words.length >= 20) return true

  const constraintHints =
    (n.match(
      /\b(and|with|or|plus|including|featuring|multiple|management|building|faction|races?|elves?|orcs?|dwarves?|village|strategy|simulation|crafting|survival|horror|narrative)\b/g
    ) ?? []).length

  if (words.length >= 14 && constraintHints >= 4) return true
  if (words.length >= 12 && constraintHints >= 5) return true

  return false
}

const TASTE_REFERENCE_PREFIX_RE =
  /\b(?:i\s+(?:loved|love|played|already\s+played|finished|enjoyed)|my\s+favorite\s+games?\s+(?:are|include)|games?\s+i\s+(?:liked|loved|enjoyed|played|finished))\s+/gi

const TASTE_LIST_GOAL_RE =
  /\.\s+(?:i\s+want|i\s+need|i'm\s+looking|im\s+looking|looking\s+for|give\s+me|find\s+me|recommend|something\s+like)\b/i

const TASTE_TITLE_NOISE = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "my",
  "some",
  "really",
  "very",
  "games",
  "game",
  "giochi",
  "gioco",
])

function expandSlashNumberGameTitles(segment: string): string[] {
  const trimmed = segment.trim()
  if (!trimmed) return []

  const spaced = trimmed.match(/^(.+?\S)\s+(\d+(?:\s*\/\s*\d+)+)$/)
  if (spaced) {
    const prefix = spaced[1]!.trim()
    const nums = spaced[2]!.split(/\s*\/\s*/).map((n) => n.trim()).filter(Boolean)
    if (prefix.length >= 2 && nums.length >= 2) {
      return nums.map((n) => `${prefix} ${n}`)
    }
  }

  const tight = trimmed.match(/^(.+?\D)(\d+(?:\/\d+)+)$/)
  if (tight) {
    const prefix = tight[1]!.trim()
    const nums = tight[2]!.split("/").map((n) => n.trim()).filter(Boolean)
    if (prefix.length >= 2 && nums.length >= 2) {
      return nums.map((n) => `${prefix}${n}`)
    }
  }

  return [trimmed]
}

function splitTasteReferenceSegments(fragment: string): string[] {
  const parts: string[] = []
  for (const chunk of fragment.split(/,/)) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    if (/\band\b/i.test(trimmed)) {
      for (const sub of trimmed.split(/\band\b/i)) {
        const s = sub.trim()
        if (s) parts.push(s)
      }
    } else {
      parts.push(trimmed)
    }
  }
  return parts
}

function isPlausibleTasteReferenceTitle(title: string): boolean {
  const t = title.trim()
  if (t.length < 2 || t.length > 72) return false
  const lower = t.toLowerCase()
  if (TASTE_LIST_GOAL_RE.test(lower) || /\bi\s+want\b/i.test(lower)) return false
  const tokens = lower.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  if (tokens.every((tok) => TASTE_TITLE_NOISE.has(tok))) return false
  if (/^(story|narrative|cozy|horror|indie|jrpg|rpg)$/i.test(t)) return false
  return true
}

/** Titles the user explicitly asks to avoid (e.g. "not Hollow Knight or Undertale"). */
export function extractPromptExcludedTitles(prompt: string): string[] {
  const out = new Set<string>()
  const text = prompt.trim()
  if (!text) return []

  const clauses = [
    ...text.matchAll(
      /\b(?:not|without|excluding|exclude|no)\s+(.+?)(?:[.!?]|$)/gi
    ),
  ]
  for (const match of clauses) {
    let segment = (match[1] ?? "").trim()
    segment = segment
      .replace(
        /\b(the usual indie recommendations?|usual indie|usual recommendations?|usual picks?)\b/gi,
        ""
      )
      .trim()
    if (!segment) continue

    for (const part of segment.split(/\s*(?:,|\/|\bor\b|\band\b|\bnor\b)\s*/i)) {
      const cleaned = part
        .replace(/^["'«»]+|["'«»]+$/g, "")
        .replace(/\s+(please|thanks|thx)\s*$/i, "")
        .trim()
      if (cleaned.length < 3) continue
      if (/^(usual|indie|recommendations?|games?|picks?)$/i.test(cleaned)) continue
      out.add(cleaned)
    }
  }

  return [...out]
}

/**
 * Extract games the user cites as loved/played/finished taste anchors (exclude from picks).
 * Conservative: only parses clear taste-reference phrases, not generic title mentions.
 */
export function extractTasteReferenceTitlesFromPrompt(prompt: string): string[] {
  const out = new Set<string>()
  const text = prompt.trim()
  if (!text) return []

  for (const match of text.matchAll(TASTE_REFERENCE_PREFIX_RE)) {
    const startIdx = match.index! + match[0].length
    let rest = text.slice(startIdx)
    const goalIdx = rest.search(TASTE_LIST_GOAL_RE)
    if (goalIdx >= 0) {
      rest = rest.slice(0, goalIdx)
    } else {
      rest = (rest.split(/[.!?]/)[0] ?? rest).trim()
    }

    for (const segment of splitTasteReferenceSegments(rest)) {
      for (const expanded of expandSlashNumberGameTitles(segment)) {
        const cleaned = expanded
          .replace(/^["'«»]+|["'«»]+$/g, "")
          .replace(/\s+(please|thanks|thx)\s*$/i, "")
          .trim()
        if (isPlausibleTasteReferenceTitle(cleaned)) {
          out.add(cleaned)
        }
      }
    }
  }

  return [...out].slice(0, 16)
}

export type MustHaveConstraints = {
  active: boolean
  settings: string[]
  races: string[]
  mechanics: string[]
  genres: string[]
  exclusions: string[]
}

function isBroadSocialPrompt(normalizedText: string): boolean {
  return /\b(friends?|with friends|multiplayer|multi[\s-]?player|co[\s-]?op|online with|party games?|together|local coop|split screen|giocare con|in compagnia|multigiocatore)\b/.test(
    normalizedText
  )
}

const FANTASY_SETTING_RE =
  /\b(fantasy|medieval|high fantasy|dark fantasy|mythic|mythical|magic|middle-earth|warhammer|dungeons)\b/i
const SCI_FI_SETTING_RE =
  /\b(sci-fi|science fiction|sci fi|futuristic|space|space opera|cyberpunk|planetfall|galactic|alien|robots?|mechs?|post-apocalyptic sci)\b/i

/** Evidence the game is actually fantasy / has fantasy races (metadata or title). */
const FANTASY_RACE_EVIDENCE_RE =
  /\b(fantasy|elves?|elven|orcs?|dwarves?|dwarf|undead|dragon|dragons|warhammer|warcraft|spellforce|lord of the rings|middle-earth|mythical|mythology|magic|wizards?|necromancer|beastmen|skaven|fairy|faerie|goblins?|trolls?|lich|songs of conquest|battle for middle-earth|warlords battlecry|age of wonders|against the storm|northgard|dungeons)\b/i

const HISTORICAL_CIVILIZATION_RE =
  /\b(historical|history|real[\s-]?world|civilization|civilisation|world history|world war|ancient rome|ancient greece|ancient egypt|cold war|modern warfare|realistic warfare|grand strategy|nation building|empire building|colonial era|napoleonic|real-time history|historical strategy)\b/i

/** Strategy franchises that are historical/modern civ — not fantasy-race games. */
const HISTORICAL_STRATEGY_NAME_RE =
  /\b(rise of nations|civilization|age of empires|empire earth|company of heroes|europa universalis|crusader kings|hearts of iron|anno \d|command and conquer|red alert)\b/i

export function requiresFantasyRaces(constraints: MustHaveConstraints): boolean {
  return (
    constraints.active &&
    constraints.settings.includes("fantasy") &&
    constraints.races.length > 0
  )
}

export function hasFantasyRaceEvidence(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  const blob = candidateBlob(candidate)
  const name = candidate.name.toLowerCase()
  if (/\bage of wonders\b/i.test(name) && /\bplanetfall\b/i.test(name)) return false
  return FANTASY_RACE_EVIDENCE_RE.test(`${blob} ${name}`)
}

export function hasHistoricalCivilizationEvidence(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  const blob = candidateBlob(candidate)
  const name = candidate.name.toLowerCase()

  if (HISTORICAL_STRATEGY_NAME_RE.test(name)) {
    if (/\bwarhammer\b/i.test(name)) return false
    return true
  }
  if (/\btotal war\b/i.test(name) && !/\bwarhammer\b/i.test(name)) return true
  if (/\brise of nations\b/i.test(name)) return true
  if (HISTORICAL_CIVILIZATION_RE.test(`${blob} ${name}`)) {
    if (FANTASY_RACE_EVIDENCE_RE.test(`${blob} ${name}`)) return false
    return true
  }
  return false
}

/** AI reason/matchNote explicitly admits failing a must-have (e.g. "not strictly fantasy"). */
export function pickTextAdmitsMustHaveFailure(
  text: string,
  constraints: MustHaveConstraints
): boolean {
  if (!requiresFantasyRaces(constraints)) return false
  const t = text.toLowerCase().trim()
  if (!t) return false

  if (
    /\b(not strictly fantasy|not purely fantasy|isn't strictly fantasy|is not strictly fantasy|not a fantasy game|not fantasy-focused|without fantasy races|lacks fantasy|no fantasy races|not enough fantasy|more historical than fantasy|leans historical|primarily historical|historical rather than fantasy|real-world civ|real world civ)\b/.test(
      t
    )
  ) {
    return true
  }
  if (/\bhistorical and fantasy\b/.test(t) && /\bnot strictly\b/.test(t)) {
    return true
  }
  return false
}

export function shouldRejectFastPickForMustHave(params: {
  pick: {
    match: number
    matchTier: string
    reason: string
    matchNote: string
  }
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
  constraints: MustHaveConstraints
}): boolean {
  const { pick, candidate, constraints } = params
  if (!constraints.active) return false

  const combinedText = `${pick.reason} ${pick.matchNote}`.trim()
  if (pickTextAdmitsMustHaveFailure(combinedText, constraints)) return true

  if (violatesMustHaveConstraints(candidate, constraints)) return true

  if (requiresFantasyRaces(constraints)) {
    if (pick.matchTier === "partial_match" && !hasFantasyRaceEvidence(candidate)) {
      return true
    }
    if (!hasFantasyRaceEvidence(candidate) && pick.match < 88) {
      return true
    }
  }

  return false
}

/** Extract hard must-have constraints for highly specific prompts (not broad social). */
export function extractMustHaveConstraints(
  userPrompt: string,
  signals: IntentSignals
): MustHaveConstraints {
  const inactive: MustHaveConstraints = {
    active: false,
    settings: [],
    races: [],
    mechanics: [],
    genres: [],
    exclusions: [],
  }

  const n = normalizeIntentText(userPrompt)
  if (isBroadSocialPrompt(n)) return inactive

  if (signals.steamDeck) {
    const split = splitSteamDeckIntent(userPrompt)
    if (split?.isPlatformOnly) return inactive
  }

  const settings: string[] = []
  const races: string[] = []
  const mechanics: string[] = []
  const genres: string[] = []
  const exclusions: string[] = []

  if (/\bj\.?\s*r\.?\s*p\.?\s*g\.?\s*s?\b|\bjrpgs?\b/i.test(n)) genres.push("jrpg")
  if (/\bcrpgs?\b/i.test(n)) genres.push("crpg")
  if (/\baction\s+rpgs?\b/i.test(n)) genres.push("action-rpg")
  if (/\btactical\s+rpgs?\b/i.test(n)) genres.push("tactical-rpg")
  if (
    /\b(?:^|\s)rpgs?\b|\brole[\s-]?playing(?:\s+games?)?\b|\bgdr\b|\bgiochi?\s+di\s+ruolo\b/i.test(
      n
    ) &&
    !genres.includes("jrpg")
  ) {
    genres.push("rpg")
  }
  if (/\b(?:fps|first[\s-]?person\s+shooter)\b|\bshooters?\b/i.test(n)) genres.push("fps")

  if (/\b(fantasy|medieval|high fantasy|dark fantasy)\b/.test(n)) settings.push("fantasy")
  if (/\b(sci-fi|science fiction|futuristic|space opera)\b/.test(n)) settings.push("sci-fi")
  if (/\b(cyberpunk)\b/.test(n)) settings.push("cyberpunk")
  if (/\b(western|wild west)\b/.test(n)) settings.push("western")

  if (/\b(elves?|elven|elfi)\b/.test(n)) races.push("elves")
  if (/\b(orcs?|orchi)\b/.test(n)) races.push("orcs")
  if (/\b(dwarves?|dwarfs?|nani)\b/.test(n)) races.push("dwarves")
  if (/\b(undead|zombies?)\b/.test(n)) races.push("undead")
  if (
    /\b(multiple races?|several races?|many races?|diverse races?|different races?)\b/.test(
      n
    )
  ) {
    races.push("fantasy-races")
  }

  if (
    /\b(village building|town building|settlement building|base building|city building|colony building|village manag)\b/.test(
      n
    )
  ) {
    mechanics.push("base-building")
  }
  if (/\b(faction management|faction manag|manage factions?|factions? manag)\b/.test(n)) {
    mechanics.push("faction-management")
  }
  if (/\bturn[\s-]?based(?:\s+(?:rpg|jrpg|combat|battles?))?\b|\bturn[\s-]?based\b/i.test(n)) {
    mechanics.push("turn-based")
  }
  if (/\b(real[\s-]?time strategy|\brts\b)\b/.test(n)) mechanics.push("rts")
  if (/\b(strateg(y|ico|ia)|4x)\b/.test(n)) mechanics.push("strategy")
  if (/\b(party companions?|companion party|persistent party)\b/.test(n)) {
    mechanics.push("party-companions")
  }
  if (/\b(co[\s-]?op|cooperative)\b/i.test(n) && !/\b(not|no|less|without)\s+co[\s-]?op\b/i.test(n)) {
    mechanics.push("co-op")
  }
  if (
    /\b(multiplayer|multi[\s-]?player|online\s+co[\s-]?op)\b/i.test(n) &&
    !/\b(not|no|less|without)\s+multi/i.test(n)
  ) {
    mechanics.push("multiplayer")
  }
  if (
    /\b(single[\s-]?player|solo)\b/i.test(n) &&
    !/\b(not|no)\s+single[\s-]?player\b/i.test(n)
  ) {
    mechanics.push("singleplayer")
  }

  if (/\b(not multiplayer|no multiplayer|single[\s-]?player only|senza multiplayer)\b/.test(n)) {
    exclusions.push("multiplayer")
  }
  if (/\b(not horror|no horror|senza horror)\b/.test(n)) exclusions.push("horror")
  if (/\b(not farming|no farming|no farm)\b/.test(n)) exclusions.push("farming")

  const hasGenreCombatCombo =
    genres.length >= 1 &&
    (mechanics.some((m) =>
      ["turn-based", "co-op", "multiplayer", "singleplayer", "rts", "strategy"].includes(m)
    ) ||
      genres.some((g) => ["jrpg", "tactical-rpg", "action-rpg", "crpg", "fps"].includes(g)))

  const active =
    isHighlySpecificPrompt(n) ||
    (settings.length >= 1 && races.length >= 1) ||
    (settings.includes("fantasy") && mechanics.length >= 2) ||
    races.length >= 2 ||
    mechanics.length >= 4 ||
    hasGenreCombatCombo ||
    (genres.includes("jrpg") && mechanics.includes("turn-based"))

  if (!active) return inactive

  return { active: true, settings, races, mechanics, genres, exclusions }
}

const RPG_GENRE_METADATA_RE =
  /\b(rpg|role-playing|role playing|jrpg|j-rpg|tactical rpg|strategy rpg|action rpg|crpg|turn-based strategy|turn based strategy|massively multiplayer)\b/i

const NARRATIVE_ONLY_MISMATCH_NAME_RE =
  /\b(life is strange|firewatch|what remains of edith finch|the forgotten city|gone home|her story|night in the woods|telling me|a normal lost phone|simulacra)\b/i

/** Hard genre/combat requirement: JRPG, turn-based RPG, or tactical RPG. */
export function requiresRpgGenreCombat(constraints: MustHaveConstraints): boolean {
  if (!constraints.active) return false
  if (constraints.genres.includes("jrpg") || constraints.genres.includes("tactical-rpg")) {
    return true
  }
  if (constraints.genres.includes("rpg") && constraints.mechanics.includes("turn-based")) {
    return true
  }
  if (constraints.genres.includes("crpg") && constraints.mechanics.includes("turn-based")) {
    return true
  }
  return false
}

export function hasRpgGenreMetadata(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  return RPG_GENRE_METADATA_RE.test(candidateBlob(candidate))
}

/** Story-rich adventure/walking sim with no RPG metadata — clear mismatch for JRPG prompts. */
export function isNarrativeAdventureMismatch(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  if (hasRpgGenreMetadata(candidate)) return false

  const name = candidate.name.toLowerCase()
  const genreText = (candidate.genres ?? []).map((g) => g.name).join(" ").toLowerCase()
  const blob = candidateBlob(candidate)

  if (NARRATIVE_ONLY_MISMATCH_NAME_RE.test(name)) return true

  const walkingSim = /\b(walking simulator|interactive fiction|visual novel)\b/i.test(blob)
  const adventureOnly =
    /\badventure\b/i.test(genreText) &&
    !/\b(rpg|role-playing|strategy|tactical|jrpg)\b/i.test(genreText)

  return walkingSim || (adventureOnly && /\b(narrative|story|mystery|choices)\b/i.test(blob))
}

const TURN_BASED_COMBAT_METADATA_RE =
  /\b(turn-based|turn based|command-based|party-based turn|tactical turn|grid-based|strategy rpg)\b/i

const ACTION_ORIENTED_JRPG_RE =
  /\b(action rpg|real-time combat|real time combat|hack and slash|action combat|musou|arena combat)\b/i

const ACTION_JRPG_FRANCHISE_RE =
  /\b(xenoblade|tales of|star ocean|kingdom hearts|\bys\b|\bnier\b|final fantasy xv|ffxv)\b/i

/** User explicitly asked for turn-based JRPG / turn-based RPG combat. */
export function requiresTurnBasedRpg(constraints: MustHaveConstraints): boolean {
  if (!constraints.active || !constraints.mechanics.includes("turn-based")) return false
  return constraints.genres.some((g) =>
    ["jrpg", "rpg", "crpg", "tactical-rpg"].includes(g)
  )
}

export function hasTurnBasedCombatMetadata(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  return TURN_BASED_COMBAT_METADATA_RE.test(candidateBlob(candidate))
}

/** Action-oriented JRPG with no turn-based metadata — weak match when turn-based is required. */
export function isActionJrpgMismatch(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  if (hasTurnBasedCombatMetadata(candidate)) return false
  if (!hasRpgGenreMetadata(candidate)) return false

  const blob = candidateBlob(candidate)
  const name = candidate.name.toLowerCase()

  if (ACTION_ORIENTED_JRPG_RE.test(blob)) return true
  if (ACTION_JRPG_FRANCHISE_RE.test(name) || ACTION_JRPG_FRANCHISE_RE.test(blob)) return true
  if (/\baction rpg\b/i.test(blob) && !TURN_BASED_COMBAT_METADATA_RE.test(blob)) return true

  return false
}

/** Franchise-informed RAWG search seeds for fantasy race strategy (retrieval only). */
export const FANTASY_RACE_STRATEGY_FRANCHISE_QUERIES = [
  "warcraft III strategy",
  "total war warhammer fantasy",
  "spellforce fantasy rts",
  "age of wonders 4 fantasy",
  "songs of conquest fantasy strategy",
  "battle for middle earth strategy",
  "warlords battlecry fantasy rts",
  "fantasy RTS base building",
  "fantasy faction strategy game",
] as const

/** True when fallback should use flagship fantasy RTS franchise queries (not broad/generic strategy). */
export function isFantasyRaceStrategyMustHave(constraints: MustHaveConstraints): boolean {
  if (!constraints.active) return false
  if (!constraints.settings.includes("fantasy")) return false

  const hasFantasyRaces =
    constraints.races.includes("elves") ||
    constraints.races.includes("orcs") ||
    constraints.races.includes("dwarves") ||
    constraints.races.includes("undead") ||
    constraints.races.includes("fantasy-races")
  if (!hasFantasyRaces) return false

  return (
    constraints.mechanics.includes("strategy") ||
    constraints.mechanics.includes("rts") ||
    constraints.mechanics.includes("faction-management") ||
    constraints.mechanics.includes("base-building")
  )
}

function augmentMustHaveDiscoveryQueries(
  queries: string[],
  constraints: MustHaveConstraints
): string[] {
  if (!constraints.active) return queries

  const franchiseFirst: string[] = isFantasyRaceStrategyMustHave(constraints)
    ? [...FANTASY_RACE_STRATEGY_FRANCHISE_QUERIES]
    : []

  const extras: string[] = []

  if (constraints.settings.includes("fantasy") && constraints.mechanics.includes("strategy")) {
    extras.push(
      "fantasy RTS orcs elves",
      "fantasy strategy game races",
      "orcs elves strategy game",
      "fantasy faction strategy",
      "base building fantasy strategy"
    )
  }
  if (
    constraints.races.some((r) => r === "elves" || r === "orcs" || r === "fantasy-races")
  ) {
    extras.push("fantasy races strategy game", "elves orcs fantasy game")
  }
  if (constraints.mechanics.includes("faction-management")) {
    extras.push("fantasy faction management strategy")
  }
  if (constraints.mechanics.includes("base-building") && constraints.settings.includes("fantasy")) {
    extras.push("fantasy village building strategy")
  }

  return mergeUniqueStrings([...franchiseFirst, ...extras, ...queries], 16)
}

/** Strong boost/penalty for must-have semantic fit (specific prompts only). */
export function scoreMustHaveConstraintBoost(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">,
  constraints: MustHaveConstraints
): number {
  if (!constraints.active) return 0

  const blob = candidateBlob(candidate)
  const name = candidate.name.toLowerCase()
  let delta = 0

  if (constraints.settings.includes("fantasy")) {
    const fantasyHit = hasFantasyRaceEvidence(candidate)
    const scifiHit =
      SCI_FI_SETTING_RE.test(blob) ||
      SCI_FI_SETTING_RE.test(name) ||
      /\bplanetfall\b/i.test(name)

    if (scifiHit && !fantasyHit) delta -= 62
    else if (fantasyHit) delta += 22
    else if (requiresFantasyRaces(constraints)) delta -= 35
  }

  if (constraints.settings.includes("sci-fi")) {
    const scifiHit = SCI_FI_SETTING_RE.test(blob)
    const fantasyHit = FANTASY_SETTING_RE.test(blob)
    if (fantasyHit && !scifiHit) delta -= 28
    else if (scifiHit) delta += 14
  }

  let raceHits = 0
  if (constraints.races.includes("elves") && /\b(elves?|elven|elf)\b/i.test(blob)) raceHits += 1
  if (constraints.races.includes("orcs") && /\borcs?\b/i.test(blob)) raceHits += 1
  if (constraints.races.includes("dwarves") && /\b(dwarves?|dwarfs?|dwarf)\b/i.test(blob)) {
    raceHits += 1
  }
  if (constraints.races.includes("undead") && /\b(undead|zombie|necromancer)\b/i.test(blob)) {
    raceHits += 1
  }
  if (constraints.races.includes("fantasy-races") && FANTASY_SETTING_RE.test(blob)) {
    raceHits += 1
  }

  if (constraints.races.length > 0) {
    if (raceHits >= 2) delta += 24
    else if (raceHits === 1) delta += 12
    else if (constraints.settings.includes("fantasy")) delta -= 40
  }

  const fantasyRaceRequired = requiresFantasyRaces(constraints)
  const fantasyRaceHit = hasFantasyRaceEvidence(candidate)

  if (fantasyRaceRequired && hasHistoricalCivilizationEvidence(candidate) && !fantasyRaceHit) {
    delta -= 70
  }

  for (const mech of constraints.mechanics) {
    if (fantasyRaceRequired && !fantasyRaceHit && (mech === "strategy" || mech === "faction-management")) {
      continue
    }
    switch (mech) {
      case "strategy":
        if (/\b(strategy|rts|real-time strategy|turn-based strategy|4x|tactical)\b/i.test(blob)) {
          delta += 9
        }
        break
      case "base-building":
        if (/\b(building|builder|base|settlement|village|city builder|colony)\b/i.test(blob)) {
          delta += 11
        }
        break
      case "faction-management":
        if (/\b(faction|factions|diplomacy|empire|clans?|politics)\b/i.test(blob)) {
          delta += 11
        }
        break
      case "turn-based":
        if (/\b(turn-based|turn based)\b/i.test(blob)) delta += 8
        if (requiresTurnBasedRpg(constraints) && hasTurnBasedCombatMetadata(candidate)) {
          delta += 16
        }
        if (requiresTurnBasedRpg(constraints) && isActionJrpgMismatch(candidate)) {
          delta -= 54
        }
        break
      case "rts":
        if (/\b(rts|real-time strategy)\b/i.test(blob)) delta += 8
        break
      case "party-companions":
        if (/\b(companion|companions|party|character)\b/i.test(blob)) delta += 10
        break
      case "co-op":
        if (/\b(co-op|cooperative|online co-op)\b/i.test(blob)) delta += 10
        else delta -= 16
        break
      case "multiplayer":
        if (/\b(multiplayer|online|co-op)\b/i.test(blob)) delta += 10
        else delta -= 14
        break
      case "singleplayer":
        if (/\b(single player|single-player|solo)\b/i.test(blob)) delta += 6
        break
    }
  }

  for (const genre of constraints.genres) {
    switch (genre) {
      case "jrpg":
      case "rpg":
      case "crpg":
      case "action-rpg":
      case "tactical-rpg":
        if (hasRpgGenreMetadata(candidate)) delta += 14
        else if (isNarrativeAdventureMismatch(candidate)) delta -= 50
        else delta -= 24
        break
      case "fps":
        if (/\b(shooter|fps|first-person)\b/i.test(blob)) delta += 12
        else delta -= 18
        break
    }
  }

  for (const ex of constraints.exclusions) {
    if (ex === "multiplayer" && /\b(multiplayer|co-op|online)\b/i.test(blob)) delta -= 32
    if (ex === "horror" && /\bhorror\b/i.test(blob)) delta -= 28
    if (ex === "farming" && /\b(farming|farm sim|agriculture)\b/i.test(blob)) delta -= 24
  }

  return delta
}

/** Hard reject when a candidate clearly contradicts required setting/race constraints. */
export function violatesMustHaveConstraints(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">,
  constraints: MustHaveConstraints
): boolean {
  if (!constraints.active) return false

  const blob = candidateBlob(candidate)
  const name = candidate.name.toLowerCase()
  const fantasyRaceHit = hasFantasyRaceEvidence(candidate)

  if (requiresFantasyRaces(constraints)) {
    const scifiHit =
      SCI_FI_SETTING_RE.test(blob) ||
      SCI_FI_SETTING_RE.test(name) ||
      /\bplanetfall\b/i.test(name)
    if (scifiHit && !fantasyRaceHit) return true

    if (hasHistoricalCivilizationEvidence(candidate) && !fantasyRaceHit) return true

    if (
      constraints.mechanics.includes("strategy") &&
      !fantasyRaceHit &&
      /\b(strategy|rts|4x|grand strategy|real-time strategy)\b/i.test(blob)
    ) {
      return true
    }
  }

  if (constraints.settings.includes("fantasy") && constraints.races.length > 0) {
    const scifiHit =
      SCI_FI_SETTING_RE.test(blob) ||
      SCI_FI_SETTING_RE.test(name) ||
      /\bplanetfall\b/i.test(name)
    if (scifiHit && !fantasyRaceHit) return true
  }

  if (requiresRpgGenreCombat(constraints) && isNarrativeAdventureMismatch(candidate)) {
    return true
  }

  return false
}

/** RAWG fallback filler (empty reason, low match) is never a strong pick. */
export function isRawgFallbackFillerPick(pick: {
  match: number
  reason: string
}): boolean {
  return !pick.reason.trim() && pick.match <= 65
}

/** Minimum relevance for RAWG fallback rows to count as strong when full candidate metadata is present. */
export const RAWG_FALLBACK_STRONG_RELEVANCE_MIN = -15

/** Stricter floor for RAWG fallback on highly specific must-have prompts. */
export const MUST_HAVE_RAWG_FALLBACK_RELEVANCE_MIN = 10

/** Confidence gate for quality-first Fast Mode trimming. */
export function isStrongFastPick(params: {
  pick: {
    match: number
    matchTier: string
    reason: string
  }
  relevanceBoost: number
  candidate?: Pick<RawgCandidate, "name" | "genres" | "tags">
  mustHaveConstraints?: MustHaveConstraints
  userPrompt?: string
}): boolean {
  const { pick, relevanceBoost, candidate, mustHaveConstraints, userPrompt = "" } = params

  if (isRawgFallbackFillerPick(pick)) {
    if (!candidate) return false
    if (mustHaveConstraints?.active) {
      if (violatesMustHaveConstraints(candidate, mustHaveConstraints)) return false
      if (shouldRejectNonCanonicalSideEdition(candidate.name, userPrompt)) return false
      if (isWeakFantasyStrategyFillerTitle(candidate.name)) return false
      if (
        requiresFantasyRaces(mustHaveConstraints) &&
        !hasFantasyRaceEvidence(candidate)
      ) {
        return false
      }
      if (isFantasyRaceStrategyMustHave(mustHaveConstraints)) {
        return relevanceBoost >= MUST_HAVE_RAWG_FALLBACK_RELEVANCE_MIN
      }
      return relevanceBoost >= 0
    }
    return relevanceBoost >= RAWG_FALLBACK_STRONG_RELEVANCE_MIN
  }

  if (pick.matchTier === "partial_match") {
    return pick.match >= 80 && relevanceBoost >= -12
  }
  if (pick.matchTier === "good_alternative") {
    return pick.match >= 66 && relevanceBoost >= -22
  }
  return pick.match >= 70 && relevanceBoost >= -32
}

export function reorderFastPicksByRelevance<
  T extends {
    id: number
    match: number
    reason?: string
    matchTier: "best_match" | "good_alternative" | "partial_match"
  },
>(params: {
  picks: T[]
  getCandidate: (id: number) => RawgCandidate | undefined
  signals: IntentSignals
  userPrompt: string
  normalizedIntent: string
  coreNeeds: string[]
  /** When quality_first, never restore dropped weak picks to hit a count target. */
  resultCountPolicy?: ResultCountPolicy
}): T[] {
  const {
    picks,
    getCandidate,
    signals,
    userPrompt,
    normalizedIntent,
    coreNeeds,
    resultCountPolicy = "balanced",
  } = params

  const scored = picks.map((pick) => {
    const candidate = getCandidate(pick.id)
    const relevanceBoost = candidate
      ? scoreCandidateRelevanceBoost({
          signals,
          userPrompt,
          normalizedIntent,
          coreNeeds,
          candidate,
          matchTier: pick.matchTier,
        })
      : -999
    const tierBoost =
      pick.matchTier === "best_match" ? 6 : pick.matchTier === "good_alternative" ? 2 : -4
    return {
      pick,
      relevanceBoost,
      sortScore: pick.match + relevanceBoost + tierBoost,
    }
  })

  scored.sort((a, b) => b.sortScore - a.sortScore)

  const kept: T[] = []
  for (const row of scored) {
    const candidate = getCandidate(row.pick.id)
    if (
      shouldDropWeakFastPick({
        signals,
        userPrompt,
        match: row.pick.match,
        matchTier: row.pick.matchTier,
        reason: row.pick.reason ?? "",
        relevanceBoost: row.relevanceBoost,
        candidate,
      })
    ) {
      continue
    }
    kept.push(row.pick)
  }

  if (resultCountPolicy === "quality_first") {
    return kept
  }

  if (resultCountPolicy === "broad" && kept.length < 3) {
    return scored.map((s) => s.pick)
  }

  return kept
}

/** Keep only confidence-strong picks for quality-first prompts; preserve order. */
export function trimFastPicksToConfidence<
  T extends {
    id: number
    match: number
    matchTier: "best_match" | "good_alternative" | "partial_match"
    reason: string
  },
>(params: {
  picks: T[]
  getCandidate: (id: number) => RawgCandidate | undefined
  signals: IntentSignals
  userPrompt: string
  normalizedIntent: string
  coreNeeds: string[]
  mustHaveConstraints?: MustHaveConstraints
}): T[] {
  const {
    picks,
    getCandidate,
    signals,
    userPrompt,
    normalizedIntent,
    coreNeeds,
    mustHaveConstraints,
  } = params

  const strong: T[] = []
  for (const pick of picks) {
    const candidate = getCandidate(pick.id)
    const relevanceBoost = candidate
      ? scoreCandidateRelevanceBoost({
          signals,
          userPrompt,
          normalizedIntent,
          coreNeeds,
          candidate,
          matchTier: pick.matchTier,
        })
      : -999
    if (
      isStrongFastPick({
        pick,
        relevanceBoost,
        candidate,
        mustHaveConstraints,
        userPrompt,
      })
    ) {
      strong.push(pick)
    }
  }

  if (mustHaveConstraints?.active) {
    return strong
  }

  return strong.length > 0 ? strong : picks.filter((p) => !isRawgFallbackFillerPick(p))
}

/** Gate RAWG fallback rows before they are added to Fast Mode picks. */
export function shouldAdmitRawgFallbackCandidate(params: {
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
  relevanceBoost: number
  constraints: MustHaveConstraints
  userPrompt: string
}): boolean {
  const { candidate, relevanceBoost, constraints, userPrompt } = params
  if (!constraints.active) return true
  if (violatesMustHaveConstraints(candidate, constraints)) return false
  if (shouldRejectNonCanonicalSideEdition(candidate.name, userPrompt)) return false
  if (isWeakFantasyStrategyFillerTitle(candidate.name)) return false
  if (requiresFantasyRaces(constraints) && !hasFantasyRaceEvidence(candidate)) return false
  if (isFantasyRaceStrategyMustHave(constraints)) {
    return relevanceBoost >= MUST_HAVE_RAWG_FALLBACK_RELEVANCE_MIN
  }
  return relevanceBoost >= 0
}
