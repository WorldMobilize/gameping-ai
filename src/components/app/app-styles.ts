/**
 * App-wide UI tokens with light + dark typography and surfaces.
 * Homepage motion/hero tokens remain in home-styles.ts.
 */

import {
  HOME_DISPLAY_FONT,
  HOME_PRIMARY_CTA_BASE,
  HOME_PRIMARY_CTA_COMPACT,
  HOME_PRIMARY_CTA_LG,
  HOME_PRIMARY_CTA_SM,
  HOME_SECONDARY_CTA_BASE,
  homeCyanAccentText,
  homeCyanChip,
  homeSecondaryCta,
} from "@/components/home/home-styles";

export {
  HOME_DISPLAY_FONT as APP_DISPLAY_FONT,
  HOME_PRIMARY_CTA_BASE,
  HOME_PRIMARY_CTA_LG,
  HOME_PRIMARY_CTA_SM,
  HOME_PRIMARY_CTA_COMPACT,
  homeSecondaryCta,
  homeCyanAccentText,
  homeCyanChip,
};

export const APP_PRIMARY_CTA_SM = HOME_PRIMARY_CTA_SM;
export const APP_PRIMARY_CTA_LG = HOME_PRIMARY_CTA_LG;

export const APP_SHELL =
  "relative flex min-h-screen flex-col bg-white text-slate-900 dark:bg-[#0b0f1a] dark:text-slate-100";

export const APP_SECTION = "relative overflow-hidden px-6 py-16 md:py-20";

/** Cyan accent labels — theme-aware without a hook */
export const APP_ACCENT = "text-cyan-700 dark:text-cyan-400";

/** Theme-aware inline SVG / icon color (uses currentColor) */
export const APP_ICON = "text-slate-900 dark:text-slate-100";

export const APP_ICON_MUTED = "text-slate-600 dark:text-slate-300";

/** White-filled brand marks loaded as img (platform logos, etc.) */
export const APP_BRAND_ICON_IMG =
  "h-full w-full object-contain opacity-90 brightness-0 dark:brightness-100";

export const APP_KICKER =
  "text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-400";

export const APP_PAGE_TITLE =
  "mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl gp-home-display";

export const APP_PAGE_LEAD =
  "mt-6 text-lg leading-8 text-slate-700 dark:text-slate-300";

export const APP_BODY = "text-slate-700 leading-7 dark:text-slate-300";

export const APP_BODY_SM = "text-sm leading-6 text-slate-700 dark:text-slate-300";

export const APP_MUTED = "text-sm text-slate-500 dark:text-slate-400";

export const APP_SECTION_TITLE = "text-2xl font-extrabold text-slate-900 dark:text-white";

export const APP_SECTION_TITLE_LG =
  "text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl";

export const APP_CARD_HEADING = "text-lg font-bold text-slate-900 dark:text-white";

export const APP_CARD_TITLE = "text-lg font-extrabold text-slate-900 dark:text-white";

export const APP_SUBHEADING = "text-xl font-extrabold text-slate-900 dark:text-white";

export const APP_LABEL = "text-sm font-semibold text-slate-900 dark:text-slate-100";

export const APP_FOOTER_SECTION_TITLE =
  "text-xs font-black uppercase tracking-[0.35em] text-slate-900 dark:text-slate-100";

export const APP_CARD =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-950/40";

export const APP_CARD_LG =
  "rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-950/40";

export const APP_CARD_INTERACTIVE =
  "rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:border-cyan-300/70 hover:shadow-md hover:shadow-cyan-100/50 dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-cyan-700/50 dark:hover:shadow-cyan-950/20";

export const APP_CARD_INTERACTIVE_LG =
  "rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-cyan-300/70 hover:shadow-md hover:shadow-cyan-100/50 dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-cyan-700/50 dark:hover:shadow-cyan-950/20";

export const APP_CTA_PANEL =
  "rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 via-white to-violet-50/50 p-6 shadow-sm dark:border-cyan-900/50 dark:from-cyan-950/40 dark:via-slate-900/80 dark:to-violet-950/30";

export const APP_CALLOUT =
  "rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 text-sm text-slate-700 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-300";

export const APP_INLINE_LINK =
  "font-semibold text-cyan-700 underline-offset-4 transition hover:text-cyan-800 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300";

export const APP_SECONDARY_CTA = `${HOME_SECONDARY_CTA_BASE} px-5 py-2.5 text-sm border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900`;

export const APP_INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30";

export const APP_AUTH_CARD =
  "w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-950/50";

export const APP_PROSE_HEADING = "text-xl font-bold text-slate-900 dark:text-white";

export const APP_LIST_ROW =
  "group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:border-cyan-300/70 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-cyan-700/50";
