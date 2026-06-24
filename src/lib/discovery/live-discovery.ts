import "server-only";

import {
  dedupeCandidates,
  fetchRawgGamesList,
  isLowQualityTitle,
  type RawgCandidate,
} from "@/lib/rawg-discovery";
import {
  type HiddenGemCategory,
  type HiddenGemPick,
  type WeeklyCategory,
  type WeeklyGamePick,
} from "@/lib/discovery/curated-picks";

/**
 * Admin-only live discovery data for /hidden-gems and /games-of-the-week.
 *
 * Uses the EXISTING RAWG integration (rawg-discovery.ts + RAWG_API_KEY) — no new
 * API client, env var, key, DB, or cron. OpenAI is NOT used; reasons come from
 * deterministic templates. ITAD/price enrichment is intentionally skipped here
 * (RAWG→store mapping isn't reliable enough), so price fields are left optional.
 *
 * Everything is best-effort: any failure, a missing key, or too few good
 * candidates → returns null, and the page falls back to the existing static data.
 */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Hidden Gems must be overlooked/cult/lesser-known — never famous classics. Two
// layers: distinctive franchise tokens (substring match) + famous standalone
// titles that are short/common words (exact normalized match, to avoid false
// positives like "Inside My Radio" matching "inside").

// Famous franchises / mega-IPs — substring match on the normalized title.
const BLOCKED_FRANCHISE_SUBSTRINGS = [
  "mario", "luigi", "zelda", "pokemon", "grand theft auto", "gta v", "gta iv",
  "red dead", "elder scrolls", "skyrim", "oblivion", "morrowind", "fallout",
  "half life", "metal gear", "final fantasy", "resident evil", "assassins creed",
  "call of duty", "halo", "god of war", "witcher", "dark souls", "demons souls",
  "elden ring", "bloodborne", "sekiro", "armored core", "persona", "monster hunter",
  "sonic the", "sonic mania", "sonic frontiers", "tekken", "street fighter",
  "mortal kombat", "soulcalibur", "soul calibur", "kirby", "donkey kong", "metroid",
  "splatoon", "animal crossing", "mario kart", "super smash", "gran turismo",
  "uncharted", "the last of us", "horizon zero", "horizon forbidden",
  "ghost of tsushima", "spider man", "ratchet", "gears of war", "forza",
  "starfield", "minecraft", "fortnite", "counter strike", "dota", "league of legends",
  "valorant", "overwatch", "apex legends", "diablo", "warcraft", "starcraft",
  "hearthstone", "fifa", "madden", "nba 2k", "the sims", "cyberpunk 2077",
  "batman arkham", "far cry", "watch dogs", "tomb raider", "hitman", "deus ex",
  "dishonored", "bioshock", "borderlands", "mass effect", "dragon age",
  "baldurs gate", "kingdom hearts", "dragon quest", "yakuza", "like a dragon",
  "devil may cry", "bayonetta", "crash bandicoot", "spyro", "prince of persia",
  "need for speed", "saints row", "dead space", "left 4 dead", "team fortress",
  "destiny 2", "warframe", "path of exile", "death stranding", "sid meier",
  "civilization", "total war", "football manager", "nier", "pikmin",
  // Highly-visible titles / press darlings / hyped recent + upcoming games that
  // an average gamer following indie/game news has almost certainly heard of —
  // never "hidden" (substring match catches editions/spin-offs too).
  "split fiction", "it takes two", "clair obscur", "expedition 33", "ultrakill",
  "silksong", "disco elysium", "outer wilds", "life is strange", "edith finch",
  // Viral / award-winning puzzle + roguelike darlings — widely known, so not
  // hidden gems even though they're "indie" (substring catches sequels/editions).
  "inscryption", "baba is you", "monument valley", "tunic", "cocoon",
  "animal well", "balatro", "vampire survivors", "lethal company", "papers please",
];

// "Old but famous" publisher/franchise classics — a Hidden Gem is NEVER a
// well-known console classic that younger players merely missed. The candidate
// pool has no publisher field, so these are title/franchise tokens (substring
// match, so editions/sequels/spin-offs are caught too). Hidden Gems only.
const BLOCKED_VISIBILITY_SUBSTRINGS = [
  // Rockstar (publisher) — title-based (GTA / Red Dead already above).
  "rockstar", "bully", "manhunt", "max payne", "midnight club", "l a noire", "la noire",
  // Nintendo first-party / closely associated major IPs (most are above; these
  // are the older/less-obvious ones that slip past the popularity caps).
  "nintendo", "fire emblem", "professor layton", "xenoblade", "star fox",
  "earthbound", "advance wars", "golden sun", "f zero", "punch out", "wario",
  "yoshi", "kid icarus", "captain toad", "luigis mansion",
  // Famous console classics / long-running franchises (widely known even if old).
  "castlevania", "mega man", "megaman", "metal slug", "double dragon",
  "ninja gaiden", "silent hill", "onimusha", "shenmue", "shadow of the colossus",
  "katamari", "jak and daxter", "sly cooper", "ape escape", "twisted metal",
  "tony hawk", "burnout paradise",
];

// Famous indie classics / press darlings — exact normalized title match
// (short/common words where a substring match would over-reject).
const BLOCKED_EXACT_TITLES = [
  "hades", "hades ii", "hollow knight", "celeste", "stardew valley", "undertale",
  "deltarune", "terraria", "cuphead", "dead cells", "slay the spire",
  "the binding of isaac", "binding of isaac", "limbo", "inside", "journey",
  "firewatch", "gris", "ori and the blind forest", "ori and the will of the wisps",
];

export function isBlockedTitle(name: string): boolean {
  const n = normalize(name);
  if (
    BLOCKED_FRANCHISE_SUBSTRINGS.some((bad) => n.includes(normalize(bad))) ||
    BLOCKED_VISIBILITY_SUBSTRINGS.some((bad) => n.includes(normalize(bad)))
  ) {
    return true;
  }
  return BLOCKED_EXACT_TITLES.some((t) => normalize(t) === n);
}

function candidateImage(c: RawgCandidate): string | undefined {
  return c.background_image || c.image_fallback || undefined;
}

function metaBlob(c: RawgCandidate): string {
  const genres = (c.genres ?? []).map((g) => g.name).join(" ");
  const tags = (c.tags ?? []).map((t) => t.name).join(" ");
  return normalize(`${genres} ${tags}`);
}

function primaryGenre(c: RawgCandidate): string {
  const g = c.genres?.[0]?.name;
  if (g) return g;
  return "game";
}

function topTags(c: RawgCandidate, limit = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...(c.genres ?? []), ...(c.tags ?? [])]) {
    const name = t?.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= limit) break;
  }
  return out;
}

function releaseYear(c: RawgCandidate): string | null {
  const m = c.released?.match(/^(\d{4})/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Hidden Gems
// ---------------------------------------------------------------------------

export function assignHiddenCategory(c: RawgCandidate): HiddenGemCategory {
  const blob = metaBlob(c);
  if (/horror/.test(blob)) return "Cult favorites";
  // Narrative / adventure / point-and-click / detective games are story-first —
  // check these BEFORE "puzzle" so a point-and-click mystery (which RAWG tags
  // with "puzzle") isn't mislabeled "Difficult but rewarding".
  if (
    /visual novel|interactive fiction|point and click|point-and-click|adventure|detective|mystery|narrative|story rich|story-rich|story/.test(
      blob
    )
  )
    return "Story-first discoveries";
  if (/role playing|rpg|tactical|tactics|turn based|turn-based/.test(blob)) return "Underplayed RPGs";
  // "Difficult but rewarding" requires an ACTUAL difficulty signal — not merely
  // the presence of puzzles (most adventure/puzzle games are not "punishing").
  if (/souls|soulslike|souls like|difficult|brutal|hardcore|punishing|bullet hell|permadeath/.test(blob))
    return "Difficult but rewarding";
  if (/casual|relaxing|cozy|wholesome|cute/.test(blob)) return "Cozy hidden picks";
  if (/puzzle|logic|experimental|unique|surreal|sandbox|abstract|physics/.test(blob))
    return "Experimental mechanics";
  if (/short|atmospheric/.test(blob)) return "Short unforgettable games";
  return "Weird but brilliant";
}

// Category-based reason/standout copy — NO "critically praised (Metacritic XX)"
// line (absurd for famous games, and Metacritic is no longer how we pick).
//
// Each category has SEVERAL variants; the deterministic generator rotates between
// them by candidate id so the fallback list doesn't read as the same sentence
// repeated. (The AI curator overrides this copy when it's available.)
const HIDDEN_GEM_REASON_VARIANTS: Record<HiddenGemCategory, string[]> = {
  "Weird but brilliant": [
    "An unusual genre mix that doesn't fit the normal store categories — strange, specific, and easy to miss.",
    "Too odd to market and too good to ignore — the kind of swing that slips past the algorithm.",
  ],
  "Underplayed RPGs": [
    "A systems-heavy RPG with a small but devoted audience rather than mainstream reach.",
    "Real build depth and reactivity, but without the marketing budget that usually gets an RPG noticed.",
  ],
  "Short unforgettable games": [
    "A compact, focused experience that rewards curiosity in a single sitting.",
    "Short by design — it makes its point cleanly and leaves before it wears out its welcome.",
  ],
  "Cult favorites": [
    "A cult pick with a loyal niche following that most players never stumble onto.",
    "It never broke through to the mainstream, but the people who found it tend to stay obsessed.",
  ],
  "Experimental mechanics": [
    "Built around one unusual mechanic you won't find in the big-name releases.",
    "A single bold idea taken further than a bigger studio would have risked.",
  ],
  "Story-first discoveries": [
    "A narrative game with a specific mood and voice that most players overlook.",
    "Writing-led and atmosphere-first — quiet enough that it never got the audience it earned.",
  ],
  "Cozy hidden picks": [
    "A quiet, low-stress game that slipped past the mainstream spotlight.",
    "Gentle, unhurried, and easy to miss between the louder releases.",
  ],
  "Difficult but rewarding": [
    "A demanding game with a hard-earned payoff that never went mainstream.",
    "Steep on purpose — it asks for real effort and pays it back once it clicks.",
  ],
};

const HIDDEN_GEM_HOOK_VARIANTS: Record<HiddenGemCategory, string[]> = {
  "Weird but brilliant": [
    "A genuinely strange premise executed with conviction.",
    "Unclassifiable in the best way.",
  ],
  "Underplayed RPGs": [
    "Deep systems and choices with a cult-sized audience.",
    "More mechanical depth than its install base suggests.",
  ],
  "Short unforgettable games": [
    "Says what it needs to and ends before it overstays.",
    "One sitting, long afterglow.",
  ],
  "Cult favorites": [
    "Quietly beloved by the few who found it.",
    "A small, fiercely loyal following for a reason.",
  ],
  "Experimental mechanics": [
    "One distinctive mechanic the whole game is built around.",
    "A mechanic you haven't seen done quite this way.",
  ],
  "Story-first discoveries": [
    "Writing and mood over spectacle.",
    "Character and place doing the heavy lifting.",
  ],
  "Cozy hidden picks": [
    "Calm, characterful, and quietly absorbing.",
    "Low-stakes, easy to sink into.",
  ],
  "Difficult but rewarding": [
    "Punishing at first, deeply satisfying once it clicks.",
    "Earns every win it gives you.",
  ],
};

const HIDDEN_GEM_WHOFOR_VARIANTS = [
  (genre: string) => `Players hunting for overlooked ${genre} games with a strong identity.`,
  (genre: string) => `Anyone who has run dry on the famous ${genre} picks and wants something fresher.`,
  (genre: string) => `Curious players who'd rather find a ${genre} nobody's told them about yet.`,
];

/** Deterministic variant pick — same candidate always yields the same copy. */
function variant<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export function toHiddenGemPick(c: RawgCandidate): HiddenGemPick | null {
  const image = candidateImage(c);
  if (!image) return null;
  const genre = primaryGenre(c).toLowerCase();
  const category = assignHiddenCategory(c);
  const seed = c.id;

  const whyHidden = variant(HIDDEN_GEM_REASON_VARIANTS[category], seed);
  const hook = variant(HIDDEN_GEM_HOOK_VARIANTS[category], seed + 1);
  const whoFor = variant(HIDDEN_GEM_WHOFOR_VARIANTS, seed + 2)(genre);

  // Confidence tracks the hidden-gem score (underexposure + quality + uniqueness)
  // so it VARIES per pick instead of a flat 60 — a stronger candidate reads as a
  // more confident pick. Bounded to a conservative deterministic range.
  const confidence = Math.max(45, Math.min(78, Math.round(46 + hiddenGemScore(c) * 0.32)));

  return {
    id: `rawg-${c.id}`,
    title: c.name,
    slug: c.name.toLowerCase(),
    image,
    reason: whyHidden,
    bestFor: whoFor,
    skipIf: "You only play the biggest mainstream AAA and famous indie releases.",
    standoutElement: hook,
    tags: topTags(c),
    discoveryCategory: category,
    // Explicit editorial fields (always populated so the deterministic path also
    // satisfies the curation contract / validation).
    hook,
    whyHidden,
    whoFor,
    discoveryTag: category,
    confidence,
    gameId: c.id,
    rating: typeof c.rating === "number" ? c.rating : null,
    released: c.released ?? null,
    sourceNote:
      "Live RAWG candidate (admin testing) — selected for underexposure, not Metacritic.",
  };
}

// --- Hidden Gems candidate strategy + thresholds ---------------------------
// Pull from NICHE genre/tag pools ordered by rating (NOT metacritic-descending,
// which surfaced all-time classics). Heavy popularity caps + blocklist then keep
// only genuinely overlooked games.
//
// The pools intentionally span SEVERAL niches and reach into the TAIL of each
// (multiple pages), because ordering by -rating alone surfaces the all-time
// classics at the top — those get blocked, so a single page left only a thin
// pool. Deeper pages + more niches widen the funnel to 40-100 real candidates
// before the AI curator ever sees them.
const HIDDEN_GEM_QUERY_POOLS: Array<Record<string, string>> = [
  // Small/medium indie quality — reach pages 1-3 for the overlooked tail.
  { genres: "indie", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "indie", ordering: "-rating", page_size: "40", page: "2", exclude_additions: "true" },
  { genres: "indie", ordering: "-rating", page_size: "40", page: "3", exclude_additions: "true" },
  // Older overlooked adventure / narrative.
  { genres: "adventure", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "adventure", ordering: "-rating", page_size: "40", page: "2", exclude_additions: "true" },
  // Lesser-known puzzle / experimental.
  { genres: "puzzle", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "puzzle", ordering: "-rating", page_size: "40", page: "2", exclude_additions: "true" },
  // Underplayed RPGs.
  { genres: "role-playing-games-rpg", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "role-playing-games-rpg", ordering: "-rating", page_size: "40", page: "2", exclude_additions: "true" },
  // Overlooked strategy / tactics.
  { genres: "strategy", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "strategy", ordering: "-rating", page_size: "40", page: "2", exclude_additions: "true" },
  // Niche simulation.
  { genres: "simulation", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  // Cult / mood / experimental tag pools.
  { tags: "atmospheric", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { tags: "story-rich", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { tags: "cult-classic", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { tags: "surreal", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { tags: "tactical", ordering: "-rating", page_size: "40", exclude_additions: "true" },
];

// Popularity ceilings — anything above is "too mainstream" to be a hidden gem.
// These are deliberately MODERATE rather than tight: the franchise/visibility
// blocklist (above) is the primary "is this famous?" filter, and the score below
// pushes the most-overlooked candidates to the top. Caps that were too tight
// collapsed the pool to single digits, forcing the fallback. A genuinely niche
// game can still have ~15-20k RAWG "adds" without being a household name.
const HIDDEN_GEM_MAX_ADDED = 20000;
const HIDDEN_GEM_MIN_ADDED = 60;
const HIDDEN_GEM_MAX_RATINGS_COUNT = 5000;
const HIDDEN_GEM_MIN_RATINGS_COUNT = 30;
const HIDDEN_GEM_MAX_REVIEWS_COUNT = 1600;
const HIDDEN_GEM_MAX_SUGGESTIONS_COUNT = 700;
const HIDDEN_GEM_MAX_METACRITIC = 92; // 93+ = universally-known classic → reject
const HIDDEN_GEM_MIN_RATING = 3.4;
const HIDDEN_GEM_MIN_PICKS = 8; // else fall back to static curated (no famous filler)

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

const UNIQUE_TAG_HINTS = [
  "surreal", "experimental", "psychological", "weird", "unusual", "atmospheric",
  "narrative", "story rich", "immersive sim", "detective", "hand drawn",
  "nonlinear", "unique", "cult", "abstract", "minimalist", "time loop",
  "metroidvania", "roguelite", "deckbuild", "tactical", "point and click",
];

function uniquenessScore(c: RawgCandidate): number {
  const blob = metaBlob(c);
  let hits = 0;
  for (const h of UNIQUE_TAG_HINTS) if (blob.includes(h)) hits += 1;
  const tagDiversity = clamp01(((c.genres?.length ?? 0) + (c.tags?.length ?? 0)) / 12);
  return clamp01((hits / 4) * 0.7 + tagDiversity * 0.3);
}

/**
 * Hidden-gem score — prioritises UNDEREXPOSURE + uniqueness, NOT Metacritic.
 * Higher = better hidden gem.
 */
function hiddenGemScore(c: RawgCandidate): number {
  const rating = typeof c.rating === "number" ? c.rating : 0;
  const added = typeof c.added === "number" ? c.added : 0;
  const rc = typeof c.ratings_count === "number" ? c.ratings_count : 0;

  const underexposure = added > 0 ? clamp01(1 - added / HIDDEN_GEM_MAX_ADDED) : 0.6;
  const nicheReviews = rc > 0 ? clamp01(1 - rc / HIDDEN_GEM_MAX_RATINGS_COUNT) : 0.6;
  const quality = clamp01(rating / 5);
  const uniqueness = uniquenessScore(c);

  let score = underexposure * 40 + nicheReviews * 20 + quality * 20 + uniqueness * 20;

  // Metacritic is rewarded only mildly, and damped as it nears "classic" territory.
  const mc = typeof c.metacritic === "number" ? c.metacritic : 0;
  if (mc >= 85) score -= (mc - 84) * 2.5;

  // Extra dampening as popularity approaches the caps (mainstream penalty).
  if (added > HIDDEN_GEM_MAX_ADDED * 0.7) score -= 12;
  if (rc > HIDDEN_GEM_MAX_RATINGS_COUNT * 0.7) score -= 8;

  return score;
}

/**
 * Build the ordered RAWG candidate pool for Hidden Gems: pull from niche
 * genre/tag pools, dedupe, apply popularity caps + the famous-title blocklist,
 * score by underexposure (not Metacritic), and diversify across categories.
 *
 * This is the shared candidate pool consumed by BOTH the deterministic
 * generator below and the AI curator (ai-curator.ts). Returns [] on any failure
 * or when RAWG isn't configured, so every caller can fall back gracefully.
 */
export async function getHiddenGemCandidatePool(): Promise<RawgCandidate[]> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return [];

  try {
    const pools = await Promise.all(
      HIDDEN_GEM_QUERY_POOLS.map((query) => fetchRawgGamesList({ rawgApiKey, query }))
    );
    const deduped = dedupeCandidates(pools.flat());

    const now = Date.now();
    const filtered = deduped.filter((c) => {
      if (!candidateImage(c)) return false;
      if (isLowQualityTitle(c.name)) return false;
      if (isBlockedTitle(c.name)) return false; // famous franchises + indie classics

      // A hidden gem has to have actually shipped and had time to be overlooked.
      // Reject unreleased / TBA and not-yet-released (highly-anticipated) titles.
      const releasedAt = c.released ? Date.parse(c.released) : NaN;
      if (!Number.isFinite(releasedAt)) return false;
      if (releasedAt > now) return false;

      const rating = typeof c.rating === "number" ? c.rating : 0;
      if (rating > 0 && rating < HIDDEN_GEM_MIN_RATING) return false;

      const added = typeof c.added === "number" ? c.added : 0;
      if (added > HIDDEN_GEM_MAX_ADDED) return false; // too mainstream
      if (added > 0 && added < HIDDEN_GEM_MIN_ADDED) return false; // near-empty

      const rc = typeof c.ratings_count === "number" ? c.ratings_count : 0;
      if (rc > HIDDEN_GEM_MAX_RATINGS_COUNT) return false; // too popular
      if (rc > 0 && rc < HIDDEN_GEM_MIN_RATINGS_COUNT) return false; // too obscure/junk

      const reviews = typeof c.reviews_count === "number" ? c.reviews_count : 0;
      if (reviews > HIDDEN_GEM_MAX_REVIEWS_COUNT) return false;

      const suggestions = typeof c.suggestions_count === "number" ? c.suggestions_count : 0;
      if (suggestions > HIDDEN_GEM_MAX_SUGGESTIONS_COUNT) return false;

      const mc = typeof c.metacritic === "number" ? c.metacritic : 0;
      if (mc > HIDDEN_GEM_MAX_METACRITIC) return false; // 90+ = universally-known classic

      return true;
    });

    // Rank by underexposure/uniqueness, then diversify across discovery categories.
    const scored = filtered
      .map((c) => ({ c, score: hiddenGemScore(c) }))
      .sort((a, b) => b.score - a.score)
      .map((s) => s.c);
    return diversifyByKey(scored, (c) => assignHiddenCategory(c));
  } catch {
    return [];
  }
}

/**
 * Real "hidden gem" candidates: overlooked / cult / lesser-known. Uses the
 * shared candidate pool above, then a final blocklist pass. If fewer than
 * HIDDEN_GEM_MIN_PICKS survive, returns null → caller uses the static curated
 * list (better to show fewer good gems than famous filler). Deterministic copy
 * (no OpenAI) — the AI curator is layered on top in generate-rotation.ts.
 */
export async function getLiveHiddenGemPicks(): Promise<
  { featured: HiddenGemPick; picks: HiddenGemPick[] } | null
> {
  const ordered = await getHiddenGemCandidatePool();
  if (ordered.length === 0) return null;

  // Build picks, then a final validation pass (belt-and-braces) drops anything
  // that still matches a blocked franchise/title keyword.
  const picks = ordered
    .map(toHiddenGemPick)
    .filter(notNullPick)
    .filter((p) => !isBlockedTitle(p.title));

  if (picks.length < HIDDEN_GEM_MIN_PICKS) return null; // → static curated fallback

  return {
    featured: picks[0],
    picks: picks.slice(1, 13),
  };
}

// ---------------------------------------------------------------------------
// Games of the Week
// ---------------------------------------------------------------------------

export function assignWeeklyCategory(c: RawgCandidate): WeeklyCategory {
  const blob = metaBlob(c);
  if (/co op|cooperative|multiplayer|online co op/.test(blob)) return "Co-op pick";
  if (/story|narrative|visual novel|interactive fiction/.test(blob)) return "Story pick";
  if (/short|atmospheric/.test(blob)) return "Short weekend game";
  if (/indie/.test(blob)) return "Hidden pick";
  return "New & interesting";
}

export function toWeeklyGamePick(c: RawgCandidate): WeeklyGamePick | null {
  const image = candidateImage(c);
  if (!image) return null;
  const genre = primaryGenre(c).toLowerCase();
  const year = releaseYear(c);
  const whoFor = `Players who want something new and distinctive in ${genre}.`;
  // Avoid generic filler ("worth a look", etc.) — give a concrete this-week angle.
  const whyThisWeek = year
    ? `Released ${year}, this ${genre} is still flying under the radar — a fresh pick to catch up on while it is new.`
    : `A newer ${genre} that is still flying under the radar — a fresh pick to catch up on this week.`;
  return {
    id: `rawg-week-${c.id}`,
    title: c.name,
    slug: c.name.toLowerCase(),
    image,
    category: assignWeeklyCategory(c),
    whyThisWeek,
    bestFor: whoFor,
    tags: topTags(c),
    // Explicit editorial fields (always populated for the deterministic path).
    hook: `A recent ${genre} still flying under the radar.`,
    reasonType: "new-release",
    whoFor,
    confidence: 55,
    gameId: c.id,
    rating: typeof c.rating === "number" ? c.rating : null,
    released: c.released ?? null,
    sourceNote: "Live RAWG candidate (admin testing). Deal data not wired yet.",
  };
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Build the ordered RAWG candidate pool for Games of the Week: recent releases
 * (last 150 days) with decent quality, mixed across categories. Shared by the
 * deterministic generator below and the AI curator. Returns [] on failure / no
 * RAWG key.
 */
export async function getWeeklyCandidatePool(): Promise<RawgCandidate[]> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return [];

  try {
    const today = new Date();
    const from = new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000);
    const dates = `${ymd(from)},${ymd(today)}`;

    const [byAdded, byRating] = await Promise.all([
      fetchRawgGamesList({
        rawgApiKey,
        query: {
          dates,
          ordering: "-added",
          page_size: "40",
          exclude_additions: "true",
        },
      }),
      fetchRawgGamesList({
        rawgApiKey,
        query: {
          dates,
          ordering: "-rating",
          page_size: "40",
          exclude_additions: "true",
        },
      }),
    ]);

    const deduped = dedupeCandidates([...byAdded, ...byRating]);

    const filtered = deduped.filter((c) => {
      if (!candidateImage(c)) return false;
      if (isLowQualityTitle(c.name)) return false;
      // Recent games often have few ratings — accept rating OR some signal.
      const rating = typeof c.rating === "number" ? c.rating : 0;
      const ratingsCount = typeof c.ratings_count === "number" ? c.ratings_count : 0;
      if (rating > 0 && rating < 3.0) return false;
      if (rating === 0 && ratingsCount < 3) return false;
      return true;
    });

    return diversifyByKey(filtered, (c) => assignWeeklyCategory(c));
  } catch {
    return [];
  }
}

/**
 * Real "this week" candidates: recent releases with decent quality, mixed across
 * categories. Deal/price fields are left optional (no reliable RAWG→store deal
 * mapping). Returns null → caller uses the static curated list. Deterministic
 * copy (no OpenAI).
 */
export async function getLiveWeeklyGamePicks(): Promise<
  { featured: WeeklyGamePick; picks: WeeklyGamePick[] } | null
> {
  const ordered = await getWeeklyCandidatePool();
  if (ordered.length === 0) return null;

  const picks = ordered.map(toWeeklyGamePick).filter(notNullWeekly);
  if (picks.length < 6) return null;

  return {
    featured: picks[0],
    picks: picks.slice(1, 10),
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Interleave candidates so consecutive picks tend to differ by category. */
function diversifyByKey(
  candidates: RawgCandidate[],
  keyOf: (c: RawgCandidate) => string
): RawgCandidate[] {
  const buckets = new Map<string, RawgCandidate[]>();
  for (const c of candidates) {
    const k = keyOf(c);
    const arr = buckets.get(k) ?? [];
    arr.push(c);
    buckets.set(k, arr);
  }
  const queues = Array.from(buckets.values());
  const out: RawgCandidate[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) {
      const next = q.shift();
      if (next) {
        out.push(next);
        added = true;
      }
    }
  }
  return out;
}

function notNullPick(p: HiddenGemPick | null): p is HiddenGemPick {
  return p !== null;
}

function notNullWeekly(p: WeeklyGamePick | null): p is WeeklyGamePick {
  return p !== null;
}
