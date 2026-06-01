/** One-shot recommendation refinement (not multi-turn chat). */

export type RecommendRefineContext = {
  originalPrompt: string
  previousResultTitles: string[]
  refineMessage: string
}

export const REFINE_MESSAGE_MAX = 200

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

/** User prompt sent to discovery AI — original + refinement + prior picks. */
export function buildRefineDiscoveryUserPrompt(ctx: RecommendRefineContext): string {
  const numbered = ctx.previousResultTitles
    .map((title, i) => `${i + 1}. ${title}`)
    .join("\n")

  return `${ctx.originalPrompt.trim()}

Refinement (overrides earlier assumptions — follow this closely):
${ctx.refineMessage.trim()}

Previous recommendations to improve on (avoid repeating these unless the refinement explicitly asks for more like one of them):
${numbered}`
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
  const moreLike = extractMoreLikeReferenceTitles(
    ctx.refineMessage,
    ctx.previousResultTitles
  )

  if (refineWantsMoreLikePrevious(ctx.refineMessage) && moreLike.length > 0) {
    const moreLikeKeys = new Set(moreLike.map((t) => t.toLowerCase()))
    return {
      excludeTitles: ctx.previousResultTitles.filter(
        (t) => !moreLikeKeys.has(t.toLowerCase())
      ),
      referenceTitles: moreLike,
    }
  }

  if (refineWantsMoreLikePrevious(ctx.refineMessage)) {
    return { excludeTitles: [], referenceTitles: ctx.previousResultTitles.slice(0, 1) }
  }

  return {
    excludeTitles: [...ctx.previousResultTitles],
    referenceTitles: [],
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

  const normalizedIntent = `${intent.normalizedIntent.trim()} — Refinement: ${refineMessage.trim()}`

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
  if (referenceTitles.length > 0) {
    intent.referenceTitles = mergeUniqueStrings(
      [...(intent.referenceTitles ?? []), ...referenceTitles],
      16
    )
    intent.excludeTitles = mergeUniqueStrings(
      [...(intent.excludeTitles ?? []), ...referenceTitles],
      16
    )
    excludeListRaw.push(...referenceTitles)
  }
}
