import type { RegionStatus } from "./types";

/**
 * Presentation metadata for every region status — declared for ALL future
 * states now so the panel/map pick up wars, ownership, and capitals later
 * without UI rework. Phase 1 only renders "available".
 */
export type RegionStatusMeta = {
  label: string;
  /** Panel badge classes (dark theme first, matching GamePing chips). */
  badgeClass: string;
  /** Map fill opacity for the state (hover/selection add on top). */
  fillOpacity: number;
};

export const REGION_STATUS_META: Record<RegionStatus, RegionStatusMeta> = {
  available: {
    label: "Available",
    badgeClass:
      "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    fillOpacity: 0.34,
  },
  owned: {
    label: "Owned",
    badgeClass: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
    fillOpacity: 0.5,
  },
  under_attack: {
    label: "Under attack",
    badgeClass: "border-rose-400/40 bg-rose-500/10 text-rose-300",
    fillOpacity: 0.55,
  },
  contested: {
    label: "Contested",
    badgeClass: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    fillOpacity: 0.55,
  },
  capital: {
    label: "Capital",
    badgeClass: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    fillOpacity: 0.6,
  },
  locked: {
    label: "Locked",
    badgeClass: "border-slate-400/40 bg-slate-500/10 text-slate-300",
    fillOpacity: 0.16,
  },
  conquered: {
    label: "Conquered",
    badgeClass: "border-orange-400/40 bg-orange-500/10 text-orange-300",
    fillOpacity: 0.5,
  },
};
