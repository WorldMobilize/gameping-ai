import { expandReferenceTitleExcludes } from "@/lib/reference-title-aliases"

export type RecommendRefineContext = {
  originalPrompt: string
  previousResultTitles: string[]
  refineMessage: string
}

export const REFINE_MESSAGE_MAX = 200

export type RefineIntentKind = "minor_edit" | "direction_correction" | "stricter_constraint"

export type RefineContextParseResult =
  | { ok: true; context: RecommendRefineContext }
  | { ok: false; error: "refine_message_too_long" | "refine_context_invalid" }

export function bodyHasRefineContext(body: unknown): boolean {
  if (!body || typeof body !== "object") return false
  const rc = (body as Record<string, unknown>).refineContext
  return rc != null && typeof rc === "object"
}

function mergeUniqueStrings(items: string[], max: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const t = raw.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

function splitReferenceTitleList(fragment: string): string[] {
  const parts: string[] = []
  for (const chunk of fragment.split(/,/)) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    if (/\band\b/i.test(trimmed)) {
      for (const sub of trimmed.split(/\band\b/i)) {
        const s = sub.trim()
        if (s) parts.push(s)
      }
    } else if (trimmed.includes("/")) {
      for (const sub of trimmed.split(/\s*\/\s*/)) {
        const s = sub.trim()
        if (s) parts.push(s)
      }
    } else {
      parts.push(trimmed)
    }
  }
  return parts
}

function isPlausibleRefineTitle(title: string): boolean {
  const t = title.trim()
  if (t.length < 2 || t.length > 64) return false
  const lower = t.toLowerCase()
  if (/^(the|a|an|that|this|those|these|one|game|games|indie|aaa|more|less)$/i.test(lower)) {
    return false
  }
  if (/^(first|second|third|\d+(st|nd|rd|th)?)$/i.test(lower)) return false
  return true
}

export function classifyRefineIntent(refineMessage: string): RefineIntentKind {
  const r = refineMessage.toLowerCase().trim()
  if (!r) return "minor_edit"

  if (
    /\b(must be|only|has to be|needs to be|strictly|not hard|no horror|under\s+\$?\d|under\s+\d+\s*(usd|eur|\$|€)?)\b/i.test(
      r
    )
  ) {
    return "stricter_constraint"
  }

  if (
    /\b(more like|closer to|similar to|not that vibe|more\s+(?:aaa|open[\s-]?world|rpg|action|strategy|open world))\b/i.test(
      r
    ) ||
    /\bless\s+\w+(?:\s+\w+)?\s*,?\s*more like\b/i.test(r)
  ) {
    return "direction_correction"
  }

  if (/\b(remove|replace|without|no\s+\w|not\s+[a-z0-9])/i.test(r)) {
    return "minor_edit"
  }

  return "minor_edit"
}

function isOrdinalOrPriorPickReference(text: string): boolean {
  return /\b(?:the\s+)?(first|second|third|\d+(?:st|nd|rd|th)?)(?:\s+(?:game|pick|result|one))?\b/i.test(
    text
  )
}

/** Parse new taste anchors from refine phrasing (e.g. more like RDR2/Fallout NV). */
export function extractReferenceTitlesFromRefineMessage(refineMessage: string): string[] {
  const out = new Set<string>()
  const patterns = [
    /\b(?:more like|closer to|similar to)\s+(.+?)(?:[.!?]|$)/i,
    /\bless\s+[\w\s-]+,?\s*more like\s+(.+?)(?:[.!?]|$)/i,
  ]

  for (const re of patterns) {
    const m = refineMessage.match(re)
    if (!m?.[1]) continue
    if (isOrdinalOrPriorPickReference(m[1])) continue
    for (const part of splitReferenceTitleList(m[1])) {
      const cleaned = part.replace(/^["'«»]+|["'«»]+$/g, "").trim()
      if (isOrdinalOrPriorPickReference(cleaned)) continue
      if (isPlausibleRefineTitle(cleaned)) out.add(cleaned)
    }
  }

  return [...out].slice(0, 8)
}

/** Parse explicit removal targets (remove Celeste, no Celeste, not Celeste). */
export function extractRemovalTitles(refineMessage: string): string[] {
  const out = new Set<string>()
  const patterns = [
    /\b(?:remove|replace|without)\s+([^,.!?]+)/gi,
    /\bno\s+([A-Za-z0-9][^,.!?]{1,48})/gi,
    /\bnot\s+([A-Za-z0-9][^,.!?]{1,48})/gi,
  ]

  for (const re of patterns) {
    for (const m of refineMessage.matchAll(re)) {
      const raw = m[1]?.trim()
      if (!raw) continue
      for (const part of splitReferenceTitleList(raw)) {
        const cleaned = part.replace(/^["'«»]+|["'«»]+$/g, "").trim()
        if (isPlausibleRefineTitle(cleaned)) out.add(cleaned)
      }
    }
  }

  return [...out].slice(0, 8)
}

export function parseRefineContextRequest(body: unknown): RefineContextParseResult {
  if (!bodyHasRefineContext(body)) {
    return { ok: false, error: "refine_context_invalid" }
  }

  const rc = (body as Record<string, unknown>).refineContext as Record<string, unknown>
  const originalPrompt =
    typeof rc.originalPrompt === "string" ? rc.originalPrompt.trim() : ""
  const refineMessage =
    typeof rc.refineMessage === "string" ? rc.refineMessage.trim() : ""
  const previousResultTitles = Array.isArray(rc.previousResultTitles)
    ? rc.previousResultTitles
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12)
    : []

  if (!originalPrompt || !refineMessage || previousResultTitles.length === 0) {
    return { ok: false, error: "refine_context_invalid" }
  }
  if (refineMessage.length > REFINE_MESSAGE_MAX) {
    return { ok: false, error: "refine_message_too_long" }
  }

  return {
    ok: true,
    context: { originalPrompt, previousResultTitles, refineMessage },
  }
}

export function parseRefineContext(body: unknown): RecommendRefineContext | null {
  const parsed = parseRefineContextRequest(body)
  return parsed.ok ? parsed.context : null
}

export function formatRecommendRunPromptWithRefine(
  originalPrompt: string,
  refineMessage: string
): string {
  const base = originalPrompt.trim()
  const refine = refineMessage.trim()
  if (!refine) return base
  return `${base} | refine: ${refine}`
}

/** User prompt sent to discovery AI — varies by refine classification. */
export function buildRefineDiscoveryUserPrompt(ctx: RecommendRefineContext): string {
  const prior = ctx.previousResultTitles
    .map((title, i) => `${i + 1}) ${title}`)
    .join("; ")
  const kind = classifyRefineIntent(ctx.refineMessage)
  const refine = ctx.refineMessage.trim()
  const original = ctx.originalPrompt.trim()

  if (kind === "direction_correction") {
    return `Taste direction correction — this OVERRIDES the original request direction:
${refine}
Reference taste anchors from the correction must dominate suggestedTitles and fallbackDiscoveryQueries.
Do NOT recommend the exact reference anchor games themselves (e.g. if user says more like RDR2/Fallout NV, suggest similar open-world RPGs — not Red Dead Redemption 2 or Fallout: New Vegas).
Original context only (secondary — do not repeat its indie/emotional bias if it conflicts): ${original}
Prior picks — do not repeat unless explicitly referenced above: ${prior}`
  }

  if (kind === "stricter_constraint") {
    return `${original}
Refine (stricter constraints — apply on top of original direction): ${refine}
Prior picks — do not repeat: ${prior}`
  }

  return `${original}
Refine (keep same direction, apply edits only): ${refine}
Prior picks — do not repeat: ${prior}`
}

export function refineWantsMoreLikePrevious(refineMessage: string): boolean {
  const r = refineMessage.toLowerCase()
  return (
    /\bmore like\b/i.test(r) ||
    /\bsimilar to\b/i.test(r) ||
    /\blike the (first|second|third|\d)/i.test(r) ||
    /\bcloser to\b/i.test(r)
  )
}

const ORDINAL_INDEX: Record<string, number> = {
  first: 0,
  "1st": 0,
  second: 1,
  "2nd": 1,
  third: 2,
  "3rd": 2,
}

/** Resolve "more like the second game" → prior result title(s). */
export function extractMoreLikeReferenceTitles(
  refineMessage: string,
  previousResultTitles: string[]
): string[] {
  const r = refineMessage.toLowerCase()

  const ordinalMatch = r.match(
    /\b(?:more like|similar to|closer to)\s+(?:the\s+)?(first|second|third|1st|2nd|3rd)(?:\s+(?:game|pick|result|one))?\b/i
  )
  if (ordinalMatch) {
    const idx = ORDINAL_INDEX[ordinalMatch[1]!.toLowerCase()]
    if (idx !== undefined && previousResultTitles[idx]) {
      return [previousResultTitles[idx]!]
    }
  }

  const numberMatch = r.match(
    /\b(?:more like|similar to|closer to)\s+(?:game\s*)?#?(\d+)\b/i
  )
  if (numberMatch) {
    const idx = Number.parseInt(numberMatch[1]!, 10) - 1
    if (idx >= 0 && idx < previousResultTitles.length) {
      return [previousResultTitles[idx]!]
    }
  }

  if (/\bmore like this\b/i.test(r) && previousResultTitles[0]) {
    return [previousResultTitles[0]]
  }

  for (const title of previousResultTitles) {
    const key = title.toLowerCase()
    if (key.length >= 4 && r.includes(key)) return [title]
  }

  return []
}

export function resolveRefineExcludeAndReference(ctx: RecommendRefineContext): {
  excludeTitles: string[]
  referenceTitles: string[]
} {
  const kind = classifyRefineIntent(ctx.refineMessage)
  const removals = extractRemovalTitles(ctx.refineMessage)
  const moreLikePrior = extractMoreLikeReferenceTitles(
    ctx.refineMessage,
    ctx.previousResultTitles
  )
  const newRefs = extractReferenceTitlesFromRefineMessage(ctx.refineMessage)

  if (kind === "direction_correction") {
    const referenceTitles = mergeUniqueStrings([...moreLikePrior, ...newRefs], 10)

    if (moreLikePrior.length > 0) {
      const keepKeys = new Set(moreLikePrior.map((t) => t.toLowerCase()))
      return {
        excludeTitles: mergeUniqueStrings(
          [
            ...ctx.previousResultTitles.filter((t) => !keepKeys.has(t.toLowerCase())),
            ...removals,
          ],
          16
        ),
        referenceTitles,
      }
    }

    return {
      excludeTitles: mergeUniqueStrings([...ctx.previousResultTitles, ...removals], 16),
      referenceTitles,
    }
  }

  if (kind === "minor_edit") {
    return {
      excludeTitles: mergeUniqueStrings([...ctx.previousResultTitles, ...removals], 16),
      referenceTitles: moreLikePrior,
    }
  }

  if (refineWantsMoreLikePrevious(ctx.refineMessage) && moreLikePrior.length > 0) {
    const moreLikeKeys = new Set(moreLikePrior.map((t) => t.toLowerCase()))
    return {
      excludeTitles: mergeUniqueStrings(
        [
          ...ctx.previousResultTitles.filter((t) => !moreLikeKeys.has(t.toLowerCase())),
          ...removals,
        ],
        16
      ),
      referenceTitles: moreLikePrior,
    }
  }

  return {
    excludeTitles: mergeUniqueStrings([...ctx.previousResultTitles, ...removals], 16),
    referenceTitles: moreLikePrior,
  }
}

export type RefineIntentFields = {
  normalizedIntent: string
  coreNeeds: string[]
  avoid: string[]
}

/** Deterministic intent tweaks from refine phrasing (no extra OpenAI call). */
export function applyRefineIntentAdjustments(
  refineMessage: string,
  intent: RefineIntentFields
): RefineIntentFields {
  const r = refineMessage.toLowerCase()
  const coreNeeds = [...intent.coreNeeds]
  const avoid = [...intent.avoid]
  const kind = classifyRefineIntent(refineMessage)

  if (/\b(not multiplayer|no multiplayer|less multiplayer|without multiplayer)\b/.test(r)) {
    avoid.push("multiplayer", "online co-op", "mmo")
  }
  if (/\b(more story|story.?rich|narrative|story driven)\b/.test(r)) {
    coreNeeds.push("story-rich", "narrative", "choices matter")
  }
  if (/\b(shorter sessions?|quick sessions?|bite.?size|pick up and play)\b/.test(r)) {
    coreNeeds.push("short sessions", "pick-up-and-play")
  }
  if (/\b(less horror|not horror|no horror|less scary|less dark)\b/.test(r)) {
    avoid.push("horror", "survival horror", "psychological horror")
  }
  if (/\b(more mysterious|more mystery|less cozy)\b/.test(r)) {
    coreNeeds.push("mysterious", "atmospheric")
    if (/\bless cozy\b/.test(r)) avoid.push("cozy", "wholesome")
  }
  if (/\bmore cozy\b/.test(r)) {
    coreNeeds.push("cozy", "relaxing")
  }
  if (
    /\b(less famous|more obscure|underrated|hidden gem|i already know|already know these|already played|played all the popular)\b/.test(
      r
    )
  ) {
    coreNeeds.push("obscure", "underrated", "hidden gem", "cult classic")
    avoid.push("mainstream blockbuster", "obvious safe picks", "overexposed indie hits")
  }
  if (/\b(cheaper|lower price|less expensive|tighter budget|under budget)\b/.test(r)) {
    coreNeeds.push("affordable", "strong value")
  }
  if (/\b(less competitive|more funny|funny moments|social|emergent)\b/.test(r)) {
    coreNeeds.push("social", "emergent gameplay", "party-friendly")
    if (/\bless competitive\b/.test(r)) avoid.push("competitive", "ranked", "esports")
  }
  if (/\b(less grand strategy|more rts|base building|village building)\b/.test(r)) {
    coreNeeds.push("RTS", "base building", "faction management")
    if (/\bless grand strategy\b/.test(r)) avoid.push("grand strategy", "4X empire sim")
  }
  if (/\b(freedom|getting lost|exploration|open world|survival)\b/.test(r)) {
    coreNeeds.push("exploration", "open world", "freedom", "discovery")
    if (/\bless (about )?story\b/.test(r) || /\bless story rpg\b/.test(r)) {
      avoid.push("linear story RPG", "heavy dialogue RPG")
    }
  }

  if (kind === "direction_correction") {
    if (/\bless indie\b/i.test(r)) {
      avoid.push("small emotional indie", "walking simulator", "short narrative indie")
    }
    if (
      /\b(rdr2|red dead redemption|fallout\s*nv|fallout new vegas|fallout)\b/i.test(r)
    ) {
      coreNeeds.push(
        "open world",
        "freedom",
        "roleplay",
        "choices matter",
        "sandbox RPG",
        "exploration"
      )
      avoid.push(
        "short emotional indie",
        "walking simulator",
        "linear narrative adventure",
        "art house indie"
      )
    }
  }

  const normalizedIntent =
    kind === "direction_correction"
      ? `${refineMessage.trim()} (direction correction — overrides conflicting parts of: ${intent.normalizedIntent.trim()})`
      : `${intent.normalizedIntent.trim()} — Refinement: ${refineMessage.trim()}`

  return {
    normalizedIntent,
    coreNeeds: mergeUniqueStrings(coreNeeds, 14),
    avoid: mergeUniqueStrings(avoid, 12),
  }
}

export function refineRequestsStricterBudget(refineMessage: string): boolean {
  return /\b(cheaper|lower price|less expensive|tighter budget|under budget)\b/i.test(
    refineMessage
  )
}

/** Push refine exclude/reference titles into intent + RAWG exclude list. */
export function applyRefineExcludeAndReferenceToIntent(
  intent: { referenceTitles?: string[]; excludeTitles?: string[] },
  ctx: RecommendRefineContext,
  excludeListRaw: string[]
): void {
  const { excludeTitles, referenceTitles } = resolveRefineExcludeAndReference(ctx)
  excludeListRaw.push(...excludeTitles)

  const referenceExpanded = expandReferenceTitleExcludes(referenceTitles)
  if (referenceExpanded.length > 0) {
    intent.referenceTitles = mergeUniqueStrings(
      [...(intent.referenceTitles ?? []), ...referenceTitles],
      16
    )
    intent.excludeTitles = mergeUniqueStrings(
      [...(intent.excludeTitles ?? []), ...referenceExpanded],
      20
    )
    excludeListRaw.push(...referenceExpanded)
  }
}
