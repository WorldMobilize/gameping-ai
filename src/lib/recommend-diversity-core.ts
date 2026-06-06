import type { IntentSignals } from "@/lib/intent-normalization";
import type { RawgCandidate } from "@/lib/rawg-discovery";

/**
 * Conservative diversity / discovery rerank tuning.
 * Does not ban popular games — only nudges ranking so abstract prompts do not
 * always surface the same "safe anchor" titles when strong alternatives exist.
 */

export const CANONICAL_SOFT_PENALTY = 4;
export const CANONICAL_FATIGUE_PENALTY = 16;
export const CANONICAL_FATIGUE_STACK_PENALTY = 8;
export const DISCOVERY_SOFT_BOOST = 5;
export const DISCOVERY_OBSCURE_BOOST = 12;
/** Strong penalty for famous indie canon under explicit obscure/hidden-gem intent. */
export const FAMOUS_INDIE_OBSCURE_PENALTY = 38;
export const FAMOUS_INDIE_OBSCURE_SORT_PENALTY = 34;
export const MAX_FAMOUS_INDIE_PICKS_OBSCURE = 1;
export const POPULARITY_WEIGHT_OBSCURE = 0.1;
/** Discovery boost only applies when the candidate already has decent semantic fit. */
export const DISCOVERY_MIN_BASE_SCORE = 34;
/** Skip canonical penalty when the title leads the pool by this margin (obvious best fit). */
export const CANONICAL_CLEAR_LEAD_MARGIN = 14;

export const MAX_CANONICAL_PICKS_FATIGUE = 2;
export const MAX_DISCOVERY_PICKS_IN_RESPONSE = 2;
export const RECOVERY_MAX_TOTAL_PICKS = 4;
export const RECOVERY_MAX_ADDITIONS = 2;

export const BUCKET_TARGET_SAFE = 2;
export const BUCKET_TARGET_STRONG = 2;
export const BUCKET_TARGET_DISCOVERY = 2;

/** Well-known titles that often dominate abstract / vibe prompts. Not banned. */
const CANONICAL_ANCHOR_KEYS = new Set(
  [
    "journey",
    "celeste",
    "firewatch",
    "what remains of edith finch",
    "gris",
    "life is strange",
    "undertale",
    "hollow knight",
    "disco elysium",
    "stardew valley",
    "inside",
    "the witness",
    "the witcher 3 wild hunt",
    "the witcher 3",
    "the elder scrolls v skyrim",
    "skyrim",
    "red dead redemption 2",
    "animal crossing new horizons",
    "portal 2",
    "breath of the wild",
    "the legend of zelda breath of the wild",
    "oxenfree",
    "night in the woods",
    "a short hike",
    "the beginner s guide",
  ].map(normalizeTitleKey)
);

/** Famous indie icons that dominate "hidden gem" prompts — penalize only under obscure intent. */
const FAMOUS_INDIE_OBSCURE_KEYS = new Set(
  [
    "journey",
    "celeste",
    "hollow knight",
    "undertale",
    "disco elysium",
    "firewatch",
    "what remains of edith finch",
    "gris",
    "life is strange",
    "oxenfree",
    "night in the woods",
    "a short hike",
    "stardew valley",
    "the beginner s guide",
    "hades",
    "outer wilds",
    "portal 2",
  ].map(normalizeTitleKey)
);

/** Cult / hidden-gem style titles — boost when already semantically relevant. */
const DISCOVERY_GEM_KEYS = new Set(
  [
    "tunic",
    "animal well",
    "dredge",
    "citizen sleeper",
    "norco",
    "signalis",
    "sunless sea",
    "sable",
    "eastshade",
    "rain world",
    "noita",
    "outer wilds",
    "return of the obra dinn",
    "kentucky route zero",
    "hypnospace outlaw",
    "stories untold",
    "infra",
    "pathologic 2",
    "void stranger",
    "hyper light drifter",
    "la mulana",
    "kenshi",
    "caves of qud",
    "pentiment",
    "chants of sennaar",
    "in stars and time",
    "citizen sleeper 2",
    "paradise killer",
    "the case of the golden idol",
    "case of the golden idol",
    "eliza",
    "1000xresist",
    "felvidek",
    "who s lila",
    "slay the princess",
    "the cosmic wheel sisterhood",
    "cosmic wheel sisterhood",
  ].map(normalizeTitleKey)
);

const CLASSIC_LIST_PROMPT_RE =
  /\b(best games? ever|greatest games?|all[\s-]?time|masterpieces?|iconic games?|classic games?|must[\s-]?play|essential games?|top games? of all time|migliori giochi di sempre)\b/i;

const EXPLICIT_LIKE_PROMPT_RE =
  /\b(games?\s+like|similar\s+to|alternatives?\s+to|tipo|simili?\s+a|come)\b/i;

const BROAD_EMOTIONAL_PROMPT_RE =
  /\b(love gaming again|make you love gaming|fall in love with gaming|games that (?:make|made) you|stayed with me|unforgettable|memorable|emotional|feel something|restore my faith|rekindle|magic of gaming|giochi che ti restano|qualcosa di speciale)\b/i;

const OBSCURE_INTENT_PROMPT_RE =
  /\b(hidden gems?|underrated|less famous|obscure|weird underrated|weird games?|overlooked|sottovalutat\w*|gemme nascoste|non famos\w*|under the radar|lower awareness|not mainstream indie)\b/i;

const NOT_USUAL_INDIE_PROMPT_RE =
  /\b(not the usual indie|not usual indie|not usual recommendations|no usual indie|less obvious indie|without the usual indie|usual indie recommendations|non[\s-]?typical indie|not the usual recommendations)\b/i;

export function hasObscureDiscoveryIntent(prompt: string): boolean {
  const n = prompt.trim().toLowerCase();
  return OBSCURE_INTENT_PROMPT_RE.test(n) || NOT_USUAL_INDIE_PROMPT_RE.test(n);
}

export type DiversityContext = {
  antiSafePickFatigue: boolean;
  obscureDiscovery: boolean;
  explicitLikeRequest: boolean;
  classicListRequest: boolean;
  referenceTitles: string[];
};

export function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCanonicalAnchorTitle(title: string): boolean {
  return CANONICAL_ANCHOR_KEYS.has(normalizeTitleKey(title));
}

export function isDiscoveryGemTitle(title: string): boolean {
  return DISCOVERY_GEM_KEYS.has(normalizeTitleKey(title));
}

export function isFamousIndieForObscurePrompt(title: string): boolean {
  return FAMOUS_INDIE_OBSCURE_KEYS.has(normalizeTitleKey(title));
}

export function buildDiversityContext(params: {
  userPrompt: string;
  signals: IntentSignals;
  referenceTitles?: string[];
}): DiversityContext {
  const prompt = params.userPrompt.trim();
  const n = prompt.toLowerCase();
  const referenceTitles = params.referenceTitles ?? [];

  const explicitLikeRequest = EXPLICIT_LIKE_PROMPT_RE.test(n);
  const classicListRequest = CLASSIC_LIST_PROMPT_RE.test(n);
  const obscureDiscovery =
    params.signals.discoverySubkind === "underrated" ||
    hasObscureDiscoveryIntent(prompt);

  const broadEmotional =
    params.signals.memorableDiscovery ||
    BROAD_EMOTIONAL_PROMPT_RE.test(n) ||
    params.signals.discoverySubkind === "lonely_beautiful" ||
    params.signals.discoverySubkind === "anti_aaa";

  const antiSafePickFatigue =
    broadEmotional && !classicListRequest && !explicitLikeRequest;

  return {
    antiSafePickFatigue,
    obscureDiscovery,
    explicitLikeRequest,
    classicListRequest,
    referenceTitles,
  };
}

/** Scale RAWG popularity contribution by prompt personality (not a ban). */
export function popularityWeightMultiplier(ctx: DiversityContext): number {
  if (ctx.classicListRequest) return 1.15;
  if (ctx.obscureDiscovery) return POPULARITY_WEIGHT_OBSCURE;
  if (ctx.antiSafePickFatigue) return 0.55;
  return 1;
}

export function isRecoveryFillerReason(reason: string): boolean {
  return (
    /non era nel top stretto/i.test(reason) ||
    /didn't make the tightest/i.test(reason) ||
    /didn.t make the tightest/i.test(reason)
  );
}

export type ScoredCandidate = { candidate: RawgCandidate; score: number };

function canonicalPenaltyForRow(params: {
  title: string;
  index: number;
  topMargin: number;
  baseScore: number;
  ctx?: DiversityContext;
  canonicalCountSoFar: number;
}): number {
  if (!isCanonicalAnchorTitle(params.title)) return 0;
  if (params.ctx?.classicListRequest) return 0;

  const isClearLeader =
    params.index === 0 && params.topMargin >= CANONICAL_CLEAR_LEAD_MARGIN;
  if (isClearLeader) return 0;

  if (params.ctx?.antiSafePickFatigue) {
    let penalty = CANONICAL_FATIGUE_PENALTY;
    if (params.canonicalCountSoFar >= 1) {
      penalty += CANONICAL_FATIGUE_STACK_PENALTY * params.canonicalCountSoFar;
    }
    return penalty;
  }

  return CANONICAL_SOFT_PENALTY;
}

function discoveryBoostForRow(
  title: string,
  baseScore: number,
  ctx?: DiversityContext
): number {
  if (ctx?.classicListRequest) return 0;
  if (baseScore < DISCOVERY_MIN_BASE_SCORE) return 0;
  if (!isDiscoveryGemTitle(title)) return 0;
  return ctx?.obscureDiscovery ? DISCOVERY_OBSCURE_BOOST : DISCOVERY_SOFT_BOOST;
}

function obscureFamousIndiePenalty(title: string, ctx?: DiversityContext): number {
  if (!ctx?.obscureDiscovery) return 0;
  if (!isFamousIndieForObscurePrompt(title)) return 0;
  return FAMOUS_INDIE_OBSCURE_PENALTY;
}

function obscurePopularityPenalty(
  added: number,
  ratings: number,
  ctx?: DiversityContext
): number {
  if (!ctx?.obscureDiscovery) return 0;
  if (added > 50_000 && ratings > 25_000) return 40;
  if (added > 30_000 && ratings > 15_000) return 30;
  if (added > 15_000 && ratings > 8_000) return 20;
  if (added > 8_000 && ratings > 4_000) return 12;
  return 0;
}

/**
 * Adjust pre-rerank heuristic scores: conditional canonical fatigue + discovery boost.
 */
export function applyDiversityScoreAdjustments(
  scored: ScoredCandidate[],
  ctx?: DiversityContext
): ScoredCandidate[] {
  if (scored.length === 0) return scored;

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  const second = sorted[1]?.score ?? 0;
  const topMargin = top - second;

  let canonicalSeen = 0;
  const adjusted = sorted.map((row, index) => {
    let score = row.score;
    const title = row.candidate.name;

    score -= canonicalPenaltyForRow({
      title,
      index,
      topMargin,
      baseScore: row.score,
      ctx,
      canonicalCountSoFar: canonicalSeen,
    });
    if (isCanonicalAnchorTitle(title)) canonicalSeen += 1;

    score += discoveryBoostForRow(title, row.score, ctx);
    score -= obscureFamousIndiePenalty(title, ctx);

    const added =
      typeof row.candidate.added === "number" ? row.candidate.added : 0;
    const ratings =
      typeof row.candidate.ratings_count === "number"
        ? row.candidate.ratings_count
        : 0;
    score -= obscurePopularityPenalty(added, ratings, ctx);
    if (
      ctx?.obscureDiscovery &&
      ratings >= 250 &&
      ratings <= 12_000 &&
      typeof row.candidate.rating === "number" &&
      row.candidate.rating >= 3.6
    ) {
      score += 14;
    }

    return { candidate: row.candidate, score };
  });

  adjusted.sort((a, b) => b.score - a.score);
  return adjusted;
}

export type DiversityPick = {
  id: number;
  title: string;
  slug: string | null;
  image: string | null;
  match: number;
  reason: string;
  matchTier: "best_match" | "good_alternative" | "partial_match";
  matchNote: string;
};

type PickBucket = "safe" | "strong" | "discovery";

function classifyPickBucket(pick: DiversityPick, ctx?: DiversityContext): PickBucket {
  if (
    ctx?.obscureDiscovery &&
    isFamousIndieForObscurePrompt(pick.title)
  ) {
    return "strong";
  }
  if (
    pick.matchTier === "best_match" &&
    pick.match >= 78 &&
    !isDiscoveryGemTitle(pick.title)
  ) {
    return "safe";
  }
  if (
    isDiscoveryGemTitle(pick.title) ||
    (pick.matchTier === "partial_match" &&
      pick.match >= 60 &&
      !isCanonicalAnchorTitle(pick.title))
  ) {
    return "discovery";
  }
  return "strong";
}

function effectivePickSortScore(pick: DiversityPick, ctx?: DiversityContext): number {
  let s = pick.match;
  if (isCanonicalAnchorTitle(pick.title)) {
    s -= ctx?.antiSafePickFatigue ? CANONICAL_FATIGUE_PENALTY : CANONICAL_SOFT_PENALTY;
  }
  if (isDiscoveryGemTitle(pick.title)) {
    s += ctx?.obscureDiscovery ? 4 : 2;
  }
  if (ctx?.obscureDiscovery && isFamousIndieForObscurePrompt(pick.title)) {
    s -= FAMOUS_INDIE_OBSCURE_SORT_PENALTY;
  }
  if (pick.matchTier === "partial_match") s -= 4;
  if (isRecoveryFillerReason(pick.reason)) s -= 8;
  return s;
}

function applyBucketComposition(
  ordered: DiversityPick[],
  ctx?: DiversityContext
): DiversityPick[] {
  if (ordered.length <= 3) return ordered;

  const buckets: Record<PickBucket, DiversityPick[]> = {
    safe: [],
    strong: [],
    discovery: [],
  };

  for (const pick of ordered) {
    buckets[classifyPickBucket(pick, ctx)].push(pick);
  }

  for (const key of Object.keys(buckets) as PickBucket[]) {
    buckets[key].sort(
      (a, b) => effectivePickSortScore(b, ctx) - effectivePickSortScore(a, ctx)
    );
  }

  const out: DiversityPick[] = [];
  const used = new Set<number>();

  const takeFrom = (bucket: PickBucket, max: number) => {
    for (const pick of buckets[bucket]) {
      if (out.length >= 6) break;
      if (used.has(pick.id)) continue;
      if (
        bucket === "strong" &&
        ctx?.obscureDiscovery &&
        isFamousIndieForObscurePrompt(pick.title)
      ) {
        continue;
      }
      if (
        bucket === "safe" &&
        ctx?.obscureDiscovery &&
        isFamousIndieForObscurePrompt(pick.title)
      ) {
        continue;
      }
      if (
        bucket === "safe" &&
        ctx?.antiSafePickFatigue &&
        isCanonicalAnchorTitle(pick.title)
      ) {
        const canonicalInOut = out.filter((p) => isCanonicalAnchorTitle(p.title)).length;
        if (canonicalInOut >= MAX_CANONICAL_PICKS_FATIGUE) continue;
      }
      out.push(pick);
      used.add(pick.id);
      if (--max <= 0) break;
    }
  };

  if (ctx?.obscureDiscovery) {
    takeFrom("discovery", BUCKET_TARGET_DISCOVERY);
    takeFrom("strong", BUCKET_TARGET_STRONG);
    takeFrom("safe", BUCKET_TARGET_SAFE);
  } else {
    takeFrom("safe", BUCKET_TARGET_SAFE);
    takeFrom("strong", BUCKET_TARGET_STRONG);
    takeFrom("discovery", BUCKET_TARGET_DISCOVERY);
  }

  for (const pick of ordered) {
    if (out.length >= 6) break;
    if (used.has(pick.id)) continue;
    if (
      ctx?.antiSafePickFatigue &&
      isCanonicalAnchorTitle(pick.title) &&
      out.filter((p) => isCanonicalAnchorTitle(p.title)).length >=
        MAX_CANONICAL_PICKS_FATIGUE
    ) {
      continue;
    }
    if (
      ctx?.obscureDiscovery &&
      isFamousIndieForObscurePrompt(pick.title) &&
      out.some((p) => !isFamousIndieForObscurePrompt(p.title))
    ) {
      continue;
    }
    out.push(pick);
    used.add(pick.id);
  }

  return out;
}

/**
 * Re-order final picks: bucket variety, cap canonical anchors, trim weak filler.
 */
export function balanceFinalPicksDiversity(
  picks: DiversityPick[],
  ctx?: DiversityContext
): DiversityPick[] {
  if (picks.length === 0) return picks;

  const nonFiller = picks.filter((p) => !isRecoveryFillerReason(p.reason));
  const filler = picks.filter((p) => isRecoveryFillerReason(p.reason));
  const base = nonFiller.length >= 2 ? nonFiller : [...nonFiller, ...filler];

  const ordered = [...base].sort(
    (a, b) => effectivePickSortScore(b, ctx) - effectivePickSortScore(a, ctx)
  );

  let out = applyBucketComposition(ordered, ctx);

  let discoveryCount = 0;
  let famousIndieCount = 0;
  const capped: DiversityPick[] = [];
  for (const pick of out) {
    if (capped.length >= 6) break;
    if (isDiscoveryGemTitle(pick.title)) {
      if (discoveryCount >= MAX_DISCOVERY_PICKS_IN_RESPONSE) continue;
      discoveryCount += 1;
    }
    if (ctx?.obscureDiscovery && isFamousIndieForObscurePrompt(pick.title)) {
      if (famousIndieCount >= MAX_FAMOUS_INDIE_PICKS_OBSCURE) continue;
      famousIndieCount += 1;
    }
    capped.push(pick);
  }
  out = capped;

  const mostlyWeak =
    out.length > 0 &&
    out.every((p) => p.match <= 66 || p.matchTier === "partial_match");
  if (mostlyWeak && out.length > RECOVERY_MAX_TOTAL_PICKS) {
    return out.slice(0, RECOVERY_MAX_TOTAL_PICKS);
  }

  if (out.length > 5 && out.filter((p) => p.match >= 80).length <= 1) {
    return out.slice(0, 4);
  }

  return out;
}

export function buildRecoveryReason(params: {
  overlapping: string[];
  locale: "it" | "en";
  title: string;
}): string {
  const themes =
    params.overlapping.slice(0, 3).join(", ") ||
    (params.locale === "it" ? "la tua richiesta" : "your request");
  const variantsIt = [
    `Alternativa valida su ${themes}: non era il match più stretto, ma resta coerente con quello che cerchi.`,
    `Pick di supporto legato a ${themes} — utile se vuoi un'opzione in più oltre ai titoli principali.`,
    `C'entra con ${themes} con un taglio leggermente diverso rispetto ai match più in alto.`,
  ];
  const variantsEn = [
    `A solid extra for ${themes} — not the tightest fit, but still aligned with what you asked for.`,
    `Support pick tied to ${themes}; worth a look if you want another angle beside the top matches.`,
    `Touches ${themes} with a slightly different flavor than the main recommendations.`,
  ];
  const variants = params.locale === "it" ? variantsIt : variantsEn;
  const idx =
    Math.abs(params.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
    variants.length;
  return variants[idx] ?? variants[0]!;
}

export function buildDeterministicFallbackPicks(params: {
  scoredFinal: ScoredCandidate[];
  isExcluded: (title: string) => boolean;
  locale: "it" | "en";
  max?: number;
  ctx?: DiversityContext;
  mapCandidate: (c: RawgCandidate) => {
    id: number;
    title: string;
    slug: string | null;
    image: string | null;
  };
}): DiversityPick[] {
  const max = params.max ?? 4;
  const out: DiversityPick[] = [];

  for (const row of params.scoredFinal) {
    if (out.length >= max) break;
    if (params.isExcluded(row.candidate.name)) continue;
    const mapped = params.mapCandidate(row.candidate);
    const match = Math.min(92, Math.max(72, 68 + Math.floor(row.score / 2)));
    const reason =
      params.locale === "it"
        ? `Match forte sulla tua richiesta (${mapped.title}) — selezionato quando il rerank non ha restituito risultati.`
        : `Strong fit for your request (${mapped.title}) — selected when rerank returned no games.`;
    out.push({
      ...mapped,
      match,
      reason,
      matchTier: row.score >= 12 ? "good_alternative" : "partial_match",
      matchNote: "",
    });
  }

  return balanceFinalPicksDiversity(out, params.ctx);
}

/** Prompt block for discovery/rerank AI — personality over consensus defaults. */
export function diversityPersonalityPromptBlock(ctx: DiversityContext): string {
  const lines: string[] = [
    "- Avoid defaulting to the same universally recommended games unless they are clearly the best personal fit.",
    "- Prioritize personal fit and variety over internet consensus safe picks.",
  ];
  if (ctx.antiSafePickFatigue) {
    lines.push(
      "- Broad emotional/discovery prompt: include at most 1–2 famous consensus picks; prefer less obvious strong matches and genuine discoveries."
    );
  }
  if (ctx.obscureDiscovery) {
    lines.push(
      "- Hidden gem / underrated / under-the-radar / not-usual-indie prompt: do NOT recommend famous indie canon (Hollow Knight, Undertale, Celeste, Journey, Edith Finch, Oxenfree, Night in the Woods, Gris, A Short Hike, Firewatch, Life is Strange, Stardew Valley, Disco Elysium, The Beginner's Guide) unless the user explicitly names them.",
      "- Hidden gem means lower-awareness but still high-quality — think acclaimed cult picks like NORCO, Signalis, Citizen Sleeper, Hypnospace Outlaw, Pentiment, Chants of Sennaar, Void Stranger, Paradise Killer, Slay the Princess — not Reddit-default indie icons.",
      "- Prefer RAWG titles with strong ratings but modest mainstream awareness; never shovelware or keyword spam."
    );
  }
  if (ctx.explicitLikeRequest) {
    lines.push(
      "- User asked for games LIKE a reference — match that reference style closely; do not substitute unrelated famous defaults."
    );
  }
  if (ctx.classicListRequest) {
    lines.push(
      "- User asked for best/classic games — established masterpieces and widely acclaimed titles are appropriate."
    );
  }
  return lines.join("\n");
}
