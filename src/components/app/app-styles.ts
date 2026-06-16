/**
 * App-wide light UI tokens (Phase 1). Homepage tokens remain in home-styles.ts.
 */

import {
  HOME_DISPLAY_FONT,
  HOME_PRIMARY_CTA_BASE,
  HOME_PRIMARY_CTA_COMPACT,
  HOME_PRIMARY_CTA_LG,
  HOME_PRIMARY_CTA_SM,
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
  "relative flex min-h-screen flex-col bg-white text-slate-900";

export const APP_SECTION = "relative overflow-hidden px-6 py-16 md:py-20";

export const APP_KICKER =
  "text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700";

export const APP_PAGE_TITLE =
  "mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl gp-home-display";

export const APP_PAGE_LEAD = "mt-6 text-lg leading-8 text-slate-600";

export const APP_BODY = "text-slate-600 leading-7";

export const APP_BODY_SM = "text-sm leading-6 text-slate-600";

export const APP_MUTED = "text-sm text-slate-500";

export const APP_CARD =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-200/40";

export const APP_CARD_LG =
  "rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-200/40";

export const APP_CARD_INTERACTIVE =
  "rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:border-cyan-300/70 hover:shadow-md hover:shadow-cyan-100/50";

export const APP_CARD_INTERACTIVE_LG =
  "rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-cyan-300/70 hover:shadow-md hover:shadow-cyan-100/50";

export const APP_CTA_PANEL =
  "rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 via-white to-violet-50/50 p-6 shadow-sm";

export const APP_CALLOUT =
  "rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 text-sm text-slate-600";

export const APP_INLINE_LINK =
  "font-semibold text-cyan-700 underline-offset-4 transition hover:text-cyan-800 hover:underline";

export const APP_SECONDARY_CTA = homeSecondaryCta(false, "sm");

export const APP_INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

export const APP_AUTH_CARD =
  "w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 shadow-lg shadow-slate-200/50";

export const APP_PROSE_HEADING = "text-xl font-bold text-slate-900";

export const APP_LIST_ROW =
  "group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:border-cyan-300/70 hover:shadow-md";
