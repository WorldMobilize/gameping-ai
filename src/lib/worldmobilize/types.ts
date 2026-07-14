/** WorldMobilize — shared types (holographic command map phase). */

/**
 * Region lifecycle. Only "available" is used today — the rest are declared
 * so data, panel UI, and map styling have stable hooks when wars/ownership
 * arrive. "Selected" is deliberately NOT a status: selection is UI state.
 */
export type RegionStatus =
  | "available"
  | "owned"
  | "under_attack"
  | "contested"
  | "capital"
  | "locked"
  | "conquered";

/** Macro-zones of the alternate world ("sectors" in the command-map UI). */
export type MacroAreaId =
  | "boreal-crown"
  | "vantor-reach"
  | "austral-spur"
  | "meridian-fold"
  | "greyline-basin"
  | "ember-steppe"
  | "hollow-delta"
  | "cinder-vale"
  | "pelagia-arc"
  | "ironwake";

export type MacroArea = {
  id: MacroAreaId;
  name: string;
  /** Holographic accent for fills/glows/labels (hex). */
  hex: string;
};

export type WorldRegion = {
  id: string;
  name: string;
  /** Owning sector / macro-zone. */
  macroArea: MacroAreaId;
  status: RegionStatus;
  /** Display name of the owning community — null = unclaimed. */
  owner: string | null;
  /** Display price for the claim CTA (placeholder until Stripe wiring). */
  priceDisplay: string;
  /** Stripe Price id — placeholder constant until checkout goes live. */
  stripePriceId: string;
};
