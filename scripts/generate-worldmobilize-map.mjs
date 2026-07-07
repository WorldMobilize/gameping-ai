/**
 * WorldMobilize map generator — emits src/lib/worldmobilize/world-geometry.ts.
 *
 *   node scripts/generate-worldmobilize-map.mjs
 *
 * Builds a fully ORIGINAL fictional world (no real-world geography, no game
 * IP): macro-areas are hand-placed clusters of lattice cells, and every cell
 * becomes one claimable region. Cell corners are deterministically jittered
 * and every shared edge gets deterministic midpoint displacement, so adjacent
 * regions share IDENTICAL border points — organic shapes with zero seams.
 * Coastal edges get stronger displacement than interior borders so coastlines
 * read as coastlines.
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
const COAST_WAVE = CELL * 0.16;
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

/**
 * Macro-area cell clusters (col,row). Regions are 1:1 with cells; the order
 * here pairs with REGION_IDS below. Layout notes: frozen north band, neon west
 * coast, dead-zone core, storm plains flowing into the eastern glass desert,
 * green + ash south, shattered island chain in the south-east ocean.
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

/** Jittered lattice vertex — cached so neighbors share exact positions. */
const vertexCache = new Map();
function vertex(c, r) {
  const key = `${c},${r}`;
  let v = vertexCache.get(key);
  if (!v) {
    v = {
      x: OX + c * CELL + (rand(`vx:${key}`) - 0.5) * 2 * CORNER_JITTER,
      y: OY + r * CELL + (rand(`vy:${key}`) - 0.5) * 2 * CORNER_JITTER,
    };
    vertexCache.set(key, v);
  }
  return v;
}

/**
 * Displaced midpoints for the edge between lattice vertices kA and kB,
 * computed in canonical (sorted-key) direction and cached, so both adjacent
 * cells reuse the exact same points. Returned in kA→kB order.
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
    const px = -dy / len;
    const py = dx / len;
    const amp = isCoast ? COAST_WAVE : BORDER_WAVE;
    pts = [1, 2, 3].map((i) => {
      const t = i / 4;
      const off = (rand(`edge:${cacheKey}:${i}`) - 0.5) * 2 * amp;
      return { x: a.x + dx * t + px * off, y: a.y + dy * t + py * off };
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
  });
  macroLabels[macro] = {
    x: f(centroids.reduce((s, p) => s + p.x, 0) / centroids.length),
    y: f(centroids.reduce((s, p) => s + p.y, 0) / centroids.length),
  };
}

const out = `/**
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

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "src", "lib", "worldmobilize", "world-geometry.ts");
writeFileSync(target, out);
console.log(
  `Wrote ${target} — ${Object.keys(regionGeometry).length} regions, ` +
    `${Object.keys(macroLabels).length} macro areas, viewBox 0 0 ${WIDTH} ${HEIGHT}`
);
