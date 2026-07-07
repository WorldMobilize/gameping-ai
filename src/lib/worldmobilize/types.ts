/** WorldMobilize — shared types (Phase 1: map foundation, no game logic). */

/**
 * Region lifecycle. Phase 1 only ever uses "available" — the rest are
 * declared now so data, panel UI, and map styling have stable hooks when
 * wars/ownership arrive. "Selected" is deliberately NOT a status: selection
 * is UI state, not world state.
 */
export type RegionStatus =
  | "available"
  | "owned"
  | "under_attack"
  | "contested"
  | "capital"
  | "locked"
  | "conquered";

export type MacroAreaId =
  | "palegrave"
  | "thunder-steppe"
  | "lumen-coast"
  | "hollowmark"
  | "vitrine-expanse"
  | "cinderveil"
  | "verdant-hollow"
  | "shardpelago";

export type MacroArea = {
  id: MacroAreaId;
  name: string;
  /** One-line identity used in the panel & legend. */
  tagline: string;
  /** Base color for fills/glows/labels (hex). */
  hex: string;
};

export type WorldRegion = {
  id: string;
  name: string;
  macroArea: MacroAreaId;
  capitalName: string;
  flavorText: string;
  status: RegionStatus;
  /** Display name of the owning community — null = unclaimed. */
  owner: string | null;
  /** Display price for the claim CTA (placeholder until Stripe wiring). */
  priceDisplay: string;
  /** Stripe Price id — placeholder constant until checkout goes live. */
  stripePriceId: string;
};
