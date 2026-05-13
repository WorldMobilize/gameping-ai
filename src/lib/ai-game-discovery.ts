import "server-only"

import OpenAI from "openai"

export type AiSuggestedTitle = {
  title: string
  reason: string
  confidence: number
  expectedMatch: string
}

export type AiDiscoveryIntent = {
  normalizedIntent: string
  coreNeeds: string[]
  avoid: string[]
  suggestedTitles: AiSuggestedTitle[]
  fallbackDiscoveryQueries: string[]
  /** Titles the user is comparing against (e.g. “games like Hades”) — not necessarily excluded alone */
  referenceTitles: string[]
  /** Titles that must not appear as final picks when the user wants alternatives */
  excludeTitles: string[]
}

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function normalizeStringArray(v: unknown, max: number) {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x !== "string") continue
    const t = x.trim()
    if (!t) continue
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

function normalizeTitleList(v: unknown, max: number) {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x !== "string") continue
    const t = x.trim()
    if (!t) continue
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

function normalizeSuggestedTitles(v: unknown) {
  if (!Array.isArray(v)) return []
  const out: AiSuggestedTitle[] = []
  for (const x of v) {
    if (!x || typeof x !== "object") continue
    const rec = x as Record<string, unknown>
    const title = typeof rec.title === "string" ? rec.title.trim() : ""
    if (!title) continue
    const reason = typeof rec.reason === "string" ? rec.reason.trim() : ""
    const expectedMatch =
      typeof rec.expectedMatch === "string" ? rec.expectedMatch.trim() : ""
    const confidenceRaw =
      typeof rec.confidence === "number"
        ? rec.confidence
        : typeof rec.confidence === "string"
          ? Number(rec.confidence)
          : 0
    out.push({
      title,
      reason,
      expectedMatch,
      confidence: clamp(Number.isFinite(confidenceRaw) ? confidenceRaw : 0, 0, 100),
    })
    if (out.length >= 15) break
  }
  return out
}

const AI_DISCOVERY_TIMEOUT_MS = 28_000

export function isAbortLikeError(e: unknown): boolean {
  if (!(e instanceof Error)) return false
  if (e.name === "AbortError") return true
  const msg = e.message.toLowerCase()
  return msg.includes("abort") || msg.includes("cancel") || msg.includes("timed out")
}

/** Deterministic fallback when discovery AI times out — fewer picks preferred over inconsistent AI output. */
export function minimalDiscoveryFallback(params: {
  normalizedInput: {
    userPrompt: string
    genres: string
    playStyles: string
    vibes: string
    mechanics: string
    platform: string
    budget: string
    selectedTags: string
  }
  filtersEnabled: boolean
  /** From prompt regex (e.g. “games like X”) — mirrors main route exclusion hints */
  referenceTitlesFromPrompt: string[]
}): {
  intent: AiDiscoveryIntent
  usage: OpenAI.Chat.Completions.ChatCompletion["usage"]
} {
  const q = params.normalizedInput.userPrompt.trim()
  const baseIntent =
    q || "video game recommendation"
  const queries =
    q.length > 2 ? [q.slice(0, 120)] : ["video games"]

  return {
    intent: {
      normalizedIntent: baseIntent,
      coreNeeds: [],
      avoid: [],
      suggestedTitles: [],
      fallbackDiscoveryQueries: queries,
      referenceTitles: [],
      excludeTitles: [...params.referenceTitlesFromPrompt].slice(0, 12),
    },
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  }
}

export async function aiFirstDiscovery(params: {
  openai: OpenAI
  normalizedInput: {
    userPrompt: string
    genres: string
    playStyles: string
    vibes: string
    mechanics: string
    platform: string
    budget: string
    /** Comma-separated explicit UI tags (if any) */
    selectedTags: string
  }
  /** When false, structured filters were disabled — prioritize free-text prompt only. */
  filtersEnabled?: boolean
}) {
  const { openai, normalizedInput } = params
  const filtersEnabled = params.filtersEnabled !== false
  const discoveryStarted = performance.now()

  const discoveryOnlyRules = !filtersEnabled
    ? `
Additional rules (AI-first discovery — structured filters OFF):
- Prioritize ONLY the user request text. Ignore empty genre/platform/budget lines.
- Do not infer price or platform constraints unless the user explicitly mentions them in the request.
- In this mode, disregard the generic bullets above about "budget" and "selected tags" when those inputs were not explicitly provided.
- Be creative and exploratory; varied, vibe-led suggestions are encouraged.
`
    : ""

  let resp: OpenAI.Chat.Completions.ChatCompletion
  try {
    resp = await openai.chat.completions.create(
      {
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
Return ONLY valid JSON in this exact format:
{
  "normalizedIntent": "string",
  "coreNeeds": ["string"],
  "avoid": ["string"],
  "suggestedTitles": [
    {
      "title": "string",
      "reason": "string",
      "confidence": 0,
      "expectedMatch": "string"
    }
  ],
  "fallbackDiscoveryQueries": ["string"],
  "referenceTitles": ["string"],
  "excludeTitles": ["string"]
}

Rules:
- You are an expert video game recommendation assistant.
- Support Italian and English user input. It's OK to output in English.
- "suggestedTitles" MUST contain 8 to 15 REAL, recognizable games (when they fit). Avoid filler.
- Include niche games ONLY when strongly relevant.
- Do NOT invent fake games. If uncertain, leave it out.
- "confidence" is 0..100 (higher = you're confident the title fits the request).
- "expectedMatch" is a short phrase about why the title fits (not a score).
- "fallbackDiscoveryQueries" should be 4 to 8 short RAWG-friendly search queries (include English terms when helpful).
- If the user asks for games LIKE / SIMILAR TO / ALTERNATIVES TO / "tipo" / "come" / "simili a" a NAMED game, put that game name in "referenceTitles" and "excludeTitles". Do NOT put that reference game in "suggestedTitles" as a recommendation — suggest similar games instead.
- If the user clearly wants to FIND / PRICE / DISCOUNT a specific game by name (e.g. "trova Hades", "prezzo di Elden Ring"), leave "excludeTitles" empty and you may include that game in "suggestedTitles".
- Respect the user's maximum budget when suggesting titles when practical (prefer titles likely affordable under that cap).
- Weight the user's selected tags heavily when choosing suggestions.
${discoveryOnlyRules}
- Keep everything concise. No markdown. No extra keys.
`,
      },
      {
        role: "user",
        content: filtersEnabled
          ? `
User request: ${normalizedInput.userPrompt || "not specified"}
Selected tags (high priority): ${normalizedInput.selectedTags || "not specified"}
Genres/tags: ${normalizedInput.genres || "not specified"}
Play styles: ${normalizedInput.playStyles || "not specified"}
Vibes: ${normalizedInput.vibes || "not specified"}
Mechanics: ${normalizedInput.mechanics || "not specified"}
Platform: ${normalizedInput.platform || "not specified"}
Maximum budget (numeric, same currency as UI): ${normalizedInput.budget || "not specified"}
`
          : `
Mode: AI-first discovery (Advanced filters OFF).
Use ONLY the user request below for intent, titles, and queries. Ignore empty structured fields.

User request: ${normalizedInput.userPrompt || "not specified"}
`,
      },
    ],
      },
      { signal: AbortSignal.timeout(AI_DISCOVERY_TIMEOUT_MS) }
    )
  } catch (err) {
    if (isAbortLikeError(err)) {
      console.warn("[recommend:aiDiscovery] OpenAI discovery request aborted or timed out", {
        timeoutMs: AI_DISCOVERY_TIMEOUT_MS,
      })
    }
    throw err
  }

  const text =
    resp.choices[0].message.content ||
    '{"normalizedIntent":"","coreNeeds":[],"avoid":[],"suggestedTitles":[],"fallbackDiscoveryQueries":[]}'
  const parsed = safeParseJson<Partial<AiDiscoveryIntent>>(text) ?? {}

  if (process.env.NODE_ENV === "development") {
    const suggestedPreview = normalizeSuggestedTitles(parsed.suggestedTitles)
    console.log("[recommend:aiDiscovery]", {
      aiDiscoveryMs: Math.round(performance.now() - discoveryStarted),
      model: resp.model ?? "gpt-4o-mini",
      suggestedTitlesCount: suggestedPreview.length,
      responseJsonChars: text.length,
      retries: 0,
    })
  }

  const normalizedIntent =
    typeof parsed.normalizedIntent === "string" && parsed.normalizedIntent.trim()
      ? parsed.normalizedIntent.trim()
      : normalizedInput.userPrompt.trim() || "video game recommendation"

  const coreNeeds = normalizeStringArray(parsed.coreNeeds, 10)
  const avoid = normalizeStringArray(parsed.avoid, 10)
  const suggestedTitles = normalizeSuggestedTitles(parsed.suggestedTitles)
  const fallbackDiscoveryQueries = normalizeStringArray(parsed.fallbackDiscoveryQueries, 8)
  const referenceTitles = normalizeTitleList(parsed.referenceTitles, 12)
  let excludeTitles = normalizeTitleList(parsed.excludeTitles, 12)
  if (referenceTitles.length > 0 && excludeTitles.length === 0) {
    excludeTitles = [...referenceTitles]
  }

  return {
    intent: {
      normalizedIntent,
      coreNeeds,
      avoid,
      suggestedTitles,
      fallbackDiscoveryQueries:
        fallbackDiscoveryQueries.length > 0
          ? fallbackDiscoveryQueries
          : [normalizedIntent].slice(0, 4),
      referenceTitles,
      excludeTitles,
    } satisfies AiDiscoveryIntent,
    usage: resp.usage,
  }
}

