/**
 * WorldMobilize map generator — emits:
 *   src/lib/worldmobilize/world-geometry.ts  (region polygons + label anchors)
 *   src/lib/worldmobilize/world-features.ts  (terrain: mountains, forests,
 *     dunes, rivers, lakes, roads, settlements)
 *
 *   node scripts/generate-worldmobilize-map.mjs
 *
 * Builds a fully ORIGINAL fictional world (no real-world geography, no game
 * IP): macro-areas are hand-placed clusters of lattice cells, and every cell
 * becomes one claimable region. Cell corners are deterministically jittered
 * and every shared edge gets deterministic midpoint displacement, so adjacent
 * regions share IDENTICAL border points — organic shapes with zero seams.
 * Coastal edges get more subpoints and stronger displacement than interior
 * borders so coastlines read as coastlines.
 *
 * Terrain features are scattered deterministically per macro-area profile
 * (mountain ranges in the north, dunes in the glass desert, forests in the
 * green south, a crater ring in the dead zone…). Rivers/roads/lakes are
 * authored as cell-coordinate control points and rendered as smooth
 * Catmull-Rom curves with seeded jitter.
 *
 * Deterministic by seed: re-running produces the same world. Bump SEED to
 * reroll the whole planet.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SEED = "worldmobilize-v1";
const CELL = 82;
const OX = 46;
const OY = 40;
const COLS = 14;
const ROWS = 8;
const WIDTH = OX * 2 + COLS * CELL; // 1240
const HEIGHT = OY * 2 + ROWS * CELL; // 736

const CORNER_JITTER = CELL * 0.24;
const COAST_WAVE = CELL * 0.18;
const BORDER_WAVE = CELL * 0.07;

/** Deterministic [0,1) from a string key (seeded). */
function rand(key) {
  const s = `${SEED}|${key}`;
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}

/** Cell-coordinate → world px. */
const px = (c) => OX + c * CELL;
const py = (r) => OY + r * CELL;

/**
 * Macro-area cell clusters (col,row). Regions are 1:1 with cells; the order
 * here pairs with REGION_IDS below.
 */
const MACRO_CELLS = {
  "palegrave": [[2, 0], [3, 0], [4, 0], [2, 1], [3, 1]],
  "thunder-steppe": [[8, 0], [9, 0], [8, 1], [9, 1], [10, 1], [9, 2]],
  "lumen-coast": [[0, 2], [1, 2], [0, 3], [1, 3], [0, 4]],
  "hollowmark": [[4, 2], [4, 3], [5, 3], [4, 4], [5, 4]],
  "vitrine-expanse": [[10, 2], [11, 2], [10, 3], [11, 3], [12, 3], [11, 4]],
  "cinderveil": [[6, 5], [7, 5], [6, 6], [7, 6]],
  "verdant-hollow": [[1, 5], [2, 5], [1, 6], [2, 6]],
  "shardpelago": [[10, 6], [12, 5], [11, 7], [13, 6]],
};

/** Region ids per macro area — 1:1 with MACRO_CELLS order. */
const REGION_IDS = {
  "palegrave": ["rimehold", "aurora-shelf", "whiteout-pass", "glacier-maw", "snowline"],
  "thunder-steppe": ["galehowl", "static-flats", "thunderfall", "ion-prairie", "cloudsplit", "roaring-verge"],
  "lumen-coast": ["glowharbor", "signal-bluffs", "chromatide", "neonfen", "cablereach"],
  "hollowmark": ["nullfield", "ashen-grid", "the-silence", "craterline", "ghoststead"],
  "vitrine-expanse": ["shimmerdune", "fusewind", "glasswake", "sunscar", "duskpane", "silica-reach"],
  "cinderveil": ["soot-hollow", "pyre-steps", "emberline", "charwood"],
  "verdant-hollow": ["mossreach", "canopy-deep", "vinegate", "bloomfen"],
  "shardpelago": ["brineshard", "coral-break", "mistling-isle", "tidevault"],
};

const land = new Set();
for (const cells of Object.values(MACRO_CELLS)) {
  for (const [c, r] of cells) land.add(`${c},${r}`);
}

/* ------------------------------------------------------------------ */
/* Region polygons                                                     */
/* ------------------------------------------------------------------ */

const vertexCache = new Map();
function vertex(c, r) {
  const key = `${c},${r}`;
  let v = vertexCache.get(key);
  if (!v) {
    v = {
      x: px(c) + (rand(`vx:${key}`) - 0.5) * 2 * CORNER_JITTER,
      y: py(r) + (rand(`vy:${key}`) - 0.5) * 2 * CORNER_JITTER,
    };
    vertexCache.set(key, v);
  }
  return v;
}

/**
 * Displaced midpoints for the edge between lattice vertices kA and kB,
 * cached in canonical direction so both adjacent cells reuse the exact same
 * points. Coast edges get 5 subpoints and a stronger wave; interior edges 3.
 */
const edgeCache = new Map();
function edgePoints(kA, kB, isCoast) {
  const [k1, k2] = kA < kB ? [kA, kB] : [kB, kA];
  const cacheKey = `${k1}|${k2}`;
  let pts = edgeCache.get(cacheKey);
  if (!pts) {
    const [c1, r1] = k1.split(",").map(Number);
    const [c2, r2] = k2.split(",").map(Number);
    const a = vertex(c1, r1);
    const b = vertex(c2, r2);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const amp = isCoast ? COAST_WAVE : BORDER_WAVE;
    const n = isCoast ? 5 : 3;
    pts = Array.from({ length: n }, (_, idx) => {
      const t = (idx + 1) / (n + 1);
      const off = (rand(`edge:${cacheKey}:${idx}`) - 0.5) * 2 * amp;
      return { x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off };
    });
    edgeCache.set(cacheKey, pts);
  }
  return kA < kB ? pts : [...pts].reverse();
}

function isWater(c, r) {
  return !land.has(`${c},${r}`);
}

function cellPolygon(c, r) {
  const kTL = `${c},${r}`;
  const kTR = `${c + 1},${r}`;
  const kBR = `${c + 1},${r + 1}`;
  const kBL = `${c},${r + 1}`;
  const pts = [];
  const push = (p) => pts.push(p);

  push(vertex(c, r));
  edgePoints(kTL, kTR, isWater(c, r - 1)).forEach(push);
  push(vertex(c + 1, r));
  edgePoints(kTR, kBR, isWater(c + 1, r)).forEach(push);
  push(vertex(c + 1, r + 1));
  edgePoints(kBR, kBL, isWater(c, r + 1)).forEach(push);
  push(vertex(c, r + 1));
  edgePoints(kBL, kTL, isWater(c - 1, r)).forEach(push);
  return pts;
}

const f = (n) => Math.round(n * 10) / 10;

const regionGeometry = {};
const macroLabels = {};
const regionCellById = {};

for (const [macro, cells] of Object.entries(MACRO_CELLS)) {
  const ids = REGION_IDS[macro];
  if (ids.length !== cells.length) {
    throw new Error(`Region/cell count mismatch for ${macro}`);
  }
  const centroids = [];
  cells.forEach(([c, r], i) => {
    const pts = cellPolygon(c, r);
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    centroids.push({ x: cx, y: cy });
    const d =
      `M${f(pts[0].x)} ${f(pts[0].y)}` +
      pts.slice(1).map((p) => `L${f(p.x)} ${f(p.y)}`).join("") +
      "Z";
    regionGeometry[ids[i]] = { path: d, cx: f(cx), cy: f(cy) };
    regionCellById[ids[i]] = { c, r, macro };
  });
  macroLabels[macro] = {
    x: f(centroids.reduce((s, p) => s + p.x, 0) / centroids.length),
    y: f(centroids.reduce((s, p) => s + p.y, 0) / centroids.length),
  };
}

/* ------------------------------------------------------------------ */
/* Smooth curve helper (Catmull-Rom → cubic Bézier)                    */
/* ------------------------------------------------------------------ */

function catmullRomPath(points, closed = false) {
  if (points.length < 2) return "";
  const pts = closed
    ? [points[points.length - 1], ...points, points[0], points[1]]
    : [points[0], ...points, points[points.length - 1]];
  let d = `M${f(pts[1].x)} ${f(pts[1].y)}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}

/** Cell-coordinate control points → jittered smooth world-space path. */
function flowPath(key, cellPts, jitter = 8, closed = false) {
  const pts = cellPts.map(([c, r], i) => ({
    x: px(c) + (rand(`${key}:jx:${i}`) - 0.5) * 2 * jitter,
    y: py(r) + (rand(`${key}:jy:${i}`) - 0.5) * 2 * jitter,
  }));
  return catmullRomPath(pts, closed);
}

/* ------------------------------------------------------------------ */
/* Settlements — one per region, biased off-centroid                   */
/* ------------------------------------------------------------------ */

const settlements = {};
for (const [macro, cells] of Object.entries(MACRO_CELLS)) {
  const ids = REGION_IDS[macro];
  cells.forEach((_, i) => {
    const id = ids[i];
    const g = regionGeometry[id];
    settlements[id] = {
      x: f(g.cx + (rand(`stl:x:${id}`) - 0.5) * CELL * 0.34),
      y: f(g.cy + (rand(`stl:y:${id}`) - 0.5) * CELL * 0.34 + 8),
      major: i === 0, // first region of each macro hosts its major settlement
    };
  });
}

/* ------------------------------------------------------------------ */
/* Scatter features per macro-area terrain profile                     */
/* ------------------------------------------------------------------ */

/** Per-macro scatter profiles: how many of each glyph per cell + size range. */
const TERRAIN_PROFILES = {
  "palegrave": { mountains: [3, 11, 17], forests: [2, 5, 7] },
  "thunder-steppe": { mountains: [1, 7, 11], forests: [1, 4, 6] },
  "lumen-coast": { mountains: [1, 6, 9], forests: [1, 5, 7] },
  "hollowmark": { mountains: [1, 6, 10], forests: [0, 0, 0] },
  "vitrine-expanse": { mountains: [0, 0, 0], forests: [0, 0, 0], dunes: [2, 8, 13] },
  "cinderveil": { mountains: [2, 12, 19], forests: [1, 4, 6] },
  "verdant-hollow": { mountains: [0, 0, 0], forests: [4, 5, 9] },
  "shardpelago": { mountains: [1, 5, 8], forests: [1, 4, 6] },
};

const mountains = [];
const forests = [];
const dunes = [];

function scatterInCell(kind, target, macro, c, r, count, sMin, sMax) {
  for (let i = 0; i < count; i++) {
    const key = `${kind}:${c},${r}:${i}`;
    target.push({
      x: f(px(c) + CELL * (0.2 + rand(`${key}:x`) * 0.6)),
      y: f(py(r) + CELL * (0.2 + rand(`${key}:y`) * 0.6)),
      s: f(sMin + rand(`${key}:s`) * (sMax - sMin)),
      macro,
    });
  }
}

for (const [macro, cells] of Object.entries(MACRO_CELLS)) {
  const profile = TERRAIN_PROFILES[macro];
  for (const [c, r] of cells) {
    if (profile.mountains?.[0]) {
      scatterInCell("mtn", mountains, macro, c, r, profile.mountains[0], profile.mountains[1], profile.mountains[2]);
    }
    if (profile.forests?.[0]) {
      scatterInCell("for", forests, macro, c, r, profile.forests[0], profile.forests[1], profile.forests[2]);
    }
    if (profile.dunes?.[0]) {
      scatterInCell("dun", dunes, macro, c, r, profile.dunes[0], profile.dunes[1], profile.dunes[2]);
    }
  }
}

// Hollowmark crater — a ring of peaks around the impact site (craterline).
const crater = { x: px(4.95), y: py(3.55) };
for (let i = 0; i < 9; i++) {
  const ang = (i / 9) * Math.PI * 2 + rand(`crater:a:${i}`) * 0.4;
  const rad = 30 + rand(`crater:r:${i}`) * 10;
  mountains.push({
    x: f(crater.x + Math.cos(ang) * rad * 1.25),
    y: f(crater.y + Math.sin(ang) * rad * 0.8),
    s: f(8 + rand(`crater:s:${i}`) * 5),
    macro: "hollowmark",
  });
}

/* ------------------------------------------------------------------ */
/* Rivers, lakes, roads                                                */
/* ------------------------------------------------------------------ */

const rivers = [
  // Palegrave meltwater running south-west into the strait
  flowPath("river:aur", [[3.5, 0.4], [3.05, 1.05], [2.62, 1.85], [2.15, 2.65]]),
  // Thunder Steppe storm-runoff draining to the north-east sea
  flowPath("river:ion", [[8.45, 0.6], [9.05, 1.2], [9.7, 1.65], [10.6, 1.35], [11.3, 0.85]]),
  // Verdant Hollow river to the south sea
  flowPath("river:vin", [[1.65, 5.25], [2.1, 5.9], [2.5, 6.5], [2.9, 7.35]]),
  // Hollowmark crater outflow through Cinderveil
  flowPath("river:cin", [[5.35, 4.6], [5.9, 5.3], [6.4, 6.1], [6.8, 7.25]]),
];

const lakes = [
  // Crater lake at the heart of Hollowmark
  flowPath(
    "lake:crater",
    Array.from({ length: 8 }, (_, i) => {
      const ang = (i / 8) * Math.PI * 2;
      const rad = 0.16 + rand(`lake:crater:${i}`) * 0.07;
      return [4.95 + Math.cos(ang) * rad * 1.3, 3.55 + Math.sin(ang) * rad];
    }),
    3,
    true
  ),
  // Verdant lowland lake
  flowPath(
    "lake:fen",
    Array.from({ length: 7 }, (_, i) => {
      const ang = (i / 7) * Math.PI * 2;
      const rad = 0.12 + rand(`lake:fen:${i}`) * 0.06;
      return [1.95 + Math.cos(ang) * rad * 1.4, 5.85 + Math.sin(ang) * rad];
    }),
    3,
    true
  ),
  // Thunder Steppe storm basin
  flowPath(
    "lake:basin",
    Array.from({ length: 7 }, (_, i) => {
      const ang = (i / 7) * Math.PI * 2;
      const rad = 0.1 + rand(`lake:basin:${i}`) * 0.05;
      return [9.2 + Math.cos(ang) * rad * 1.4, 1.55 + Math.sin(ang) * rad];
    }),
    3,
    true
  ),
];

/** Roads follow settlement chains (per-continent; no roads over open sea). */
const ROAD_CHAINS = [
  ["glowharbor", "signal-bluffs", "chromatide", "neonfen", "cablereach"],
  ["rimehold", "aurora-shelf", "whiteout-pass", "glacier-maw", "snowline"],
  ["galehowl", "static-flats", "thunderfall", "ion-prairie", "roaring-verge"],
  ["ion-prairie", "cloudsplit", "shimmerdune"], // Thunder→Vitrine land connector
  ["shimmerdune", "fusewind", "glasswake", "sunscar", "silica-reach"],
  ["nullfield", "ashen-grid", "the-silence", "ghoststead"],
  ["soot-hollow", "pyre-steps", "emberline", "charwood"],
  ["mossreach", "canopy-deep", "vinegate", "bloomfen"],
];

const roads = ROAD_CHAINS.map((chain, ci) => {
  const pts = chain.map((id, i) => {
    const s = settlements[id];
    return {
      x: s.x + (rand(`road:${ci}:${i}:x`) - 0.5) * 10,
      y: s.y + (rand(`road:${ci}:${i}:y`) - 0.5) * 10,
    };
  });
  return catmullRomPath(pts);
});

/* ------------------------------------------------------------------ */
/* Emit                                                                */
/* ------------------------------------------------------------------ */

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, "..", "src", "lib", "worldmobilize");

const geometryOut = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-worldmobilize-map.mjs
 *
 * Original fictional world geometry for WorldMobilize (seed "${SEED}").
 * No real-world geography and no existing game IP — every shape comes from a
 * seeded jittered lattice; adjacent regions share exact border points.
 */

export type RegionGeometry = {
  /** Closed SVG path in world coordinates. */
  path: string;
  /** Label anchor (polygon centroid). */
  cx: number;
  cy: number;
};

export const WORLD_WIDTH = ${WIDTH};
export const WORLD_HEIGHT = ${HEIGHT};
export const WORLD_VIEWBOX = "0 0 ${WIDTH} ${HEIGHT}";

export const REGION_GEOMETRY: Record<string, RegionGeometry> = {
${Object.entries(regionGeometry)
  .map(([id, g]) => `  "${id}": { path: "${g.path}", cx: ${g.cx}, cy: ${g.cy} },`)
  .join("\n")}
};

export const MACRO_AREA_LABELS: Record<string, { x: number; y: number }> = {
${Object.entries(macroLabels)
  .map(([id, p]) => `  "${id}": { x: ${p.x}, y: ${p.y} },`)
  .join("\n")}
};
`;

const featurePoint = (p) => `  { x: ${p.x}, y: ${p.y}, s: ${p.s}, macro: "${p.macro}" },`;

const featuresOut = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-worldmobilize-map.mjs
 *
 * Terrain feature layer data for the WorldMobilize map (seed "${SEED}"):
 * scattered glyph positions (mountains/forests/dunes), smooth flow paths
 * (rivers/lakes/roads), and one settlement anchor per region. Decorative
 * only — the interactive layer stays the region polygons.
 */

export type MapFeaturePoint = {
  x: number;
  y: number;
  /** Glyph size in world units. */
  s: number;
  /** Owning macro-area id (for per-biome tinting). */
  macro: string;
};

export type MapSettlement = {
  x: number;
  y: number;
  /** True for the macro-area's principal settlement (bigger glyph). */
  major: boolean;
};

export const MOUNTAINS: MapFeaturePoint[] = [
${mountains.map(featurePoint).join("\n")}
];

export const FORESTS: MapFeaturePoint[] = [
${forests.map(featurePoint).join("\n")}
];

export const DUNES: MapFeaturePoint[] = [
${dunes.map(featurePoint).join("\n")}
];

/** Smooth open paths (SVG d) in world coordinates. */
export const RIVERS: string[] = [
${rivers.map((d) => `  "${d}",`).join("\n")}
];

/** Smooth closed paths (SVG d) in world coordinates. */
export const LAKES: string[] = [
${lakes.map((d) => `  "${d}",`).join("\n")}
];

/** Dashed trade-road paths along settlement chains. */
export const ROADS: string[] = [
${roads.map((d) => `  "${d}",`).join("\n")}
];

/** One settlement per region id. */
export const SETTLEMENTS: Record<string, MapSettlement> = {
${Object.entries(settlements)
  .map(([id, s]) => `  "${id}": { x: ${s.x}, y: ${s.y}, major: ${s.major} },`)
  .join("\n")}
};
`;

writeFileSync(join(libDir, "world-geometry.ts"), geometryOut);
writeFileSync(join(libDir, "world-features.ts"), featuresOut);
console.log(
  `Wrote world-geometry.ts (${Object.keys(regionGeometry).length} regions) and ` +
    `world-features.ts (${mountains.length} peaks, ${forests.length} forests, ` +
    `${dunes.length} dunes, ${rivers.length} rivers, ${lakes.length} lakes, ` +
    `${roads.length} roads, ${Object.keys(settlements).length} settlements)`
);
