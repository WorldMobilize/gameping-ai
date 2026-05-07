import "server-only"

type ExpansionRule = {
  // If any of these tokens appear, add the keywords.
  triggers: string[]
  keywords: string[]
}

const RULES: ExpansionRule[] = [
  {
    triggers: ["spaccio", "droga", "drug dealer", "drug-dealer", "narcos", "cartello", "cartel"],
    keywords: [
      "drug dealing",
      "crime",
      "illegal economy",
      "cartel",
      "management",
      "simulation",
    ],
  },
  {
    triggers: ["mafia", "gangster", "criminalità organizzata", "organized crime"],
    keywords: ["crime", "gangster", "organized crime"],
  },
  {
    triggers: ["soulslike", "souls-like", "dark souls", "elden ring"],
    keywords: ["soulslike", "difficult", "action rpg", "boss fights"],
  },
  {
    triggers: ["cozy", "rilassante", "relax", "relaxing", "comfort", "tranquillo", "chill"],
    keywords: ["cozy", "relaxing", "farming", "life sim"],
  },
  {
    triggers: ["horror", "paura", "spaventoso", "spooky", "creepy"],
    keywords: ["horror", "psychological horror", "survival horror", "dark atmosphere"],
  },
  {
    triggers: ["gestionale", "management", "tycoon", "manageriale"],
    keywords: ["management", "tycoon", "strategy"],
  },
  {
    triggers: ["survival", "sopravvivenza"],
    keywords: ["survival", "crafting", "open world survival"],
  },
]

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .trim()
}

/**
 * Lightweight intent expansion.
 * Adds extra keywords based on trigger tokens found in the user input.
 */
export function expandIntentKeywords(input: {
  userPrompt?: string
  genres?: string
  playStyles?: string
  vibes?: string
  mechanics?: string
  platform?: string
}) {
  const combined = normalizeText(
    [
      input.userPrompt,
      input.genres,
      input.playStyles,
      input.vibes,
      input.mechanics,
      input.platform,
    ]
      .filter(Boolean)
      .join(" | ")
  )

  const out = new Set<string>()

  for (const rule of RULES) {
    if (rule.triggers.some((t) => combined.includes(normalizeText(t)))) {
      for (const kw of rule.keywords) out.add(kw)
    }
  }

  return Array.from(out)
}

