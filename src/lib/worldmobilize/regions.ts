import { REGION_PRICE_DISPLAY, REGION_PRICE_PLACEHOLDER } from "./claim";
import type { MacroArea, MacroAreaId, WorldRegion } from "./types";

/**
 * WorldMobilize world content — a fully ORIGINAL fictional planet. Invented
 * macro-areas and regions only: no real countries or borders, no existing
 * game IP. Geometry lives in world-geometry.ts (generated); this file is the
 * single source of truth for names, capitals, and flavor.
 */

export const MACRO_AREAS: Record<MacroAreaId, MacroArea> = {
  "palegrave": {
    id: "palegrave",
    name: "Palegrave",
    tagline: "The frozen crown of the north — quiet, blinding, unforgiving.",
    hex: "#38bdf8",
  },
  "thunder-steppe": {
    id: "thunder-steppe",
    name: "Thunder Steppe",
    tagline: "Open plains where the sky does most of the fighting.",
    hex: "#8b5cf6",
  },
  "lumen-coast": {
    id: "lumen-coast",
    name: "Lumen Coast",
    tagline: "A neon seaboard that never fully powers down.",
    hex: "#22d3ee",
  },
  "hollowmark": {
    id: "hollowmark",
    name: "Hollowmark",
    tagline: "The dead zone at the world's center. Signals go in; less comes out.",
    hex: "#94a3b8",
  },
  "vitrine-expanse": {
    id: "vitrine-expanse",
    name: "Vitrine Expanse",
    tagline: "A desert fused to glass by a sun with opinions.",
    hex: "#f59e0b",
  },
  "cinderveil": {
    id: "cinderveil",
    name: "Cinderveil",
    tagline: "Ash country — everything here has burned at least once.",
    hex: "#f43f5e",
  },
  "verdant-hollow": {
    id: "verdant-hollow",
    name: "Verdant Hollow",
    tagline: "Overgrown lowlands where the wild is winning on points.",
    hex: "#34d399",
  },
  "shardpelago": {
    id: "shardpelago",
    name: "The Shardpelago",
    tagline: "A shattered island chain held together by tide and stubbornness.",
    hex: "#2dd4bf",
  },
};

/** Ordered list for legends/panels. */
export const MACRO_AREA_LIST: MacroArea[] = Object.values(MACRO_AREAS);

function region(
  id: string,
  macroArea: MacroAreaId,
  name: string,
  capitalName: string,
  flavorText: string
): WorldRegion {
  return {
    id,
    name,
    macroArea,
    capitalName,
    flavorText,
    status: "available",
    owner: null,
    priceDisplay: REGION_PRICE_DISPLAY,
    stripePriceId: REGION_PRICE_PLACEHOLDER,
  };
}

export const WORLD_REGIONS: WorldRegion[] = [
  // Palegrave — frozen north
  region("rimehold", "palegrave", "Rimehold", "Frostgate",
    "Walls of blue ice that have never surrendered — mostly because nobody wants them."),
  region("aurora-shelf", "palegrave", "Aurora Shelf", "Skylight",
    "The night sky performs here. Locals rate it out of habit."),
  region("whiteout-pass", "palegrave", "Whiteout Pass", "Cairn Watch",
    "The only road north. Visibility optional, tolls mandatory."),
  region("glacier-maw", "palegrave", "Glacier Maw", "Coldspire",
    "A slow river of ice that eats anything parked on it."),
  region("snowline", "palegrave", "Snowline", "Last Hearth",
    "Where winter starts negotiating and never stops."),

  // Thunder Steppe — storm plains
  region("galehowl", "thunder-steppe", "Galehowl", "Windbreak",
    "The wind here has a name, a schedule, and a grudge."),
  region("static-flats", "thunder-steppe", "Static Flats", "Rodstead",
    "Your hair stands up the moment you cross the border. It's the law."),
  region("thunderfall", "thunder-steppe", "Thunderfall", "Echo Landing",
    "Storms roll downhill and pile up here like unread mail."),
  region("ion-prairie", "thunder-steppe", "Ion Prairie", "Charge Hollow",
    "Grass, sky, and enough ambient charge to run a small city."),
  region("cloudsplit", "thunder-steppe", "Cloudsplit", "Vane Ridge",
    "A ridge so sharp it files the weather into two neat halves."),
  region("roaring-verge", "thunder-steppe", "Roaring Verge", "Herdfall",
    "The steppe's loud edge — herds, thunder, and no indoor voices."),

  // Lumen Coast — neon seaboard
  region("glowharbor", "lumen-coast", "Glowharbor", "Beacon Quay",
    "The harbor lights stay on so the sea knows where to stop."),
  region("signal-bluffs", "lumen-coast", "Signal Bluffs", "Antenna Rise",
    "Cliffs crowned with towers. Everyone here is broadcasting something."),
  region("chromatide", "lumen-coast", "Chromatide", "Prism Docks",
    "The tide comes in seven colors. Nobody agrees which is best."),
  region("neonfen", "lumen-coast", "Neonfen", "Lantern Shoals",
    "A marsh that glows from below. Swimming is a statement."),
  region("cablereach", "lumen-coast", "Cablereach", "Relay Point",
    "Every line of the world's chatter passes under these streets."),

  // Hollowmark — the dead zone
  region("nullfield", "hollowmark", "Nullfield", "Zero Gate",
    "Compasses spin, maps shrug. You navigate by attitude."),
  region("ashen-grid", "hollowmark", "Ashen Grid", "Grid Nine",
    "A perfect city plan with nothing left in it but the plan."),
  region("the-silence", "hollowmark", "The Silence", "Muted Hall",
    "Sound arrives, thinks better of it, and leaves."),
  region("craterline", "hollowmark", "Craterline", "Rimfall",
    "Something landed here once. The regions around it still flinch."),
  region("ghoststead", "hollowmark", "Ghoststead", "Palewick",
    "Homes stand ready, kettles half-full. Nobody remembers who left."),

  // Vitrine Expanse — glass desert
  region("shimmerdune", "vitrine-expanse", "Shimmerdune", "Mirage Rest",
    "Half the horizon is real. Guides charge extra to tell you which half."),
  region("fusewind", "vitrine-expanse", "Fusewind", "Kilnpost",
    "A hot wind that finishes what the sun starts."),
  region("glasswake", "vitrine-expanse", "Glasswake", "Facetfall",
    "Dunes frozen mid-motion into glass. Loud underfoot, gorgeous at dawn."),
  region("sunscar", "vitrine-expanse", "Sunscar", "Noon Anvil",
    "Noon lasts longer here than anywhere else. Bring opinions and water."),
  region("duskpane", "vitrine-expanse", "Duskpane", "Amber Gate",
    "At sunset the whole region turns amber and pretends to be a jewel."),
  region("silica-reach", "vitrine-expanse", "Silica Reach", "Glazeport",
    "The desert's only port — exporting glass, importing everything else."),

  // Cinderveil — ash country
  region("soot-hollow", "cinderveil", "Soot Hollow", "Cinder Market",
    "The market runs on charcoal, rumor, and remarkably good bread."),
  region("pyre-steps", "cinderveil", "Pyre Steps", "Ashcroft",
    "Terraced hills of old fires. Warm ground, warmer politics."),
  region("emberline", "cinderveil", "Emberline", "Coalgate",
    "A border that still glows at night. Both sides call it decorative."),
  region("charwood", "cinderveil", "Charwood", "Kindlewick",
    "A forest that burned and grew back darker, twice as proud."),

  // Verdant Hollow — overgrown lowlands
  region("mossreach", "verdant-hollow", "Mossreach", "Fern Court",
    "Everything soft, everything green, everything slightly damp."),
  region("canopy-deep", "verdant-hollow", "Canopy Deep", "Bough Hall",
    "The streets are branches. The sky is optional."),
  region("vinegate", "verdant-hollow", "Vinegate", "Trellis",
    "The old wall lost to the vines. The vines kept the name."),
  region("bloomfen", "verdant-hollow", "Bloomfen", "Petalmoor",
    "A marsh in permanent spring. Allergies are a regional identity."),

  // The Shardpelago — shattered isles
  region("brineshard", "shardpelago", "Brineshard", "Saltlight",
    "A splinter of coast that sailed off and made it work."),
  region("coral-break", "shardpelago", "Coral Break", "Reefstead",
    "The reef broke the sea; the town grew in the calm behind it."),
  region("mistling-isle", "shardpelago", "Mistling Isle", "Foghome",
    "Appears on maps roughly four days a week."),
  region("tidevault", "shardpelago", "Tidevault", "Moonharbor",
    "Twice a day the sea steps back and shows what it's been keeping."),
];

/** Fast lookups for UI. */
export const REGIONS_BY_ID: Record<string, WorldRegion> = Object.fromEntries(
  WORLD_REGIONS.map((r) => [r.id, r])
);
