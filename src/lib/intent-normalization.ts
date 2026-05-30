import type { RawgCandidate } from "@/lib/rawg-discovery"

export type IntentSignals = {
  steamDeck: boolean
  rpgCompanionParty: boolean
  psychologicalHorror: boolean
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

/** Text used for RAWG keyword retrieval — excludes Steam Deck tokens when platform intent. */
export function promptForRetrievalKeywords(
  userPrompt: string,
  signals: IntentSignals
): string {
  if (!signals.steamDeck) return userPrompt
  const split = splitSteamDeckIntent(userPrompt)
  return split?.contentPrompt ?? ""
}

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

  return { steamDeck, rpgCompanionParty, psychologicalHorror }
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

/** Strip unsafe RAWG queries; augment only when the pool is thin. */
export function sanitizeDiscoveryQueries(
  queries: string[],
  signals: IntentSignals,
  userPrompt = ""
): string[] {
  if (!signals.steamDeck) return queries.filter(Boolean)

  const filtered = queries
    .map((q) => q.trim())
    .filter(Boolean)
    .filter((q) => !isUnsafeSteamDeckDiscoveryQuery(q))

  if (filtered.length >= 2) {
    return mergeUniqueStrings(filtered, 8)
  }

  const split = splitSteamDeckIntent(userPrompt)

  if (split && !split.isPlatformOnly && split.contentPrompt.length >= 3) {
    return mergeUniqueStrings(
      [
        ...filtered,
        split.contentPrompt,
        `${split.contentPrompt} indie game`,
        `${split.contentPrompt} pc game`,
      ],
      8
    )
  }

  return mergeUniqueStrings([...filtered, ...PLATFORM_ONLY_DISCOVERY_POOLS], 8)
}

export function sanitizeCoreKeywordsForSignals(
  keywords: string[],
  signals: IntentSignals
): string[] {
  if (!signals.steamDeck) return keywords
  return keywords.filter((k) => {
    const n = k.toLowerCase().trim()
    if (n === "steam" || n === "deck") return false
    if (n === "steam deck") return false
    return true
  })
}

export function shouldRejectCandidateForSignals(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags" | "ratings_count">,
  signals: IntentSignals
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

  if (hints.length === 0) return base
  return `${base}\n${hints.join("\n")}`
}

export function buildDisambiguationRules(signals: IntentSignals): string[] {
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

  return {
    normalizedIntent,
    coreNeeds: mergeUniqueStrings(coreNeeds, 12),
    avoid: mergeUniqueStrings(avoid, 12),
    fallbackDiscoveryQueries: mergeUniqueStrings(fallbackDiscoveryQueries, 14),
  }
}

/** Prevent lone \"steam\" / \"deck\" tokens from driving title-keyword retrieval. */
export function sanitizeIntentKeywordSet(
  keywords: Set<string>,
  signals: IntentSignals
): Set<string> {
  if (!signals.steamDeck) return keywords
  const out = new Set(keywords)
  out.delete("deck")
  out.delete("steam")
  out.delete("steamdeck")
  out.add("handheld")
  out.add("portable")
  out.add("controller-friendly")
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

  const intentBlob = `${params.userPrompt} ${normalizedIntent}`.toLowerCase()
  if (
    signals.steamDeck &&
    /\bdeck\b/i.test(intentBlob) &&
    DECKBUILDER_RE.test(blob)
  ) {
    delta -= 10
  }

  return delta
}

export function shouldDropWeakFastPick(params: {
  signals: IntentSignals
  match: number
  matchTier: string
  relevanceBoost: number
  candidate?: Pick<RawgCandidate, "name" | "genres" | "tags" | "ratings_count">
}): boolean {
  const { signals, match, matchTier, relevanceBoost, candidate } = params

  if (candidate && shouldRejectCandidateForSignals(candidate, signals)) {
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

  return false
}

export function reorderFastPicksByRelevance<
  T extends {
    id: number
    match: number
    matchTier: "best_match" | "good_alternative" | "partial_match"
  },
>(params: {
  picks: T[]
  getCandidate: (id: number) => RawgCandidate | undefined
  signals: IntentSignals
  userPrompt: string
  normalizedIntent: string
  coreNeeds: string[]
}): T[] {
  const { picks, getCandidate, signals, userPrompt, normalizedIntent, coreNeeds } =
    params

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
        match: row.pick.match,
        matchTier: row.pick.matchTier,
        relevanceBoost: row.relevanceBoost,
        candidate,
      })
    ) {
      continue
    }
    kept.push(row.pick)
  }

  return kept.length >= 3 ? kept : scored.map((s) => s.pick)
}
