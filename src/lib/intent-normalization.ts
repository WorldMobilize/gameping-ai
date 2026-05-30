import "server-only"

import type { RawgCandidate } from "@/lib/rawg-discovery"

export type IntentSignals = {
  steamDeck: boolean
  rpgCompanionParty: boolean
  psychologicalHorror: boolean
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

/** Detect common misinterpretation patterns from free-text prompts. */
export function detectIntentSignals(text: string): IntentSignals {
  const n = normalizeIntentText(text)

  const steamDeck =
    /\bsteam\s*deck\b/.test(n) ||
    /\bsteamdeck\b/.test(n) ||
    /\bgames?\s+for\s+steam\s*deck\b/.test(n) ||
    /\bbest\s+steam\s*deck\b/.test(n)

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

/** Clarify ambiguous phrasing for the discovery model (does not replace the user prompt in caches). */
export function enrichPromptForDiscovery(
  userPrompt: string,
  signals: IntentSignals
): string {
  const base = userPrompt.trim()
  if (!base) return base

  const hints: string[] = []
  if (signals.steamDeck) {
    hints.push(
      "Intent note: Steam Deck = Valve handheld gaming PC platform. Not card games or deckbuilders."
    )
  }
  if (signals.rpgCompanionParty) {
    hints.push(
      "Intent note: party in RPG context = persistent companion/party systems in single-player CRPGs/tactical RPGs, not multiplayer party modes."
    )
  }
  if (signals.psychologicalHorror) {
    hints.push(
      "Intent note: psychological horror — genre-authentic, well-regarded horror titles; avoid obscure literal keyword matches."
    )
  }

  if (hints.length === 0) return base
  return `${base}\n${hints.join("\n")}`
}

export function buildDisambiguationRules(signals: IntentSignals): string[] {
  const rules: string[] = []
  if (signals.steamDeck) {
    rules.push(
      "Steam Deck / steamdeck = Valve handheld PC platform. Recommend portable/handheld-friendly PC games — NOT card games, deckbuilders, or playing-card interpretations of \"deck\"."
    )
  }
  if (signals.rpgCompanionParty) {
    rules.push(
      "RPG + party (e.g. \"party persistente\") = companion/persistent party CRPGs or tactical RPGs — NOT multiplayer party modes, party minigames, or generic co-op party games."
    )
  }
  if (signals.psychologicalHorror) {
    rules.push(
      "Psychological horror: prioritize established horror-genre titles with atmospheric dread — avoid obscure games that only match horror keywords in the title."
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

/** Merge signal-specific needs/avoid/queries into AI discovery output. */
export function mergeIntentAugmentation(
  intent: IntentAugmentFields,
  signals: IntentSignals
): IntentAugmentFields {
  const coreNeeds = [...intent.coreNeeds]
  const avoid = [...intent.avoid]
  const fallbackDiscoveryQueries = [...intent.fallbackDiscoveryQueries]

  if (signals.steamDeck) {
    coreNeeds.push(
      "Steam Deck / handheld PC",
      "portable-friendly controls",
      "verified or well-suited for Steam Deck"
    )
    avoid.push(
      "card games",
      "deckbuilders",
      "deck building",
      "playing cards",
      "TCG"
    )
    fallbackDiscoveryQueries.push(
      "steam deck verified",
      "handheld pc indie",
      "portable action rpg steam deck"
    )
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
      "narrative horror"
    )
    avoid.push("obscure keyword-only horror titles", "low-quality horror spam")
    fallbackDiscoveryQueries.push(
      "psychological horror",
      "narrative survival horror"
    )
  }

  return {
    normalizedIntent: intent.normalizedIntent,
    coreNeeds: mergeUniqueStrings(coreNeeds, 12),
    avoid: mergeUniqueStrings(avoid, 10),
    fallbackDiscoveryQueries: mergeUniqueStrings(fallbackDiscoveryQueries, 14),
  }
}

/** Prevent lone \"deck\" token from matching card/deckbuilder games when Steam Deck is meant. */
export function sanitizeIntentKeywordSet(
  keywords: Set<string>,
  signals: IntentSignals
): Set<string> {
  if (!signals.steamDeck) return keywords
  const out = new Set(keywords)
  out.delete("deck")
  out.add("steam deck")
  out.add("handheld")
  out.add("portable")
  return out
}

export function buildSubjectContextForIntent(intentBlob: string): Record<string, string[]> {
  const ctx: Record<string, string[]> = {}
  if (/\bsteam\s*deck\b|\bsteamdeck\b/i.test(intentBlob)) {
    ctx.deck = [
      "steam deck",
      "handheld",
      "portable",
      "verified",
      "linux",
      "controller",
    ]
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
    if (DECKBUILDER_RE.test(blob)) delta -= 42
    if (/\bsteam deck\b/i.test(blob) || /\bverified\b/i.test(blob)) delta += 14
    if (/\b(handheld|portable)\b/i.test(blob)) delta += 8
    if (/\bdeck\b/i.test(candidate.name) && !/\bsteam deck\b/i.test(blob)) delta -= 18
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
    const genreHasHorror = /\bhorror\b/i.test(genres)
    const titleKeywordHit = HORROR_TITLE_KEYWORD_RE.test(candidate.name)
    const psychTag =
      /\b(psychological|psych|survival horror|atmospheric|narrative)\b/i.test(genres)

    if (titleKeywordHit && !genreHasHorror) delta -= 38
    if (genreHasHorror && psychTag) delta += 16
    else if (genreHasHorror) delta += 8

    const ratings = typeof candidate.ratings_count === "number" ? candidate.ratings_count : 0
    if (titleKeywordHit && !genreHasHorror && ratings < 800) delta -= 12
    if (matchTier === "partial_match" && !genreHasHorror && titleKeywordHit) delta -= 20
  }

  // Generic: intent mentions deck without steam deck already handled via signals
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
}): boolean {
  const { signals, match, matchTier, relevanceBoost } = params
  if (!signals.psychologicalHorror) return false
  if (matchTier !== "partial_match") return false
  if (relevanceBoost >= -18) return false
  return match < 76
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
      : 0
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
    if (
      shouldDropWeakFastPick({
        signals,
        match: row.pick.match,
        matchTier: row.pick.matchTier,
        relevanceBoost: row.relevanceBoost,
      })
    ) {
      continue
    }
    kept.push(row.pick)
  }

  return kept.length >= 3 ? kept : scored.map((s) => s.pick)
}
