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
  "civilization", "total war", "football manager", "nier",
];

// Famous indie classics — exact normalized title match (short/common words).
const BLOCKED_EXACT_TITLES = [
  "hades", "hades ii", "hollow knight", "celeste", "stardew valley", "undertale",
  "deltarune", "terraria", "cuphead", "dead cells", "slay the spire",
  "the binding of isaac", "binding of isaac", "limbo", "inside", "journey",
  "firewatch", "gris", "ori and the blind forest", "ori and the will of the wisps",
];

function isBlockedTitle(name: string): boolean {
  const n = normalize(name);
  if (BLOCKED_FRANCHISE_SUBSTRINGS.some((bad) => n.includes(normalize(bad)))) {
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

function qualityPhrase(c: RawgCandidate): string {
  if (typeof c.metacritic === "number" && c.metacritic > 0) {
    return `critically praised (Metacritic ${c.metacritic})`;
  }
  if (typeof c.rating === "number" && c.rating > 0) {
    return `well-rated by players (${c.rating.toFixed(1)}/5)`;
  }
  return "well-regarded by the people who played it";
}

// ---------------------------------------------------------------------------
// Hidden Gems
// ---------------------------------------------------------------------------

function assignHiddenCategory(c: RawgCandidate): HiddenGemCategory {
  const blob = metaBlob(c);
  if (/horror/.test(blob)) return "Cult favorites";
  if (/role playing|rpg/.test(blob)) return "Underplayed RPGs";
  if (/visual novel|story|narrative|interactive fiction/.test(blob)) return "Story-first discoveries";
  if (/puzzle|souls like|difficult|roguelike|roguelite/.test(blob)) return "Difficult but rewarding";
  if (/casual|relaxing|cozy|wholesome|cute/.test(blob)) return "Cozy hidden picks";
  if (/short|atmospheric/.test(blob)) return "Short unforgettable games";
  if (/experimental|unique|surreal|sandbox/.test(blob)) return "Experimental mechanics";
  return "Weird but brilliant";
}

// Category-based reason/standout copy — NO "critically praised (Metacritic XX)"
// line (absurd for famous games, and Metacritic is no longer how we pick).
const HIDDEN_GEM_REASON_BY_CATEGORY: Record<HiddenGemCategory, string> = {
  "Weird but brilliant":
    "An unusual genre mix that doesn't fit the normal store categories — strange, specific, and easy to miss.",
  "Underplayed RPGs":
    "A systems-heavy RPG with a small but devoted audience rather than mainstream reach.",
  "Short unforgettable games":
    "A compact, story-driven experience that rewards curiosity in a single sitting.",
  "Cult favorites":
    "A cult pick with a loyal niche following that most players never stumble onto.",
  "Experimental mechanics":
    "Built around one unusual mechanic you won't find in the big-name releases.",
  "Story-first discoveries":
    "A narrative game with a specific mood and voice that most players overlook.",
  "Cozy hidden picks":
    "A quiet, low-stress game that slipped past the mainstream spotlight.",
  "Difficult but rewarding":
    "A demanding game with a hard-earned payoff that never went mainstream.",
};

const HIDDEN_GEM_STANDOUT_BY_CATEGORY: Record<HiddenGemCategory, string> = {
  "Weird but brilliant": "A genuinely strange premise executed with conviction.",
  "Underplayed RPGs": "Deep systems and choices with a cult-sized audience.",
  "Short unforgettable games": "Says what it needs to and ends before it overstays.",
  "Cult favorites": "The kind of game its small fanbase won't stop recommending.",
  "Experimental mechanics": "One distinctive mechanic the whole game is built around.",
  "Story-first discoveries": "Writing and mood over spectacle.",
  "Cozy hidden picks": "Calm, characterful, and quietly absorbing.",
  "Difficult but rewarding": "Punishing at first, deeply satisfying once it clicks.",
};

function toHiddenGemPick(c: RawgCandidate): HiddenGemPick | null {
  const image = candidateImage(c);
  if (!image) return null;
  const genre = primaryGenre(c).toLowerCase();
  const category = assignHiddenCategory(c);
  return {
    id: `rawg-${c.id}`,
    title: c.name,
    slug: c.name.toLowerCase(),
    image,
    reason: HIDDEN_GEM_REASON_BY_CATEGORY[category],
    bestFor: `Players hunting for overlooked ${genre} games with a strong identity.`,
    skipIf: "You only play the biggest mainstream AAA and famous indie releases.",
    standoutElement: HIDDEN_GEM_STANDOUT_BY_CATEGORY[category],
    tags: topTags(c),
    discoveryCategory: category,
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
const HIDDEN_GEM_QUERY_POOLS: Array<Record<string, string>> = [
  { genres: "indie", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "indie", ordering: "-rating", page_size: "40", page: "2", exclude_additions: "true" },
  { genres: "adventure", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "puzzle", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "role-playing-games-rpg", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "strategy", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { genres: "simulation", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { tags: "atmospheric", ordering: "-rating", page_size: "40", exclude_additions: "true" },
  { tags: "story-rich", ordering: "-rating", page_size: "40", exclude_additions: "true" },
];

// Popularity ceilings — anything above is "too mainstream" to be a hidden gem.
const HIDDEN_GEM_MAX_ADDED = 9000;
const HIDDEN_GEM_MIN_ADDED = 80;
const HIDDEN_GEM_MAX_RATINGS_COUNT = 2500;
const HIDDEN_GEM_MIN_RATINGS_COUNT = 40;
const HIDDEN_GEM_MAX_REVIEWS_COUNT = 900;
const HIDDEN_GEM_MAX_SUGGESTIONS_COUNT = 500;
const HIDDEN_GEM_MAX_METACRITIC = 89; // 90+ = universally-known classic → reject
const HIDDEN_GEM_MIN_RATING = 3.6;
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
 * Real "hidden gem" candidates: overlooked / cult / lesser-known. Pulled from
 * niche genre/tag pools, filtered by popularity caps + a famous-title blocklist,
 * scored by underexposure (not Metacritic), then validated. If fewer than
 * HIDDEN_GEM_MIN_PICKS survive, returns null → caller uses the static curated
 * list (better to show fewer good gems than famous filler).
 */
export async function getLiveHiddenGemPicks(): Promise<
  { featured: HiddenGemPick; picks: HiddenGemPick[] } | null
> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return null;

  try {
    const pools = await Promise.all(
      HIDDEN_GEM_QUERY_POOLS.map((query) => fetchRawgGamesList({ rawgApiKey, query }))
    );
    const deduped = dedupeCandidates(pools.flat());

    const filtered = deduped.filter((c) => {
      if (!candidateImage(c)) return false;
      if (isLowQualityTitle(c.name)) return false;
      if (isBlockedTitle(c.name)) return false; // famous franchises + indie classics

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
    const ordered = diversifyByKey(scored, (c) => assignHiddenCategory(c));

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
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Games of the Week
// ---------------------------------------------------------------------------

function assignWeeklyCategory(c: RawgCandidate): WeeklyCategory {
  const blob = metaBlob(c);
  if (/co op|cooperative|multiplayer|online co op/.test(blob)) return "Co-op pick";
  if (/story|narrative|visual novel|interactive fiction/.test(blob)) return "Story pick";
  if (/short|atmospheric/.test(blob)) return "Short weekend game";
  if (/indie/.test(blob)) return "Hidden pick";
  return "New & interesting";
}

function toWeeklyGamePick(c: RawgCandidate): WeeklyGamePick | null {
  const image = candidateImage(c);
  if (!image) return null;
  const genre = primaryGenre(c).toLowerCase();
  const year = releaseYear(c);
  return {
    id: `rawg-week-${c.id}`,
    title: c.name,
    slug: c.name.toLowerCase(),
    image,
    category: assignWeeklyCategory(c),
    whyThisWeek: `A recent ${genre} worth a look right now${year ? ` (released ${year})` : ""} — ${qualityPhrase(c)}, fresh and easy to recommend this week.`,
    bestFor: `Players who want something new and distinctive in ${genre}.`,
    tags: topTags(c),
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
 * Real "this week" candidates: recent releases with decent quality, mixed across
 * categories. Deal/price fields are left optional (no reliable RAWG→store deal
 * mapping). Returns null → caller uses the static curated list.
 */
export async function getLiveWeeklyGamePicks(): Promise<
  { featured: WeeklyGamePick; picks: WeeklyGamePick[] } | null
> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return null;

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

    const ordered = diversifyByKey(filtered, (c) => assignWeeklyCategory(c));

    const picks = ordered.map(toWeeklyGamePick).filter(notNullWeekly);
    if (picks.length < 6) return null;

    return {
      featured: picks[0],
      picks: picks.slice(1, 10),
    };
  } catch {
    return null;
  }
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
