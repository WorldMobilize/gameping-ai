import { REGION_PRICE_DISPLAY, REGION_PRICE_PLACEHOLDER } from "./claim";
import type { MacroArea, MacroAreaId, WorldRegion } from "./types";
import { REGION_DEFS } from "./world-geometry";

/**
 * WorldMobilize world content — an ALTERNATE world for the holographic
 * command map. Sectors and regions are invented (procedural tactical names);
 * no real countries, borders, or political references. Geometry + region
 * defs are generated (world-geometry.ts); this file assembles the runtime
 * region objects and the sector palette.
 */

export const MACRO_AREAS: Record<MacroAreaId, MacroArea> = {
  "boreal-crown": { id: "boreal-crown", name: "Boreal Crown", hex: "#7dd3fc" },
  "vantor-reach": { id: "vantor-reach", name: "Vantor Reach", hex: "#38bdf8" },
  "austral-spur": { id: "austral-spur", name: "Austral Spur", hex: "#2dd4bf" },
  "meridian-fold": { id: "meridian-fold", name: "Meridian Fold", hex: "#22d3ee" },
  "greyline-basin": { id: "greyline-basin", name: "Greyline Basin", hex: "#94a3b8" },
  "ember-steppe": { id: "ember-steppe", name: "Ember Steppe", hex: "#fbbf24" },
  "hollow-delta": { id: "hollow-delta", name: "Hollow Delta", hex: "#60a5fa" },
  "cinder-vale": { id: "cinder-vale", name: "Cinder Vale", hex: "#fb7185" },
  "pelagia-arc": { id: "pelagia-arc", name: "Pelagia Arc", hex: "#67e8f9" },
  "ironwake": { id: "ironwake", name: "Ironwake", hex: "#a78bfa" },
};

/** Ordered list for legends/panels. */
export const MACRO_AREA_LIST: MacroArea[] = Object.values(MACRO_AREAS);

export const WORLD_REGIONS: WorldRegion[] = REGION_DEFS.map((def) => ({
  id: def.id,
  name: def.name,
  macroArea: def.sector as MacroAreaId,
  status: "available",
  owner: null,
  priceDisplay: REGION_PRICE_DISPLAY,
  stripePriceId: REGION_PRICE_PLACEHOLDER,
}));

/** Fast lookups for UI. */
export const REGIONS_BY_ID: Record<string, WorldRegion> = Object.fromEntries(
  WORLD_REGIONS.map((r) => [r.id, r])
);
