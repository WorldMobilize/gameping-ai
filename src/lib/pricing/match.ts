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

/** Stripped from the end of titles during pricing normalization (store/edition noise). */
export const PRICING_TRAILING_NOISE_WORDS = new Set([
  ...TITLE_NOISE_WORDS,
  "beta",
  "alpha",
  "prologue",
  "chapter",
  "upgrade",
  "soundtrack",
  "demo",
  "dlc",
  "expansion",
  "remaster",
  "redux",
  "vr",
]);

export function normalizeTitleForMatch(title: string) {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trailing marketing / subtitle noise (whole suffix only). Safe: does not touch sequel markers like
 * "II", "2", or distinctive tokens ("Two", "Finals") — only removes known generic tail phrases so
 * "Gold Rush: The Game" aligns with "Gold Rush" without lowering numeric gate thresholds.
 */
const WEAK_PRICING_SUBTITLE_PHRASES_SORTED: string[] = [
  "game of the year edition",
  "definitive edition",
  "ultimate edition",
  "complete edition",
  "deluxe edition",
  "standard edition",
  "goty edition",
  "video game",
  "the game",
].sort((a, b) => b.length - a.length);

export function stripWeakPricingSubtitlePhrases(normalizedSpaced: string): string {
  let s = normalizedSpaced.replace(/\s+/g, " ").trim();
  if (!s) return "";

  const minRemainderChars = 3;
  const minRemainderWords = 1;

  let prev = "";
  while (s !== prev) {
    prev = s;
    for (const phrase of WEAK_PRICING_SUBTITLE_PHRASES_SORTED) {
      if (!phrase) continue;
      const tail = ` ${phrase}`;
      let next: string | null = null;
      if (s.endsWith(tail)) {
        next = s.slice(0, s.length - tail.length).replace(/\s+$/, "").replace(/[\s:]+$/g, "").trim();
      } else if (s === phrase) {
        next = "";
      }
      if (next === null) continue;

      const words = next.split(/\s/).filter(Boolean);
      if (next.length < minRemainderChars || words.length < minRemainderWords) continue;

      const lastTok = words[words.length - 1] ?? "";
      if (
        words.length === 1 &&
        lastTok.length < 4 &&
        !/^\d+$/.test(lastTok) &&
        !/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(lastTok)
      ) {
        continue;
      }

      s = next;
      break;
    }
  }

  return s.replace(/\s+/g, " ").trim();
}

/**
 * Strong normalization for pricing: punctuation stripped, weak subtitle tails removed, then
 * repeated trailing edition/store tokens removed.
 */
export function normalizeTitleForPricing(title: string): string {
  const s = stripWeakPricingSubtitlePhrases(normalizeTitleForMatch(title));
  if (!s) return "";
  let tokens = s.split(/\s/).filter(Boolean);
  let prev = "";
  while (tokens.length > 0 && tokens.join(" ") !== prev) {
    prev = tokens.join(" ");
    const last = tokens[tokens.length - 1];
    if (PRICING_TRAILING_NOISE_WORDS.has(last)) {
      tokens = tokens.slice(0, -1);
      continue;
    }
    break;
  }
  return tokens.join(" ").trim();
}

/** Short / generic catalog titles need exact normalized matches for trusted buy links. */
export function isShortGenericGameTitle(requestedTitle: string): boolean {
  const n = normalizeTitleForPricing(requestedTitle);
  if (!n) return true;
  const compact = n.replace(/\s+/g, "");
  const words = n.split(/\s/).filter(Boolean);
  return words.length <= 2 || compact.length <= 10;
}

/**
 * False-positive pairs: "Raft" vs "Raft Wars", "The Forest" vs "Sons of the Forest".
 */
export function isSuspiciousPricingPair(requestedNorm: string, matchedNorm: string): boolean {
  if (!requestedNorm || !matchedNorm) return true;
  if (requestedNorm === matchedNorm) return false;

  const rt = requestedNorm.split(/\s/).filter(Boolean);
  const mt = matchedNorm.split(/\s/).filter(Boolean);

  if (rt.length === 1 && mt.length > 1 && mt[0] === rt[0]) {
    return true;
  }

  if (
    rt.length >= 2 &&
    matchedNorm.endsWith(requestedNorm) &&
    mt.length > rt.length &&
    matchedNorm !== requestedNorm
  ) {
    return true;
  }

  if (
    rt.length >= 2 &&
    matchedNorm.includes(requestedNorm) &&
    !matchedNorm.startsWith(requestedNorm) &&
    mt.length > rt.length
  ) {
    return true;
  }

  return false;
}

export type PricingGateEvaluation = {
  requestedNorm: string;
  matchedNorm: string;
  score: number;
  isShortTitle: boolean;
  acceptedPrice: boolean;
  trustedUrl: boolean;
  reason: string;
};

/** Longest first so multi-word phrases win over single tokens (e.g. "sea wolf pack" vs "pack"). */
const FORBIDDEN_LISTING_TERMS_SORTED: string[] = [
  "sea wolf pack",
  "deluxe upgrade",
  "supporter pack",
  "character pack",
  "content pack",
  "starter pack",
  "founders pack",
  "founder pack",
  "season pass",
  "soundtrack",
  "artbook",
  "expansion",
  "cosmetic",
  "add on",
  "addon",
  "bundle",
  "upgrade",
  "dlc",
  "pack",
  "demo",
  "prologue",
  "skin",
].sort((a, b) => b.length - a.length);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWordsSpaced(title: string) {
  return normalizeTitleForMatch(title).replace(/\s+/g, " ").trim();
}

/**
 * True if `norm` contains full phrase or whole-word token `term` (after normalization).
 */
function listingContainsTerm(norm: string, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return false;
  const n = norm.replace(/\s+/g, " ").trim();
  if (t.includes(" ")) {
    return ` ${n} `.includes(` ${t} `);
  }
  return new RegExp(`(^| )${escapeRegex(t)}( |$)`).test(n);
}

/**
 * If the matched listing signals DLC/pack/add-on etc. and the request does not, return the term hit.
 */
function findForbiddenListingTermMismatch(
  requestedTitle: string,
  matchedTitle: string
): string | null {
  const req = normalizeWordsSpaced(requestedTitle);
  const mat = normalizeWordsSpaced(matchedTitle);
  for (const term of FORBIDDEN_LISTING_TERMS_SORTED) {
    if (!listingContainsTerm(mat, term)) continue;
    if (listingContainsTerm(req, term)) continue;
    return term;
  }
  return null;
}

/**
 * Conservative: matched listing has more tokens after the base title (DLC subtitle, expansion name, etc.).
 */
function hasExtraListingSuffixBeyondRequested(
  requestedTitle: string,
  matchedTitle: string
): boolean {
  const req = normalizeWordsSpaced(requestedTitle);
  const mat = normalizeWordsSpaced(matchedTitle);
  if (!req || !mat || req === mat) return false;
  return mat.startsWith(`${req} `);
}

/** Temporary detailed pricing logs: non-production builds or explicit `debug` from callers. */
export function shouldLogPricingDetailDebug(debug?: boolean): boolean {
  if (typeof process === "undefined") return Boolean(debug);
  return process.env.NODE_ENV !== "production" || Boolean(debug);
}

/**
 * Stable human-grep labels for aggregate pricing debug rows (does not affect gating).
 * Pass `deduped: true` when this row was dropped as a duplicate in the display pipeline.
 */
export function pricingExplicitRejectionLabel(
  gate: PricingGateEvaluation,
  extra?: { deduped?: boolean }
): string | null {
  if (extra?.deduped) return "rejected_because_duplicate";
  if (!gate.acceptedPrice) {
    if (gate.reason === "dlc_or_addon" || gate.reason === "extra_suffix_not_base_game") {
      return "rejected_because_dlc_soundtrack_demo";
    }
    if (gate.reason === "suspicious_partial_or_spinoff_match") {
      return "rejected_because_suspicious_pair";
    }
    if (gate.reason === "long_title_below_min_score") {
      return "rejected_because_title_score_threshold";
    }
    return null;
  }
  if (!gate.trustedUrl) {
    return "rejected_because_no_trusted_url";
  }
  return null;
}

const TITLE_MATCH_SHOW_PRICE_MIN = 0.72;
const TITLE_MATCH_TRUST_DEAL_URL_MIN = 0.85;

/**
 * Decides whether a provider row may show price and/or a trusted deal URL for recommend/checkout.
 */
export function evaluatePricingGate(params: {
  requestedTitle: string;
  matchedTitle: string;
  dealUrl?: string | null;
  /** For dev logs only (e.g. cache:cheapshark, cheapshark, itad). */
  provider?: string | null;
}): PricingGateEvaluation {
  const { requestedTitle, matchedTitle } = params;
  const dealUrl = params.dealUrl?.trim() ?? "";
  const matchedTrim = (matchedTitle ?? "").trim();

  const requestedNorm = normalizeTitleForPricing(requestedTitle);
  if (!matchedTrim) {
    return {
      requestedNorm,
      matchedNorm: "",
      score: 0,
      isShortTitle: isShortGenericGameTitle(requestedTitle),
      acceptedPrice: false,
      trustedUrl: false,
      reason: "empty_matched_title",
    };
  }

  const matchedNorm = normalizeTitleForPricing(matchedTrim);

  const forbiddenTerm = findForbiddenListingTermMismatch(requestedTitle, matchedTrim);
  if (forbiddenTerm) {
    return {
      requestedNorm,
      matchedNorm,
      score: 0,
      isShortTitle: isShortGenericGameTitle(requestedTitle),
      acceptedPrice: false,
      trustedUrl: false,
      reason: "dlc_or_addon",
    };
  }

  if (hasExtraListingSuffixBeyondRequested(requestedTitle, matchedTrim)) {
    return {
      requestedNorm,
      matchedNorm,
      score: 0,
      isShortTitle: isShortGenericGameTitle(requestedTitle),
      acceptedPrice: false,
      trustedUrl: false,
      reason: "extra_suffix_not_base_game",
    };
  }

  let score = titleMatchScore(requestedTitle, matchedTrim);

  const isShortTitle = isShortGenericGameTitle(requestedTitle);
  const suspicious = isSuspiciousPricingPair(requestedNorm, matchedNorm);

  if (suspicious) {
    score = Math.min(score, 0.5);
    return {
      requestedNorm,
      matchedNorm,
      score,
      isShortTitle,
      acceptedPrice: false,
      trustedUrl: false,
      reason: "suspicious_partial_or_spinoff_match",
    };
  }

  if (isShortTitle) {
    if (requestedNorm === matchedNorm) {
      const hasUrl = Boolean(dealUrl);
      return {
        requestedNorm,
        matchedNorm,
        score,
        isShortTitle,
        acceptedPrice: true,
        trustedUrl: hasUrl,
        reason: hasUrl
          ? "short_title_exact_norm_match"
          : "short_title_exact_norm_match_no_deal_url",
      };
    }
    return {
      requestedNorm,
      matchedNorm,
      score,
      isShortTitle,
      acceptedPrice: false,
      trustedUrl: false,
      reason: "short_title_non_exact_reject_price",
    };
  }

  const acceptedPrice = score >= TITLE_MATCH_SHOW_PRICE_MIN;
  const trustedUrl =
    acceptedPrice && score >= TITLE_MATCH_TRUST_DEAL_URL_MIN && Boolean(dealUrl);

  return {
    requestedNorm,
    matchedNorm,
    score,
    isShortTitle,
    acceptedPrice,
    trustedUrl,
    reason: acceptedPrice
      ? trustedUrl
        ? "long_title_score_ok_trusted_url"
        : "long_title_price_only_no_trusted_url_band"
      : "long_title_below_min_score",
  };
}

export function containsBadWords(title: string) {
  const t = normalizeTitleForMatch(title);
  return CHEAPSHARK_BAD_WORDS.some((w) => t.includes(w));
}

function titleTokensForMatch(title: string) {
  const t = stripWeakPricingSubtitlePhrases(normalizeTitleForMatch(title));
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
  const aNorm = stripWeakPricingSubtitlePhrases(normalizeTitleForMatch(requestedTitle));
  const bNorm = stripWeakPricingSubtitlePhrases(normalizeTitleForMatch(candidateTitle));
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

