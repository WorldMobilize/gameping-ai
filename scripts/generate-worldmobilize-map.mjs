/**
 * WorldMobilize holographic map generator — emits:
 *   src/lib/worldmobilize/world-geometry.ts  (region polygons, labels, defs)
 *   src/lib/worldmobilize/world-features.ts  (holo terrain cues: ridges, channels)
 *
 *   node scripts/generate-worldmobilize-map.mjs
 *
 * ALTERNATE WORLD, not Earth: the continent layout is only loosely inspired
 * by large-landmass logic (a north-west continent, a split supercontinent
 * with an inland sea, a southern continent, an artificial island arc, a far
 * south landmass). Coastlines are procedurally jittered lattice cells — no
 * real country shapes, no political borders, no real-world names.
 *
 * One lattice cell = one claimable region, so ALL regions are approximately
 * the same size by construction (no "big country" advantage). Region names
 * are procedurally combined from abstract tactical name pools.
 *
 * Deterministic by seed — re-running reproduces the same world.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SEED = "worldmobilize-holo-v1";
const CELL = 50;
const OX = 44;
const OY = 40;
const COLS = 30;
const ROWS = 16;
const WIDTH = OX * 2 + COLS * CELL; // 1588
const HEIGHT = OY * 2 + ROWS * CELL; // 880

const CORNER_JITTER = CELL * 0.22;
const COAST_WAVE = CELL * 0.15;
const BORDER_WAVE = CELL * 0.06;

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

const px = (c) => OX + c * CELL;
const py = (r) => OY + r * CELL;

/* ------------------------------------------------------------------ */
/* World layout — ASCII grid, one char per cell                        */
/* ------------------------------------------------------------------ */

const SECTOR_BY_CHAR = {
  b: "boreal-crown",
  v: "vantor-reach",
  a: "austral-spur",
  m: "meridian-fold",
  g: "greyline-basin",
  e: "ember-steppe",
  h: "hollow-delta",
  c: "cinder-vale",
  p: "pelagia-arc",
  i: "ironwake",
};

/**
 * 30×16 cells. '.' = ocean. The '.' holes inside the supercontinent form an
 * inland sea. Pelagia is a deliberately artificial-looking island arc.
 */
const GRID = [
  "..............................",
  "..bbb........mmmee.ee.........",
  ".bbbbb......mmmmeeeee.........",
  ".bbbbb......mmmggeeee..p......",
  "..bvvv......mmg.ggee....p.....",
  "..vvvv.......mg.gge...p.......",
  "...vvv.......mggg......p......",
  "....vv........gg.....p........",
  "..............................",
  ".....aa......hhh....p.........",
  "....aaa.....hhhhh.............",
  "....aaa.....hhcch.............",
  ".....aa......cccc...iii.......",
  ".....a.......ccc...iiiii......",
  "....................iii.......",
  "..............................",
];

if (GRID.length !== ROWS) throw new Error(`GRID must have ${ROWS} rows`);
GRID.forEach((row, i) => {
  if (row.length !== COLS) throw new Error(`GRID row ${i} must be ${COLS} chars (got ${row.length})`);
});

const SECTORS = {
  "boreal-crown": { name: "Boreal Crown", hex: "#7dd3fc" },
  "vantor-reach": { name: "Vantor Reach", hex: "#38bdf8" },
  "austral-spur": { name: "Austral Spur", hex: "#2dd4bf" },
  "meridian-fold": { name: "Meridian Fold", hex: "#22d3ee" },
  "greyline-basin": { name: "Greyline Basin", hex: "#94a3b8" },
  "ember-steppe": { name: "Ember Steppe", hex: "#fbbf24" },
  "hollow-delta": { name: "Hollow Delta", hex: "#60a5fa" },
  "cinder-vale": { name: "Cinder Vale", hex: "#fb7185" },
  "pelagia-arc": { name: "Pelagia Arc", hex: "#67e8f9" },
  "ironwake": { name: "Ironwake", hex: "#a78bfa" },
};

/* cells per sector, in reading order */
const cellsBySector = Object.fromEntries(Object.keys(SECTORS).map((k) => [k, []]));
const land = new Set();
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const ch = GRID[r][c];
    if (ch === ".") continue;
    const sector = SECTOR_BY_CHAR[ch];
    if (!sector) throw new Error(`Unknown grid char "${ch}" at ${c},${r}`);
    cellsBySector[sector].push([c, r]);
    land.add(`${c},${r}`);
  }
}

/* ------------------------------------------------------------------ */
/* Region names — abstract tactical pools, no country-like names       */
/* ------------------------------------------------------------------ */

const NAME_A = [
  "Aurel", "Vantor", "Meridian", "Greyline", "Ember", "Hollow", "Iron",
  "Cinder", "Vale", "Kestrel", "Noct", "Argent", "Umbra", "Zenith",
  "Corvus", "Halcyon", "Bastion", "Cobalt", "Sable", "Aster", "Drift",
  "Aether", "Onyx", "Pale", "Thorn", "Ashen", "Crown", "Frost", "Gale",
  "Rime", "Slate", "Quill", "Solent", "Marrow", "Tarn", "Ferro", "Lumen",
  "Cael", "Orin", "Vesper", "Skarn", "Tessel", "Arc", "Nadir", "Cipher",
];
const NAME_B = [
  "Reach", "Basin", "Fold", "Gate", "Coast", "Delta", "Wake", "Verge",
  "Span", "Hollow", "Line", "Rise", "Shelf", "Cradle", "Field", "Mark",
  "Watch", "Point", "Crest", "Run", "Chain", "Belt", "Pass", "Steppe",
  "Flats", "Bank", "Court", "Spire", "Locks", "Bight",
];
const DIRS = ["North", "East", "South", "West", "Upper", "Lower"];

function regionName(key) {
  const r = rand(`name:${key}`);
  const a = NAME_A[Math.floor(rand(`name:a:${key}`) * NAME_A.length)];
  if (r < 0.1) return `Sector ${a}`;
  if (r < 0.22) {
    const d = DIRS[Math.floor(rand(`name:d:${key}`) * DIRS.length)];
    return `${d} ${a}`;
  }
  let b = NAME_B[Math.floor(rand(`name:b:${key}`) * NAME_B.length)];
  if (a === b) b = "Reach";
  return `${a} ${b}`;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ------------------------------------------------------------------ */
/* Geometry — jittered lattice, shared borders                         */
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
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const amp = isCoast ? COAST_WAVE : BORDER_WAVE;
    const n = isCoast ? 4 : 2;
    pts = Array.from({ length: n }, (_, i) => {
      const t = (i + 1) / (n + 1);
      const off = (rand(`edge:${cacheKey}:${i}`) - 0.5) * 2 * amp;
      return { x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off };
    });
    edgeCache.set(cacheKey, pts);
  }
  return kA < kB ? pts : [...pts].reverse();
}

const isWater = (c, r) => !land.has(`${c},${r}`);

function cellPolygon(c, r) {
  const kTL = `${c},${r}`, kTR = `${c + 1},${r}`, kBR = `${c + 1},${r + 1}`, kBL = `${c},${r + 1}`;
  const pts = [];
  pts.push(vertex(c, r));
  edgePoints(kTL, kTR, isWater(c, r - 1)).forEach((p) => pts.push(p));
  pts.push(vertex(c + 1, r));
  edgePoints(kTR, kBR, isWater(c + 1, r)).forEach((p) => pts.push(p));
  pts.push(vertex(c + 1, r + 1));
  edgePoints(kBR, kBL, isWater(c, r + 1)).forEach((p) => pts.push(p));
  pts.push(vertex(c, r + 1));
  edgePoints(kBL, kTL, isWater(c - 1, r)).forEach((p) => pts.push(p));
  return pts;
}

const f = (n) => Math.round(n * 10) / 10;

const regionGeometry = {};
const regionDefs = [];
const sectorLabels = {};
const usedNames = new Set();

for (const [sector, cells] of Object.entries(cellsBySector)) {
  const centroids = [];
  cells.forEach(([c, r], i) => {
    let name = regionName(`${sector}:${i}`);
    let bump = 0;
    while (usedNames.has(name)) name = regionName(`${sector}:${i}:${++bump}`);
    usedNames.add(name);
    const id = slug(name);

    const pts = cellPolygon(c, r);
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    centroids.push({ x: cx, y: cy });
    const d = `M${f(pts[0].x)} ${f(pts[0].y)}` + pts.slice(1).map((p) => `L${f(p.x)} ${f(p.y)}`).join("") + "Z";
    regionGeometry[id] = { path: d, cx: f(cx), cy: f(cy) };
    regionDefs.push({ id, name, sector });
  });
  sectorLabels[sector] = {
    x: f(centroids.reduce((s, p) => s + p.x, 0) / centroids.length),
    y: f(centroids.reduce((s, p) => s + p.y, 0) / centroids.length),
  };
}

/* ------------------------------------------------------------------ */
/* Holographic terrain cues                                            */
/* ------------------------------------------------------------------ */

function catmullRomPath(points, closed = false) {
  if (points.length < 2) return "";
  const pts = closed
    ? [points[points.length - 1], ...points, points[0], points[1]]
    : [points[0], ...points, points[points.length - 1]];
  let d = `M${f(pts[1].x)} ${f(pts[1].y)}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}
function flow(key, cellPts, jitter = 6) {
  return catmullRomPath(
    cellPts.map(([c, r], i) => ({
      x: px(c) + (rand(`${key}:jx:${i}`) - 0.5) * 2 * jitter,
      y: py(r) + (rand(`${key}:jy:${i}`) - 0.5) * 2 * jitter,
    }))
  );
}

/** Mountain ridge lines → chevron marks (position + tangent angle). */
const RIDGE_LINES = [
  { key: "boreal", pts: [[2.2, 2.2], [3.6, 1.9], [5.0, 2.3], [5.9, 2.9]] },
  { key: "divide", pts: [[14.1, 3.1], [14.7, 4.4], [14.5, 5.6], [14.1, 6.4]] },
  { key: "ember", pts: [[16.8, 1.6], [18.2, 2.0], [19.4, 2.6]] },
  { key: "hollow", pts: [[13.2, 10.1], [14.6, 10.3], [15.8, 10.6]] },
  { key: "ironwake", pts: [[20.4, 13.0], [21.8, 12.8], [23.2, 13.1]] },
  { key: "austral", pts: [[4.5, 9.6], [4.9, 10.7], [4.7, 11.8]] },
];
const ridges = [];
for (const line of RIDGE_LINES) {
  const world = line.pts.map(([c, r]) => ({ x: px(c), y: py(r) }));
  // sample along segments
  for (let i = 0; i < world.length - 1; i++) {
    const a = world[i], b = world[i + 1];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(2, Math.round(L / 26));
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      const jx = (rand(`${line.key}:x:${i}:${s}`) - 0.5) * 14;
      const jy = (rand(`${line.key}:y:${i}:${s}`) - 0.5) * 14;
      ridges.push({
        x: f(a.x + (b.x - a.x) * t + jx),
        y: f(a.y + (b.y - a.y) * t + jy),
        s: f(4.5 + rand(`${line.key}:s:${i}:${s}`) * 4),
        angle: f((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI),
      });
    }
  }
}

/** Glowing water channels (clipped to land at render time). */
const channels = [
  flow("ch:west", [[3.4, 2.4], [4.1, 3.6], [3.7, 4.9], [4.4, 6.3]]),
  flow("ch:inland", [[14.4, 2.2], [15.1, 3.1], [15.4, 4.2]]),
  flow("ch:grey", [[17.4, 2.8], [18.2, 4.1], [19.1, 5.3]]),
  flow("ch:south", [[13.8, 9.4], [14.7, 10.6], [14.2, 11.9]]),
  flow("ch:iron", [[21.3, 12.5], [22.3, 13.3]]),
];

/* ------------------------------------------------------------------ */
/* Emit                                                                */
/* ------------------------------------------------------------------ */

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, "..", "src", "lib", "worldmobilize");

const geometryOut = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-worldmobilize-map.mjs
 *
 * WorldMobilize holographic command map (seed "${SEED}").
 * ALTERNATE WORLD: continents are procedural lattice shapes only loosely
 * inspired by large-landmass logic — no real countries, no political
 * borders, no real-world names. One cell = one region, so every region is
 * approximately the same size by construction.
 */

export type RegionGeometry = {
  /** Closed SVG path in world coordinates. */
  path: string;
  /** Label anchor (polygon centroid). */
  cx: number;
  cy: number;
};

export type RegionDef = {
  id: string;
  name: string;
  sector: string;
};

export const WORLD_WIDTH = ${WIDTH};
export const WORLD_HEIGHT = ${HEIGHT};
export const WORLD_VIEWBOX = "0 0 ${WIDTH} ${HEIGHT}";

export const REGION_GEOMETRY: Record<string, RegionGeometry> = {
${Object.entries(regionGeometry)
  .map(([id, g]) => `  "${id}": { path: "${g.path}", cx: ${g.cx}, cy: ${g.cy} },`)
  .join("\n")}
};

export const REGION_DEFS: RegionDef[] = [
${regionDefs.map((d) => `  { id: "${d.id}", name: "${d.name}", sector: "${d.sector}" },`).join("\n")}
];

export const SECTOR_LABELS: Record<string, { x: number; y: number }> = {
${Object.entries(sectorLabels)
  .map(([id, p]) => `  "${id}": { x: ${p.x}, y: ${p.y} },`)
  .join("\n")}
};
`;

const featuresOut = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-worldmobilize-map.mjs
 *
 * Holographic terrain cues for the WorldMobilize command map: mountain
 * ridge chevrons and glowing water channels. Decorative only — interaction
 * stays on the region hitbox layer.
 */

export type RidgeMark = {
  x: number;
  y: number;
  /** Chevron size in world units. */
  s: number;
  /** Ridge tangent angle in degrees. */
  angle: number;
};

export const RIDGES: RidgeMark[] = [
${ridges.map((r) => `  { x: ${r.x}, y: ${r.y}, s: ${r.s}, angle: ${r.angle} },`).join("\n")}
];

/** Smooth open paths (SVG d) in world coordinates — glowing channels. */
export const CHANNELS: string[] = [
${channels.map((d) => `  "${d}",`).join("\n")}
];
`;

writeFileSync(join(libDir, "world-geometry.ts"), geometryOut);
writeFileSync(join(libDir, "world-features.ts"), featuresOut);

const counts = Object.fromEntries(
  Object.entries(cellsBySector).map(([k, v]) => [k, v.length])
);
console.log(`Regions: ${regionDefs.length}`, counts);
console.log("Sample regions per sector:");
for (const sector of Object.keys(SECTORS)) {
  const first = regionDefs.filter((d) => d.sector === sector).slice(0, 2);
  console.log(` ${sector}: ${first.map((d) => `${d.name} (${d.id})`).join(" · ")}`);
}
