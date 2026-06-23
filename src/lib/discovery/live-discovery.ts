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

// Famous picks to hard-avoid for Hidden Gems (the page is about overlooked games).
// Normalised substring match against the RAWG title.
const FAMOUS_TITLE_BLOCKLIST = [
  "red dead redemption",
  "the witcher 3",
  "witcher 3",
  "elden ring",
  "grand theft auto",
  "gta v",
  "skyrim",
  "the elder scrolls v",
  "cyberpunk 2077",
  "hades",
  "hollow knight",
  "celeste",
  "stardew valley",
  "undertale",
  "terraria",
  // A few more obvious blockbusters so admin testing stays "hidden"-flavoured.
  "god of war",
  "the last of us",
  "minecraft",
  "fortnite",
  "counter-strike",
  "dota 2",
  "baldur's gate 3",
  "portal 2",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isFamous(name: string): boolean {
  const n = normalize(name);
  return FAMOUS_TITLE_BLOCKLIST.some((bad) => n.includes(normalize(bad)));
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

function toHiddenGemPick(c: RawgCandidate): HiddenGemPick | null {
  const image = candidateImage(c);
  if (!image) return null;
  const genre = primaryGenre(c).toLowerCase();
  return {
    id: `rawg-${c.id}`,
    title: c.name,
    slug: c.name.toLowerCase(),
    image,
    reason: `A ${genre} that flew under the radar — ${qualityPhrase(c)}, with a strong identity worth discovering beyond the usual recommendations.`,
    bestFor: `Players hunting for overlooked ${genre} gems with real character.`,
    skipIf: "You only play the biggest mainstream AAA releases.",
    standoutElement: `Distinctive ${genre} with a clear point of view, ${qualityPhrase(c)}.`,
    tags: topTags(c),
    discoveryCategory: assignHiddenCategory(c),
    gameId: c.id,
    rating: typeof c.rating === "number" ? c.rating : null,
    released: c.released ?? null,
    sourceNote: "Live RAWG candidate (admin testing). Price enrichment not wired yet.",
  };
}

/**
 * Real "hidden gem" candidates: acclaimed (high metacritic / rating) but
 * mid/low popularity (so not the obvious blockbusters), with the famous-title
 * blocklist applied. Returns null → caller uses the static curated list.
 */
export async function getLiveHiddenGemPicks(): Promise<
  { featured: HiddenGemPick; picks: HiddenGemPick[] } | null
> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return null;

  try {
    const [byMetacritic, byRating] = await Promise.all([
      fetchRawgGamesList({
        rawgApiKey,
        query: {
          metacritic: "80,100",
          ordering: "-metacritic",
          page_size: "40",
          exclude_additions: "true",
        },
      }),
      fetchRawgGamesList({
        rawgApiKey,
        query: {
          metacritic: "78,96",
          ordering: "-rating",
          page_size: "40",
          exclude_additions: "true",
        },
      }),
    ]);

    const deduped = dedupeCandidates([...byMetacritic, ...byRating]);

    const filtered = deduped.filter((c) => {
      if (!candidateImage(c)) return false;
      if (isLowQualityTitle(c.name)) return false;
      if (isFamous(c.name)) return false;
      // "good rating"
      if (typeof c.rating === "number" && c.rating < 3.6) return false;
      // lower / mid popularity — drop blockbusters (added is users-who-own).
      const added = typeof c.added === "number" ? c.added : 0;
      if (added > 12000) return false;
      if (added > 0 && added < 30) return false; // avoid near-empty entries
      return true;
    });

    // Diversify across discovery categories so the grid isn't all one type.
    const ordered = diversifyByKey(filtered, (c) => assignHiddenCategory(c));

    const picks = ordered.map(toHiddenGemPick).filter(notNullPick);
    if (picks.length < 7) return null;

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
