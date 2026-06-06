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
export const DISCOVERY_SOFT_BOOST = 1;
export const DISCOVERY_OBSCURE_BOOST = 5;
export const DISCOVERY_CANON_OBSCURE_BOOST = 2;
export const DISCOVERY_CANON_FATIGUE_PENALTY = 12;
export const DISCOVERY_CANON_STACK_PENALTY = 7;
export const MAX_DISCOVERY_CANON_PICKS = 2;
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

/** Reddit/curator "discovery darling" titles — flavor, not preferred outputs. */
const DISCOVERY_CANON_KEYS = new Set(
  [
    "norco",
    "citizen sleeper",
    "pentiment",
    "signalis",
    "paradise killer",
    "slay the princess",
  ].map(normalizeTitleKey)
);

/** Narrative indie safe picks that dominate broad emotional prompts — fatigue only. */
const NARRATIVE_INDIE_FATIGUE_KEYS = new Set(
  [
    "journey",
    "celeste",
    "firewatch",
    "what remains of edith finch",
    "gris",
    "life is strange",
    "oxenfree",
    "night in the woods",
    "a short hike",
    "the beginner s guide",
  ].map(normalizeTitleKey)
);

/** Cult / hidden-gem style titles — light nudge when semantically relevant. */
const DISCOVERY_GEM_KEYS = new Set(
  [
    "tunic",
    "animal well",
    "dredge",
    "sunless sea",
    "sable",
    "eastshade",
    "rain world",
    "noita",
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
    "chants of sennaar",
    "in stars and time",
    "the case of the golden idol",
    "case of the golden idol",
    "eliza",
    "1000xresist",
    "felvidek",
    "who s lila",
    "the cosmic wheel sisterhood",
    "cosmic wheel sisterhood",
    ...DISCOVERY_CANON_KEYS,
  ].map(normalizeTitleKey)
);

const CLASSIC_LIST_PROMPT_RE =
  /\b(best games? ever|greatest games?|all[\s-]?time|masterpieces?|iconic games?|classic games?|must[\s-]?play|essential games?|top games? of all time|migliori giochi di sempre)\b/i;

const EXPLICIT_LIKE_PROMPT_RE =
  /\b(games?\s+like|similar\s+to|alternatives?\s+to|tipo|simili?\s+a|come)\b/i;

const BROAD_EMOTIONAL_PROMPT_RE =
  /\b(stayed with me|unforgettable|memorable|emotional|feel something|giochi che ti restano|qualcosa di speciale)\b/i;

const MAGICAL_rediscovery_PROMPT_RE =
  /\b(games that make (?:me |you )?love gaming again|make me love gaming again|make you love gaming|fall in love with gaming|restore my love for games|restore (?:my )?faith in gaming|rekindle.*gaming|remind me why games are special|magic of gaming|why games are special|fall in love with gaming again)\b/i;

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
  magicalRediscovery: boolean;
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

export function isDiscoveryCanonTitle(title: string): boolean {
  return DISCOVERY_CANON_KEYS.has(normalizeTitleKey(title));
}

function isFatigueAnchorTitle(title: string, ctx?: DiversityContext): boolean {
  const key = normalizeTitleKey(title);
  if (ctx?.magicalRediscovery) {
    return NARRATIVE_INDIE_FATIGUE_KEYS.has(key);
  }
  return CANONICAL_ANCHOR_KEYS.has(key);
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

  const magicalRediscovery =
    MAGICAL_rediscovery_PROMPT_RE.test(n) &&
    !obscureDiscovery &&
    !classicListRequest &&
    !explicitLikeRequest;

  const broadEmotional =
    (params.signals.memorableDiscovery ||
      BROAD_EMOTIONAL_PROMPT_RE.test(n) ||
      params.signals.discoverySubkind === "lonely_beautiful" ||
      params.signals.discoverySubkind === "anti_aaa") &&
    !magicalRediscovery;

  const antiSafePickFatigue =
    (broadEmotional || magicalRediscovery) &&
    !classicListRequest &&
    !explicitLikeRequest;

  return {
    antiSafePickFatigue,
    obscureDiscovery,
    magicalRediscovery,
    explicitLikeRequest,
    classicListRequest,
    referenceTitles,
  };
}

/** Scale RAWG popularity contribution by prompt personality (not a ban). */
export function popularityWeightMultiplier(ctx: DiversityContext): number {
  if (ctx.classicListRequest) return 1.15;
  if (ctx.obscureDiscovery) return POPULARITY_WEIGHT_OBSCURE;
  if (ctx.magicalRediscovery) return 0.88;
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
  if (!isFatigueAnchorTitle(params.title, params.ctx)) return 0;
  if (params.ctx?.classicListRequest) return 0;

  const isClearLeader =
    params.index === 0 && params.topMargin >= CANONICAL_CLEAR_LEAD_MARGIN;
  if (isClearLeader) return 0;

  if (params.ctx?.antiSafePickFatigue || params.ctx?.magicalRediscovery) {
    let penalty = CANONICAL_FATIGUE_PENALTY;
    if (params.canonicalCountSoFar >= 1) {
      penalty += CANONICAL_FATIGUE_STACK_PENALTY * params.canonicalCountSoFar;
    }
    return penalty;
  }

  return CANONICAL_SOFT_PENALTY;
}

function discoveryCanonContextPenalty(title: string, ctx?: DiversityContext): number {
  if (!isDiscoveryCanonTitle(title)) return 0;
  if (ctx?.magicalRediscovery) return 16;
  if (ctx?.obscureDiscovery) return 6;
  if (ctx?.antiSafePickFatigue) return 10;
  return 3;
}

function discoveryCanonFatiguePenalty(
  title: string,
  canonCountSoFar: number
): number {
  if (!isDiscoveryCanonTitle(title)) return 0;
  if (canonCountSoFar <= 0) return 0;
  return (
    DISCOVERY_CANON_FATIGUE_PENALTY +
    DISCOVERY_CANON_STACK_PENALTY * (canonCountSoFar - 1)
  );
}

function discoveryBoostForRow(
  title: string,
  baseScore: number,
  ctx?: DiversityContext
): number {
  if (ctx?.classicListRequest || ctx?.magicalRediscovery) return 0;
  if (baseScore < DISCOVERY_MIN_BASE_SCORE) return 0;
  if (!isDiscoveryGemTitle(title)) return 0;
  if (isDiscoveryCanonTitle(title)) {
    return ctx?.obscureDiscovery ? DISCOVERY_CANON_OBSCURE_BOOST : 0;
  }
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
  let discoveryCanonSeen = 0;
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
    if (isFatigueAnchorTitle(title, ctx)) canonicalSeen += 1;

    score -= discoveryCanonContextPenalty(title, ctx);
    score -= discoveryCanonFatiguePenalty(title, discoveryCanonSeen);
    if (isDiscoveryCanonTitle(title)) discoveryCanonSeen += 1;

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
      row.candidate.rating >= 3.6 &&
      !isDiscoveryCanonTitle(title)
    ) {
      score += 8;
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
    !ctx?.magicalRediscovery &&
    (isDiscoveryGemTitle(pick.title) ||
      (pick.matchTier === "partial_match" &&
        pick.match >= 60 &&
        !isFatigueAnchorTitle(pick.title, ctx)))
  ) {
    return "discovery";
  }
  return "strong";
}

function effectivePickSortScore(pick: DiversityPick, ctx?: DiversityContext): number {
  let s = pick.match;
  if (isFatigueAnchorTitle(pick.title, ctx)) {
    s -= ctx?.antiSafePickFatigue || ctx?.magicalRediscovery
      ? CANONICAL_FATIGUE_PENALTY
      : CANONICAL_SOFT_PENALTY;
  }
  if (isDiscoveryCanonTitle(pick.title)) {
    s -= ctx?.magicalRediscovery ? 12 : ctx?.obscureDiscovery ? 8 : 6;
  } else if (isDiscoveryGemTitle(pick.title) && ctx?.obscureDiscovery) {
    s += 1;
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
        (ctx?.antiSafePickFatigue || ctx?.magicalRediscovery) &&
        isFatigueAnchorTitle(pick.title, ctx)
      ) {
        const canonicalInOut = out.filter((p) =>
          isFatigueAnchorTitle(p.title, ctx)
        ).length;
        if (canonicalInOut >= MAX_CANONICAL_PICKS_FATIGUE) continue;
      }
      if (
        bucket === "discovery" &&
        isDiscoveryCanonTitle(pick.title)
      ) {
        const canonInOut = out.filter((p) => isDiscoveryCanonTitle(p.title)).length;
        if (canonInOut >= MAX_DISCOVERY_CANON_PICKS) continue;
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
      (ctx?.antiSafePickFatigue || ctx?.magicalRediscovery) &&
      isFatigueAnchorTitle(pick.title, ctx) &&
      out.filter((p) => isFatigueAnchorTitle(p.title, ctx)).length >=
        MAX_CANONICAL_PICKS_FATIGUE
    ) {
      continue;
    }
    if (
      isDiscoveryCanonTitle(pick.title) &&
      out.filter((p) => isDiscoveryCanonTitle(p.title)).length >=
        MAX_DISCOVERY_CANON_PICKS
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
  let discoveryCanonCount = 0;
  let famousIndieCount = 0;
  const capped: DiversityPick[] = [];
  for (const pick of out) {
    if (capped.length >= 6) break;
    if (isDiscoveryGemTitle(pick.title) && !isDiscoveryCanonTitle(pick.title)) {
      if (discoveryCount >= MAX_DISCOVERY_PICKS_IN_RESPONSE) continue;
      discoveryCount += 1;
    }
    if (isDiscoveryCanonTitle(pick.title)) {
      if (discoveryCanonCount >= MAX_DISCOVERY_CANON_PICKS) continue;
      discoveryCanonCount += 1;
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
  if (ctx.magicalRediscovery) {
    lines.push(
      "- User wants memorable / magical / special games that restore love for gaming — NOT hidden gems. Mix acclaimed classics, ambitious games, and unique experiences (e.g. Outer Wilds, Portal 2, NieR, Yakuza, Subnautica, Mass Effect, Tunic) — avoid clustering narrative indie safe picks OR curator-default discovery darlings (NORCO, Pentiment, Citizen Sleeper).",
      "- Include at most 1–2 discovery-style picks when they clearly fit; do not fill the list with Reddit-hidden-gem canon."
    );
  }
  if (ctx.obscureDiscovery) {
    lines.push(
      "- Hidden gem / underrated / under-the-radar / not-usual-indie prompt: do NOT recommend famous indie canon (Hollow Knight, Undertale, Celeste, Journey, Edith Finch, Oxenfree, Night in the Woods, Gris, A Short Hike, Firewatch, Life is Strange, Stardew Valley, Disco Elysium, The Beginner's Guide) unless the user explicitly names them.",
      "- Hidden gem means lower-awareness but still high-quality — steer toward less mainstream acclaimed titles, not Reddit-default indie icons or curator darlings repeated in every list.",
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
