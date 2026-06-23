import { APP_CARD_LG } from "@/components/app/app-styles";

/** Compact Free tier — intentionally lighter than Premium. */
export const FREE_PLAN_CARD = `${APP_CARD_LG} relative overflow-hidden p-6 md:p-7`;

/** Left column: Free card + teaser stacked. */
export const FREE_COLUMN = "flex flex-col gap-6 lg:gap-8";

/**
 * Dominant Premium tier — gold "upgrade" identity (vs cyan discovery elsewhere).
 * Dark surfaces stay navy/black glass; only the accent (border/glow/ring) is gold.
 */
export const PREMIUM_PLAN_CARD =
  "relative overflow-hidden rounded-3xl border-2 border-amber-300/90 bg-white bg-gradient-to-br p-8 shadow-lg shadow-amber-200/30 ring-1 ring-amber-500/15 md:p-10 lg:p-11 dark:bg-slate-900 dark:border-amber-400/40 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-amber-950/20 dark:shadow-amber-950/35 dark:shadow-xl dark:ring-amber-400/20";

/** Pricing band — clear bottom room before Steam. */
export const PRICING_SECTION = "relative pb-20 md:pb-28 lg:pb-32";

export const PRICING_GRID =
  "mt-14 grid gap-10 md:mt-16 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-x-16 lg:gap-y-12";

/** Premium column — glow contained, no bleed into next section. */
export const PREMIUM_CARD_COLUMN = "relative self-start w-full pb-2";

/** Wider content column for /upgrade. */
export const UPGRADE_PAGE_MAX_WIDTH = "max-w-7xl";

/** Section rhythm below pricing / Steam. */
export const UPGRADE_STEAM_SECTION = "mt-8 md:mt-12 lg:mt-16";
export const UPGRADE_FAQ_SECTION = "mt-16 md:mt-20 lg:mt-24";

export const PREMIUM_CARD_GLOW =
  "pointer-events-none absolute -inset-x-3 -top-3 bottom-4 -z-10 rounded-[2.25rem] bg-amber-400/20 blur-2xl dark:bg-amber-500/20";

export const PREMIUM_INCLUDED_PANEL =
  "rounded-2xl border border-amber-300/60 bg-white p-5 dark:border-amber-700/30 dark:bg-slate-950/30";

export const RECOMMENDED_RIBBON =
  "absolute right-6 top-0 z-10 rounded-b-xl border border-t-0 border-amber-300/90 bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#3a2c08] shadow-md shadow-amber-500/25 dark:border-amber-400/40 dark:from-amber-500 dark:to-amber-600 dark:shadow-amber-950/40";
