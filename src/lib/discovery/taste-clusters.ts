import "server-only";

import { searchRawgByTitle, type RawgCandidate } from "@/lib/rawg-discovery";
import type { UserTasteProfile } from "@/lib/discovery/user-taste-profile";

/**
 * Taste clustering for the premium personalization generators.
 *
 * PROBLEM this solves: the generators used to reference ONE anchor — the single
 * most-played Steam game — for every recommendation ("Picked for the same taste
 * that put 621h into 7 Days to Die"), even for games with little relation to it.
 * That overfits the heaviest title and reads as generic.
 *
 * APPROACH: model the user's library as MULTIPLE gameplay clusters (survival,
 * RPG, simulation, horror, shooter, …) and let each candidate pick the MOST
 * RELEVANT anchor by SHARED GAMEPLAY DIMENSIONS — so a horror pick references
 * Phasmophobia, an RPG pick references Fallout, a sim pick references Farming
 * Simulator, and a soulslike references nothing in a survival-heavy library
 * rather than being forced onto 7 Days to Die.
 *
 * It reuses the EXISTING RAWG integration to read genre/tag metadata for the
 * user's owned games (best-effort, bounded) and a GENERAL gameplay taxonomy
 * (mechanics/genre keywords — NOT per-title hardcoding) to classify both owned
 * games and candidates. No new client/key, no schema, no UI, no architecture
 * change — just better scoring + reasons.
 */

// ---------------------------------------------------------------------------
// Gameplay dimension taxonomy (general — keyed on genre/tag keywords, never on
// specific titles). Each dimension carries a human "noun" (for "your most-played
// X") and a "facet" describing the gameplay emphasis the reason should name.
// ---------------------------------------------------------------------------

export type GameplayDimension =
  | "survival"
  | "sandbox"
  | "exploration"
  | "rpg"
  | "simulation"
  | "horror"
  | "shooter"
  | "coop"
  | "narrative"
  | "strategy"
  | "challenge";

type DimensionMeta = { noun: string; facet: string; keywords: string[] };

// Keywords are matched as substrings against a normalized "genres + tags" blob.
// They are deliberately specific (e.g. shooter uses "gunplay"/"fps", NOT the
// broad word "action") so a melee soulslike doesn't get mislabeled a shooter.
const DIMENSIONS: Record<GameplayDimension, DimensionMeta> = {
  survival: {
    noun: "survival games",
    facet: "resource management, crafting, and survival systems",
    keywords: [
      "survival",
      "crafting",
      "base building",
      "base-building",
      "open world survival craft",
      "hunger",
      "zombie",
      "looter",
    ],
  },
  sandbox: {
    noun: "sandbox games",
    facet: "open-ended, emergent, systems-driven play",
    keywords: ["sandbox", "voxel", "physics", "moddable", "automation", "emergent", "building"],
  },
  exploration: {
    noun: "open-world games",
    facet: "exploration and player freedom",
    keywords: ["open world", "exploration", "adventure", "atmospheric", "post-apocalyptic"],
  },
  rpg: {
    noun: "RPGs",
    facet: "open-ended progression and build-driven choices",
    keywords: [
      "rpg",
      "role-playing",
      "role playing",
      "character customization",
      "choices matter",
      "story rich",
      "loot",
      "leveling",
      "multiple endings",
      "perks",
      "skill tree",
    ],
  },
  simulation: {
    noun: "simulation games",
    facet: "long-term progression and management depth",
    keywords: [
      "simulation",
      "management",
      "tycoon",
      "economy",
      "farming",
      "agriculture",
      "business",
      "life sim",
      "resource management",
      "city builder",
    ],
  },
  horror: {
    noun: "horror games",
    facet: "atmosphere and tension over action",
    keywords: [
      "horror",
      "survival horror",
      "psychological horror",
      "lovecraftian",
      "supernatural",
      "dark",
      "gore",
    ],
  },
  shooter: {
    noun: "shooters",
    facet: "moment-to-moment gunplay",
    keywords: [
      "shooter",
      "first-person shooter",
      "fps",
      "third-person shooter",
      "gunplay",
      "firearms",
      "looter shooter",
      "military shooter",
    ],
  },
  coop: {
    noun: "co-op games",
    facet: "co-op play and shared sessions with friends",
    keywords: [
      "co-op",
      "co op",
      "cooperative",
      "online co-op",
      "multiplayer",
      "team-based",
      "massively multiplayer",
    ],
  },
  narrative: {
    noun: "story-driven games",
    facet: "story and character over spectacle",
    keywords: ["story rich", "narrative", "choices matter", "great soundtrack", "cinematic", "visual novel"],
  },
  strategy: {
    noun: "strategy games",
    facet: "tactical decision-making and planning",
    keywords: [
      "strategy",
      "tactical",
      "turn-based",
      "turn based",
      "real-time strategy",
      "rts",
      "grand strategy",
      "4x",
      "tower defense",
    ],
  },
  challenge: {
    noun: "challenging games",
    facet: "demanding, skill-based challenge",
    keywords: [
      "difficult",
      "souls-like",
      "soulslike",
      "souls like",
      "roguelike",
      "roguelite",
      "permadeath",
      "hardcore",
      "bullet hell",
    ],
  },
};

const ALL_DIMENSIONS = Object.keys(DIMENSIONS) as GameplayDimension[];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function variant<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.trunc(seed)) % arr.length];
}

/**
 * Classify a game's gameplay dimensions from its RAWG genres + tags. Genre hits
 * weigh more than tag hits (a primary genre is a stronger signal than a long-tail
 * tag). Returns only dimensions with a hit.
 */
function classify(genres: string[], tags: string[]): Map<GameplayDimension, number> {
  const genreBlob = norm(genres.join(" "));
  const tagBlob = norm(tags.join(" "));
  const out = new Map<GameplayDimension, number>();
  for (const dim of ALL_DIMENSIONS) {
    let weight = 0;
    for (const kw of DIMENSIONS[dim].keywords) {
      if (genreBlob.includes(kw)) weight += 2;
      else if (tagBlob.includes(kw)) weight += 1;
    }
    if (weight > 0) out.set(dim, weight);
  }
  return out;
}

/** Public: classify a candidate the same way owned games are classified. */
export function candidateDimensions(genres: string[], tags: string[]): Map<GameplayDimension, number> {
  return classify(genres, tags);
}

function cosine(a: Map<GameplayDimension, number>, b: Map<GameplayDimension, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  for (const [k, v] of a) {
    const w = b.get(k);
    if (w) dot += v * w;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function pickBestTitleMatch(list: RawgCandidate[], title: string): RawgCandidate | null {
  if (list.length === 0) return null;
  const target = norm(title);
  const exact = list.find((c) => norm(c.name) === target);
  if (exact) return exact;
  const withMeta = list.find((c) => (c.genres?.length ?? 0) + (c.tags?.length ?? 0) > 0);
  return withMeta ?? list[0];
}

// ---------------------------------------------------------------------------
// model
// ---------------------------------------------------------------------------

export type TasteAnchor = {
  title: string;
  hours: number;
  /** log-scaled playtime so a 600h game leads without crushing a 150h one. */
  playWeight: number;
  dims: Map<GameplayDimension, number>;
  primary: GameplayDimension | null;
};

export type TasteClusters = {
  anchors: TasteAnchor[];
  /** playWeight-weighted dimension totals across the whole library. */
  dimensionTotals: Map<GameplayDimension, number>;
  /** false → caller should use its generic (non-anchored) fallback reason. */
  available: boolean;
};

export type AnchorMatch = {
  anchor: TasteAnchor;
  /** shared dimensions, strongest first. */
  sharedDims: GameplayDimension[];
  /** cosine overlap of dimension vectors, 0..1. */
  fit: number;
};

const MAX_ANCHORS = 8;
const MIN_ANCHOR_OVERLAP = 0.12;

/**
 * Build the user's taste clusters from their most-played Steam games. Enriches
 * each with real RAWG genre/tag metadata (best-effort, bounded to the top games
 * by playtime) and classifies it into gameplay dimensions. Returns
 * `available: false` on any shortfall so callers fall back gracefully.
 */
export async function buildTasteClusters(
  profile: UserTasteProfile,
  rawgApiKey: string | undefined
): Promise<TasteClusters> {
  const empty: TasteClusters = { anchors: [], dimensionTotals: new Map(), available: false };
  if (!rawgApiKey) return empty;

  const owned = profile.favoriteGames
    .filter((g) => g.source === "steam")
    .sort((a, b) => (b.playtimeMin ?? 0) - (a.playtimeMin ?? 0))
    .slice(0, MAX_ANCHORS);
  if (owned.length === 0) return empty;

  try {
    const enriched = await Promise.all(
      owned.map(async (g) => {
        const list = await searchRawgByTitle({ rawgApiKey, title: g.title, pageSize: 3 }).catch(
          () => [] as RawgCandidate[]
        );
        const best = pickBestTitleMatch(list, g.title);
        const dims = classify(
          (best?.genres ?? []).map((x) => x.name),
          (best?.tags ?? []).map((x) => x.name)
        );
        return { title: g.title, hours: Math.round((g.playtimeMin ?? 0) / 60), dims };
      })
    );

    const anchors: TasteAnchor[] = [];
    const dimensionTotals = new Map<GameplayDimension, number>();
    for (const e of enriched) {
      if (e.dims.size === 0) continue; // no usable metadata → not an anchor
      const playWeight = Math.log1p(Math.max(0, e.hours));
      const primary = [...e.dims.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      anchors.push({ title: e.title, hours: e.hours, playWeight, dims: e.dims, primary });
      for (const [dim, w] of e.dims) {
        dimensionTotals.set(dim, (dimensionTotals.get(dim) ?? 0) + w * (0.5 + playWeight));
      }
    }

    return { anchors, dimensionTotals, available: anchors.length > 0 };
  } catch {
    return empty;
  }
}

/**
 * Choose the owned game whose gameplay dimensions best match a candidate. Overlap
 * dominates; playtime gently tilts ties toward stronger evidence; an optional
 * `usage` map applies a diminishing penalty so the SAME anchor isn't cited for
 * every pick when a comparable alternative exists. Returns null when nothing
 * clears the minimum overlap (→ caller uses a generic reason, never a forced one).
 */
export function chooseAnchor(
  clusters: TasteClusters,
  candDims: Map<GameplayDimension, number>,
  usage?: Map<string, number>
): AnchorMatch | null {
  if (!clusters.available || candDims.size === 0) return null;
  const maxPlay = Math.max(1, ...clusters.anchors.map((a) => a.playWeight));

  let best: AnchorMatch | null = null;
  let bestScore = -Infinity;
  for (const anchor of clusters.anchors) {
    const overlap = cosine(anchor.dims, candDims);
    if (overlap < MIN_ANCHOR_OVERLAP) continue;
    const playNorm = anchor.playWeight / maxPlay;
    const used = usage?.get(anchor.title) ?? 0;
    const score = overlap * (0.7 + 0.3 * playNorm) - used * 0.12;
    if (score > bestScore) {
      bestScore = score;
      const sharedDims = [...candDims.keys()]
        .filter((d) => anchor.dims.has(d))
        .sort(
          (x, y) =>
            (anchor.dims.get(y) ?? 0) * (candDims.get(y) ?? 0) -
            (anchor.dims.get(x) ?? 0) * (candDims.get(x) ?? 0)
        );
      best = { anchor, sharedDims, fit: overlap };
    }
  }
  return best;
}

/** How strongly the candidate's dimensions are represented in the library, 0..1. */
function coverageScore(clusters: TasteClusters, candDims: Map<GameplayDimension, number>): number {
  const total = [...clusters.dimensionTotals.values()].reduce((s, v) => s + v, 0);
  if (total <= 0) return 0;
  const candMag = [...candDims.values()].reduce((s, v) => s + v, 0) || 1;
  let coverage = 0;
  for (const [dim, v] of candDims) {
    const lib = clusters.dimensionTotals.get(dim) ?? 0;
    coverage += (lib / total) * (v / candMag);
  }
  return clamp01(coverage * 2.5);
}

/**
 * Overall taste fit, 0..1 — best-anchor overlap (primary) blended with library
 * coverage. Pass a precomputed `match` (from chooseAnchor) to avoid recomputing.
 */
export function tasteFitScore(
  clusters: TasteClusters,
  candDims: Map<GameplayDimension, number>,
  match?: AnchorMatch | null
): number {
  if (!clusters.available || candDims.size === 0) return 0;
  const anchorFit = (match === undefined ? chooseAnchor(clusters, candDims) : match)?.fit ?? 0;
  const coverage = coverageScore(clusters, candDims);
  return clamp01(anchorFit * 0.65 + coverage * 0.35);
}

/** Compact, AI-friendly description of a chosen anchor (for prompt hints). */
export function describeMatch(match: AnchorMatch): {
  title: string;
  hours: number;
  anchorNoun: string;
  facets: string[];
} {
  const dims = match.sharedDims.length ? match.sharedDims : match.anchor.primary ? [match.anchor.primary] : [];
  return {
    title: match.anchor.title,
    hours: match.anchor.hours,
    anchorNoun: match.anchor.primary ? DIMENSIONS[match.anchor.primary].noun : "games",
    facets: dims.slice(0, 2).map((d) => DIMENSIONS[d].facet),
  };
}

/**
 * Deterministic, individually-written reasons grounded in the MOST RELEVANT
 * anchor and the shared gameplay emphasis — never the same single game for every
 * pick, never generic reputation filler. Used when the AI explainer is
 * unavailable (the AI path gets the same anchor as a hint).
 */
export function contextualReasons(match: AnchorMatch, seed: number): string[] {
  const facetDim = match.sharedDims[0] ?? match.anchor.primary;
  const facet = facetDim ? DIMENSIONS[facetDim].facet : "the same kind of experience";
  const anchorNoun = match.anchor.primary ? DIMENSIONS[match.anchor.primary].noun : "games";
  const t = match.anchor.title;
  const h = match.anchor.hours;

  const primaryTemplates =
    h >= 2
      ? [
          `Because ${t} is one of your most-played ${anchorNoun}, this leans into the same ${facet}.`,
          `You've put ${h}h into ${t}, and this recommendation carries that same ${facet}.`,
          `Since ${t} is one of your top ${anchorNoun}, this continues that ${facet}.`,
        ]
      : [
          `Because ${t} sits in your library, this leans into the same ${facet}.`,
          `${t} is in your library, and this recommendation continues that ${facet}.`,
        ];

  const reasons = [variant(primaryTemplates, seed)];

  const secondDim = match.sharedDims[1];
  if (secondDim) {
    reasons.push(`It also lines up with the ${DIMENSIONS[secondDim].facet} you keep coming back to.`);
  }
  return reasons.slice(0, 2);
}
