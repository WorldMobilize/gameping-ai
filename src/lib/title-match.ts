const EDITION_MARKERS = [
  "edition",
  "ultimate",
  "deluxe",
  "complete",
  "definitive",
  "gold",
  "goty",
  "game of the year",
  "remastered",
  "remake",
  "collection",
  "bundle",
] as const

function tokenizeForMatch(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeTitleForMatch(title: string) {
  let t = tokenizeForMatch(title)
  t = t.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ")
  t = t.replace(/[-–—:]/g, " ")
  const tokens = t
    .split(" ")
    .filter(Boolean)
    .filter((tok) => !EDITION_MARKERS.includes(tok as (typeof EDITION_MARKERS)[number]))
    .filter((tok) => tok !== "vr" && tok !== "beta" && tok !== "alpha")
  return tokens.join(" ").trim()
}

function titleTokens(title: string) {
  const t = tokenizeForMatch(title)
  return t ? t.split(" ").filter(Boolean) : []
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter += 1
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

export const VERIFIED_TITLE_MATCH_MIN = 0.74

export function titleMatchQuality(suggestedTitle: string, rawgName: string) {
  const a = normalizeTitleForMatch(suggestedTitle)
  const b = normalizeTitleForMatch(rawgName)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.length >= 4 && (a.includes(b) || b.includes(a))) return 0.93
  const ja = jaccard(titleTokens(a), titleTokens(b))
  if (ja >= 0.9) return 0.9
  if (ja >= 0.82) return 0.82
  if (ja >= 0.74) return 0.74
  return ja
}
