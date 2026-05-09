const CHEAPSHARK_BAD_WORDS = [
  "dlc",
  "soundtrack",
  "ost",
  "demo",
  "expansion",
  "pack",
  "bundle",
] as const;

const TITLE_NOISE_WORDS = [
  "edition",
  "definitive",
  "remastered",
  "goty",
  "game",
  "of",
  "the",
  "year",
  "complete",
  "ultimate",
  "deluxe",
  "collection",
  "bundle",
  "pack",
] as const;

export function normalizeTitleForMatch(title: string) {
  return title
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsBadWords(title: string) {
  const t = normalizeTitleForMatch(title);
  return CHEAPSHARK_BAD_WORDS.some((w) => t.includes(w));
}

function titleTokensForMatch(title: string) {
  const t = normalizeTitleForMatch(title);
  if (!t) return [];
  return t
    .split(" ")
    .filter(Boolean)
    .filter((tok) => !TITLE_NOISE_WORDS.includes(tok as (typeof TITLE_NOISE_WORDS)[number]));
}

function jaccardTokens(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function titleMatchScore(requestedTitle: string, candidateTitle: string) {
  const aNorm = normalizeTitleForMatch(requestedTitle);
  const bNorm = normalizeTitleForMatch(candidateTitle);
  if (!aNorm || !bNorm) return 0;
  if (aNorm === bNorm) return 1;
  if (aNorm.length >= 4 && (aNorm.includes(bNorm) || bNorm.includes(aNorm))) return 0.93;

  const aTok = titleTokensForMatch(requestedTitle);
  const bTok = titleTokensForMatch(candidateTitle);
  const ja = jaccardTokens(aTok, bTok);

  const shared = aTok.filter((t) => bTok.includes(t)).length;
  if (aTok.length >= 3 && shared < 2) return Math.min(ja, 0.45);
  return ja;
}

