import "server-only";

import { searchRawgByTitle, type RawgCandidate } from "@/lib/rawg-discovery";
import type { UserTasteProfile } from "@/lib/discovery/user-taste-profile";

/**
 * Taste clustering for the premium personalization generators.
 *
 * Models the user's library as MULTIPLE gameplay clusters (survival, RPG,
 * simulation, horror, shooter, …) and lets each candidate pick the most relevant
 * anchor by shared gameplay — so a horror pick references Phasmophobia, an RPG
 * pick references Fallout, a sim pick references Farming Simulator.
 *
 * TRUTHFULNESS (this revision): reasons must never invent a similarity.
 *   - Two-layer model per game: a loose `classify` vector (for OVERLAP scoring)
 *     and a STRICT `assertableFeatures` set (the only features a reason may name).
 *   - A match requires the candidate's DOMINANT, assertable gameplay to be shared
 *     with the anchor — not a vague secondary overlap. A soulslike won't anchor to
 *     a survival sandbox; a single-player game is never described as co-op.
 *   - Match score is ceilinged by real overlap strength (a great game with weak
 *     overlap stays a weak fit), and weak matches are flagged as lighter/adjacent.
 *
 * Reuses the EXISTING RAWG integration to read genre/tag metadata for owned games
 * (best-effort, bounded). No new client/key, no schema, no UI, no architecture
 * change — scoring + reasons only.
 */

// ---------------------------------------------------------------------------
// Gameplay dimension taxonomy (general — genre/tag keywords, never per-title).
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

type DimensionMeta = { noun: string; facet: string; label: string; keywords: string[] };

// `keywords` drive the loose OVERLAP vector only. They are intentionally a bit
// generous so genuinely related games match; what a reason is ALLOWED to say is
// governed separately by `assertableFeatures` (below), which is strict.
const DIMENSIONS: Record<GameplayDimension, DimensionMeta> = {
  survival: {
    noun: "survival games",
    facet: "resource management, crafting, and survival systems",
    label: "survival/crafting",
    keywords: ["survival", "crafting", "base building", "base-building", "hunger", "zombie", "looter"],
  },
  sandbox: {
    noun: "sandbox games",
    facet: "open-ended, emergent, systems-driven play",
    label: "sandbox/emergent",
    // "building" removed — farming/city sims build too; it over-matched.
    keywords: ["sandbox", "voxel", "physics", "moddable", "automation", "emergent"],
  },
  exploration: {
    noun: "open-world games",
    facet: "open-world exploration and player freedom",
    label: "open-world exploration",
    // "atmospheric"/"adventure" removed — atmosphere is not exploration (RE7).
    keywords: ["open world", "exploration", "post-apocalyptic", "metroidvania"],
  },
  rpg: {
    noun: "RPGs",
    facet: "open-ended progression and build variety",
    label: "RPG build variety",
    keywords: [
      "rpg",
      "role-playing",
      "role playing",
      "character customization",
      "choices matter",
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
    label: "simulation/management",
    keywords: [
      "simulation",
      "management",
      "tycoon",
      "economy",
      "farming",
      "agriculture",
      "business",
      "life sim",
      "city builder",
    ],
  },
  horror: {
    noun: "horror games",
    facet: "atmosphere and tension over action",
    label: "horror/tension",
    keywords: ["horror", "survival horror", "psychological horror", "lovecraftian", "supernatural", "gore"],
  },
  shooter: {
    noun: "shooters",
    facet: "moment-to-moment gunplay",
    label: "shooter/gunplay",
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
    label: "co-op/multiplayer",
    keywords: ["co-op", "co op", "cooperative", "online co-op", "local co-op", "multiplayer", "team-based"],
  },
  narrative: {
    noun: "story-driven games",
    facet: "story and character over spectacle",
    label: "story-rich",
    keywords: ["story rich", "story-rich", "narrative", "great soundtrack", "cinematic", "visual novel"],
  },
  strategy: {
    noun: "strategy games",
    facet: "tactical decision-making and planning",
    label: "strategy/tactics",
    keywords: ["strategy", "tactical", "turn-based", "turn based", "real-time strategy", "rts", "grand strategy", "4x", "tower defense"],
  },
  challenge: {
    noun: "challenging games",
    facet: "demanding, skill-based challenge",
    label: "high-difficulty challenge",
    keywords: ["difficult", "souls-like", "soulslike", "souls like", "roguelike", "roguelite", "permadeath", "hardcore", "bullet hell"],
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

function hasAny(blob: string, kws: string[]): boolean {
  return kws.some((k) => blob.includes(k));
}

/** Loose dimension vector — for OVERLAP scoring only (genre hits weigh 2, tags 1). */
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

/**
 * STRICT assertable features — the ONLY gameplay a reason may attribute to this
 * game. Much tighter than `classify`: it refuses features the game doesn't truly
 * have (e.g. co-op for a single-player title, build freedom for a soulslike,
 * exploration for a linear/atmospheric one).
 */
export function assertableFeatures(genres: string[], tags: string[]): Set<GameplayDimension> {
  const blob = norm([...genres, ...tags].join(" "));
  const out = new Set<GameplayDimension>();

  const linear = blob.includes("linear");
  const openWorld = blob.includes("open world");
  const soulsLike = hasAny(blob, ["souls-like", "soulslike", "souls like"]);

  if (blob.includes("survival")) out.add("survival");

  if (
    blob.includes("sandbox") ||
    blob.includes("emergent") ||
    (openWorld && hasAny(blob, ["building", "crafting", "physics", "automation", "voxel"]))
  ) {
    out.add("sandbox");
  }

  // Open-world exploration / freedom — never for linear or merely "atmospheric".
  if (!linear && hasAny(blob, ["open world", "exploration", "metroidvania"])) out.add("exploration");

  // Build freedom requires real build signals AND must not be a soulslike (those
  // are tagged "RPG" but have a fixed build/combat style — e.g. Sekiro).
  const buildSignals = hasAny(blob, [
    "character customization",
    "skill tree",
    "talent tree",
    "choices matter",
    "multiple endings",
    "perks",
    "character build",
    "build variety",
    "class-based",
  ]);
  const rpgWithDepth =
    hasAny(blob, ["rpg", "role-playing", "role playing"]) &&
    hasAny(blob, ["open world", "loot", "character customization", "choices matter"]);
  if (!soulsLike && (buildSignals || rpgWithDepth)) out.add("rpg");

  if (hasAny(blob, ["simulation", "management", "tycoon", "farming", "agriculture", "life sim", "city builder", "business sim"])) {
    out.add("simulation");
  }

  if (blob.includes("horror")) out.add("horror");

  if (hasAny(blob, ["shooter", "fps", "first-person shooter", "gunplay", "looter shooter"])) out.add("shooter");

  // Co-op specifically (shared sessions) — NOT bare "multiplayer" (could be PvP).
  if (hasAny(blob, ["co-op", "co op", "cooperative", "online co-op", "local co-op"])) out.add("coop");

  if (hasAny(blob, ["story rich", "story-rich", "narrative", "visual novel"])) out.add("narrative");

  if (hasAny(blob, ["strategy", "tactical", "turn-based", "turn based", "real-time strategy", "rts", "grand strategy", "4x"])) {
    out.add("strategy");
  }

  if (hasAny(blob, ["souls-like", "soulslike", "souls like", "difficult", "roguelike", "roguelite", "permadeath", "bullet hell"])) {
    out.add("challenge");
  }

  return out;
}

/** Human labels for assertable features (fed to the AI as the allowed claim set). */
export function featureLabels(features: Set<GameplayDimension>): string[] {
  return [...features].map((d) => DIMENSIONS[d].label);
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

/** Top-tier (dominant) dimensions — the game's defining gameplay, not minor tags. */
function dominantDims(dims: Map<GameplayDimension, number>): Set<GameplayDimension> {
  const out = new Set<GameplayDimension>();
  if (dims.size === 0) return out;
  const max = Math.max(...dims.values());
  for (const [d, w] of dims) if (w >= max * 0.8) out.add(d);
  return out;
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
  assertable: Set<GameplayDimension>;
  primary: GameplayDimension | null;
};

export type TasteClusters = {
  anchors: TasteAnchor[];
  dimensionTotals: Map<GameplayDimension, number>;
  available: boolean;
};

export type AnchorMatch = {
  anchor: TasteAnchor;
  /** all shared dims (strongest first) — for scoring context. */
  sharedDims: GameplayDimension[];
  /** dims the candidate can TRUTHFULLY be said to share (dominant + assertable first). */
  assertableShared: GameplayDimension[];
  /** cosine overlap of dimension vectors, 0..1. */
  fit: number;
  /** weak/adjacent overlap → frame honestly, cap the score. */
  weak: boolean;
};

export function candidateDimensions(genres: string[], tags: string[]): Map<GameplayDimension, number> {
  return classify(genres, tags);
}

const MAX_ANCHORS = 8;
const MIN_ANCHOR_OVERLAP = 0.12;
const WEAK_OVERLAP = 0.4;
/** Variety only breaks genuine near-ties — never displaces a clearly-better anchor. */
const TIE_BAND = 0.08;

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
        const genres = (best?.genres ?? []).map((x) => x.name);
        const tags = (best?.tags ?? []).map((x) => x.name);
        return {
          title: g.title,
          hours: Math.round((g.playtimeMin ?? 0) / 60),
          dims: classify(genres, tags),
          assertable: assertableFeatures(genres, tags),
        };
      })
    );

    const anchors: TasteAnchor[] = [];
    const dimensionTotals = new Map<GameplayDimension, number>();
    for (const e of enriched) {
      if (e.dims.size === 0) continue;
      const playWeight = Math.log1p(Math.max(0, e.hours));
      const primary = [...e.dims.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      anchors.push({ title: e.title, hours: e.hours, playWeight, dims: e.dims, assertable: e.assertable, primary });
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
 * Choose the anchor by REAL gameplay overlap. A match is only allowed when the
 * candidate's DOMINANT, assertable gameplay is shared with the anchor (so we
 * never anchor on a vague secondary tag). Overlap always dominates; variety only
 * breaks near-ties, so a clearly-better anchor (e.g. 7 Days to Die for a survival
 * pick) is never displaced. Returns null → caller uses an honest generic reason.
 */
export function chooseAnchor(
  clusters: TasteClusters,
  candDims: Map<GameplayDimension, number>,
  candAssertable: Set<GameplayDimension>,
  usage?: Map<string, number>
): AnchorMatch | null {
  if (!clusters.available || candDims.size === 0) return null;

  // The candidate's defining gameplay that it can TRUTHFULLY be said to have.
  const core = [...dominantDims(candDims)].filter((d) => candAssertable.has(d));
  if (core.length === 0) return null;

  const eligible = clusters.anchors
    .filter((a) => core.some((d) => a.dims.has(d)))
    .map((anchor) => ({ anchor, overlap: cosine(anchor.dims, candDims) }))
    .filter((x) => x.overlap >= MIN_ANCHOR_OVERLAP)
    .sort((a, b) => b.overlap - a.overlap);
  if (eligible.length === 0) return null;

  const top = eligible[0].overlap;
  const contenders = eligible
    .filter((x) => x.overlap >= top - TIE_BAND)
    .sort((a, b) => {
      const ua = usage?.get(a.anchor.title) ?? 0;
      const ub = usage?.get(b.anchor.title) ?? 0;
      if (ua !== ub) return ua - ub; // least-cited first (variety, tie-break only)
      return b.anchor.playWeight - a.anchor.playWeight;
    });

  const anchor = contenders[0].anchor;
  const overlap = contenders[0].overlap;

  const sharedDims = [...candDims.keys()]
    .filter((d) => anchor.dims.has(d))
    .sort(
      (x, y) =>
        (anchor.dims.get(y) ?? 0) * (candDims.get(y) ?? 0) -
        (anchor.dims.get(x) ?? 0) * (candDims.get(x) ?? 0)
    );

  // Truthfully shareable: dominant+assertable+shared first, then any other
  // assertable shared dim. core∩anchor is guaranteed non-empty (anchor is eligible).
  const coreShared = core
    .filter((d) => anchor.dims.has(d))
    .sort((x, y) => (candDims.get(y) ?? 0) - (candDims.get(x) ?? 0));
  const extraShared = [...candAssertable].filter((d) => anchor.dims.has(d) && !coreShared.includes(d));
  const assertableShared = [...coreShared, ...extraShared];

  return { anchor, sharedDims, assertableShared, fit: overlap, weak: overlap < WEAK_OVERLAP };
}

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

/** Overall taste fit, 0..1 — anchor overlap blended with library coverage. */
export function tasteFitScore(
  clusters: TasteClusters,
  candDims: Map<GameplayDimension, number>,
  match: AnchorMatch | null
): number {
  if (!clusters.available || candDims.size === 0) return 0;
  const anchorFit = match?.fit ?? 0;
  const coverage = coverageScore(clusters, candDims);
  return clamp01(anchorFit * 0.65 + coverage * 0.35);
}

/**
 * Honest match-score ceiling — a great game with weak overlap stays a weak fit.
 * 90%+ is reserved for genuinely strong, truthfully-shared overlap.
 */
export function matchScoreCeiling(match: AnchorMatch | null): number {
  if (!match || match.assertableShared.length === 0) return 74; // adjacent/lighter pick
  if (match.fit >= 0.6) return 97;
  if (match.fit >= 0.45) return 89;
  if (match.fit >= 0.3) return 83;
  return 77;
}

/** Compact, AI-friendly description of a chosen anchor (truthful facets only). */
export function describeMatch(match: AnchorMatch): {
  title: string;
  hours: number;
  anchorNoun: string;
  facets: string[];
  weak: boolean;
} {
  return {
    title: match.anchor.title,
    hours: match.anchor.hours,
    anchorNoun: match.anchor.primary ? DIMENSIONS[match.anchor.primary].noun : "games",
    facets: match.assertableShared.slice(0, 2).map((d) => DIMENSIONS[d].facet),
    weak: match.weak,
  };
}

/**
 * Deterministic, truthful reasons grounded in the anchor and a gameplay emphasis
 * the candidate ACTUALLY has (assertableShared). Weak overlaps are framed as
 * lighter/adjacent picks instead of overclaiming a similarity.
 */
export function contextualReasons(match: AnchorMatch, seed: number): string[] {
  const anchorNoun = match.anchor.primary ? DIMENSIONS[match.anchor.primary].noun : "games";
  const t = match.anchor.title;
  const h = match.anchor.hours;
  const facetDim = match.assertableShared[0];

  if (!facetDim) {
    // No truthfully-shared facet → never invent one.
    return [`A lighter, adjacent pick to your ${anchorNoun} — same neighborhood, not a direct match.`];
  }

  const facet = DIMENSIONS[facetDim].facet;

  if (match.weak) {
    return [
      `A lighter pick adjacent to ${t}: it shares some ${facet}, but it's more of an adjacent recommendation than a direct match.`,
    ];
  }

  const primaryTemplates =
    h >= 2
      ? [
          `Because ${t} is one of your most-played ${anchorNoun}, this leans into the same ${facet}.`,
          `You've put ${h}h into ${t}, and this recommendation shares that ${facet}.`,
          `Since ${t} is one of your top ${anchorNoun}, this continues that ${facet}.`,
        ]
      : [
          `Because ${t} sits in your library, this leans into the same ${facet}.`,
          `${t} is in your library, and this recommendation shares that ${facet}.`,
        ];

  const reasons = [variant(primaryTemplates, seed)];

  const secondDim = match.assertableShared[1];
  if (secondDim) {
    reasons.push(`It also shares the ${DIMENSIONS[secondDim].facet} you keep coming back to.`);
  }
  return reasons.slice(0, 2);
}
