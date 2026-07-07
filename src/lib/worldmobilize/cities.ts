import type { MacroAreaId } from "./types";

/**
 * WorldMobilize city prototypes — data layer (no JSX, no gameplay).
 *
 * Phase: ONE explorable settlement, Beacon Quay, capital of Glowharbor on the
 * Lumen Coast — a neon harbor city rendered as a pseudo-isometric SVG scene.
 * The whole layout (tiles, buildings, lights, POIs) is deterministic data
 * built here at module load, so the scene component just draws what it gets.
 * Adding a second city later = one more entry in CITIES.
 */

export type CityTile = "ground" | "street" | "plaza" | "water" | "pier";

export type CityBuilding = {
  tx: number;
  ty: number;
  /** Height in px at base tile scale. */
  h: number;
  kind: "tower" | "block" | "shed";
  /** Neon-lit building (accent roofline + brighter windows). */
  neon: boolean;
  /** Deterministic per-building seed for window patterns. */
  seed: number;
};

export type CityPoiKind = "beacon" | "market" | "exchange" | "gate" | "plaza";

export type CityPoi = {
  id: string;
  name: string;
  kind: CityPoiKind;
  description: string;
  tx: number;
  ty: number;
};

export type CityPrototype = {
  id: string;
  slug: string;
  name: string;
  regionId: string;
  regionName: string;
  macroArea: MacroAreaId;
  tagline: string;
  intro: string;
  cols: number;
  rows: number;
  /** tiles[ty][tx] */
  tiles: CityTile[][];
  buildings: CityBuilding[];
  pois: CityPoi[];
  /** Street-lamp tile coords (subset of street tiles). */
  lamps: Array<{ tx: number; ty: number }>;
};

/** Deterministic [0,1) — same hash family as the map generator. */
function seeded(key: string): number {
  const s = `beacon-quay|${key}`;
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}

function buildBeaconQuay(): CityPrototype {
  const cols = 14;
  const rows = 12;

  const STREET_COLS = new Set([2, 5, 8]);
  const STREET_ROWS = new Set([2, 5, 9]);
  const PIER_ROWS = new Set([3, 8]);

  const tiles: CityTile[][] = [];
  for (let ty = 0; ty < rows; ty++) {
    const row: CityTile[] = [];
    for (let tx = 0; tx < cols; tx++) {
      // Harbor water fills the eastern edge; two piers reach into it.
      if (tx >= 11) {
        row.push(PIER_ROWS.has(ty) && tx <= 12 ? "pier" : "water");
        continue;
      }
      // Founders' Plaza — the civic heart beside the main avenue.
      if (tx >= 3 && tx <= 6 && ty >= 6 && ty <= 8) {
        row.push("plaza");
        continue;
      }
      if (STREET_COLS.has(tx) || STREET_ROWS.has(ty)) {
        row.push("street");
        continue;
      }
      row.push("ground");
    }
    tiles.push(row);
  }

  // Buildings on ground tiles: towers ring the plaza, mid blocks fill the
  // core, low sheds line the waterfront. Deterministic, ~75% occupancy.
  const buildings: CityBuilding[] = [];
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if (tiles[ty][tx] !== "ground") continue;
      const key = `b:${tx},${ty}`;
      if (seeded(`${key}:skip`) < 0.22) continue;

      const plazaDist = Math.max(
        0,
        Math.max(3 - tx, tx - 6, 6 - ty, ty - 8) // Chebyshev-ish distance to plaza rect
      );
      const nearWater = tx >= 9;

      let h: number;
      let kind: CityBuilding["kind"];
      if (nearWater) {
        h = 8 + seeded(`${key}:h`) * 6;
        kind = "shed";
      } else if (plazaDist <= 2) {
        h = 26 + seeded(`${key}:h`) * 18;
        kind = "tower";
      } else {
        h = 13 + seeded(`${key}:h`) * 10;
        kind = "block";
      }
      buildings.push({
        tx,
        ty,
        h: Math.round(h),
        kind,
        neon: kind === "tower" ? seeded(`${key}:n`) < 0.75 : seeded(`${key}:n`) < 0.25,
        seed: Math.floor(seeded(`${key}:s`) * 1e6),
      });
    }
  }

  // Street lamps every few street tiles (skip intersections for clarity).
  const lamps: Array<{ tx: number; ty: number }> = [];
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if (tiles[ty][tx] !== "street") continue;
      const onCol = STREET_COLS.has(tx);
      const onRow = STREET_ROWS.has(ty);
      if (onCol && onRow) continue;
      if ((tx + ty) % 3 === 0) lamps.push({ tx, ty });
    }
  }

  const pois: CityPoi[] = [
    {
      id: "the-beacon",
      name: "The Beacon",
      kind: "beacon",
      tx: 12,
      ty: 3,
      description:
        "The lighthouse that named the city. Its cyan beam has never gone dark — harbor law, and a point of pride.",
    },
    {
      id: "founders-plaza",
      name: "Founders' Plaza",
      kind: "plaza",
      tx: 4,
      ty: 7,
      description:
        "Where the first crews landed and the first claims will be signed. Season banners will hang here.",
    },
    {
      id: "signal-exchange",
      name: "Signal Exchange",
      kind: "exchange",
      tx: 7,
      ty: 4,
      description:
        "Every rumor on the Lumen Coast passes through this tower before it becomes news.",
    },
    {
      id: "quay-market",
      name: "Quay Market",
      kind: "market",
      tx: 9,
      ty: 6,
      description:
        "Fresh catch, salvaged tech, and the city's best noodles — prices negotiable, opinions free.",
    },
    {
      id: "tide-gate",
      name: "Tide Gate",
      kind: "gate",
      tx: 10,
      ty: 9,
      description:
        "The old sea wall's only gate. When wars come, this is where Beacon Quay holds the line.",
    },
  ];

  return {
    id: "beacon-quay",
    slug: "beacon-quay",
    name: "Beacon Quay",
    regionId: "glowharbor",
    regionName: "Glowharbor",
    macroArea: "lumen-coast",
    tagline: "Harbor capital of Glowharbor — the city that never powers down.",
    intro:
      "Neon piers, signal towers, and a lighthouse older than the maps. Beacon Quay is the Lumen Coast's front door — and the first settlement communities will be able to claim.",
    cols,
    rows,
    tiles,
    buildings,
    pois,
    lamps,
  };
}

export const CITIES: CityPrototype[] = [buildBeaconQuay()];

export const CITY_BY_SLUG: Record<string, CityPrototype> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c])
);

export const CITY_BY_REGION: Record<string, CityPrototype> = Object.fromEntries(
  CITIES.map((c) => [c.regionId, c])
);
