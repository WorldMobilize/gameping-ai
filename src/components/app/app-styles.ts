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

/**
 * Page-accent primary CTA (sm) — the shared standard for accent pill CTAs.
 * Built on the global `.gp-page-cta` class so every primary CTA shares ONE
 * visual language (the landing "Try GamePing" look): a subtle vertical accent
 * gradient + inset sheen + soft accent glow, hover slightly brighter + lifted —
 * NO strong horizontal gradient. The accent follows `--page-accent` per page
 * (blue on /hidden-gems, gold on /games-of-the-week, purple on /curated, red on
 * /games, cyan on default pages). This token only adds shape, sizing, and an
 * accessible focus ring on top. No hardcoded brand colour. UI only.
 */
export const APP_PRIMARY_CTA_ACCENT_SM =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_44px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-white dark:text-slate-900 dark:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6)] dark:hover:bg-slate-100 dark:focus-visible:ring-white/40";

export const APP_SHELL =
  "relative flex min-h-screen flex-col bg-white text-slate-900 dark:bg-[#0b0f1a] dark:text-slate-100";

export const APP_SECTION = "relative overflow-hidden px-6 py-16 md:py-20";

/** Accent labels — follow the current page accent (blue by default) */
export const APP_ACCENT = "text-[color:var(--page-accent-text)]";

/** Theme-aware inline SVG / icon color (uses currentColor) */
export const APP_ICON = "text-slate-900 dark:text-slate-100";

export const APP_ICON_MUTED = "text-slate-600 dark:text-slate-300";

/** White-filled brand marks loaded as img (platform logos, etc.) */
export const APP_BRAND_ICON_IMG =
  "h-full w-full object-contain opacity-90 brightness-0 dark:brightness-100";

export const APP_KICKER =
  "text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]";

export const APP_PAGE_TITLE =
  "mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl gp-home-display";

export const APP_PAGE_LEAD =
  "mt-6 text-lg leading-8 text-slate-700 dark:text-slate-300";

export const APP_BODY = "text-slate-700 leading-7 dark:text-slate-300";

export const APP_BODY_SM = "text-sm leading-6 text-slate-700 dark:text-slate-300";

// Light mode uses slate-600 (not slate-500) so muted/helper text stays readable;
// dark mode is unchanged.
export const APP_MUTED = "text-sm text-slate-600 dark:text-slate-400";

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

// Hover uses a page-accent-tinted glow (not a pale-cyan/near-white shadow, which
// reads as a white halo on the cinematic backgrounds). Hover border follows the
// current page accent. Card border + default look are unchanged.
export const APP_CARD_INTERACTIVE =
  "rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-border)] hover:shadow-[0_10px_28px_-14px_var(--page-accent-glow)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-[color:var(--page-accent-border)]";

export const APP_CARD_INTERACTIVE_LG =
  "rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-border)] hover:shadow-[0_14px_36px_-16px_var(--page-accent-glow)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-[color:var(--page-accent-border)]";

export const APP_CTA_PANEL =
  "rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50 p-6 shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:via-slate-900/80 dark:to-violet-950/30";

export const APP_CALLOUT =
  "rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 text-sm text-slate-700 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-300";

export const APP_INLINE_LINK =
  "font-semibold text-[color:var(--page-accent-text)] underline-offset-4 transition hover:underline";

/**
 * Inline link that follows the current page accent (silver on /login, /signup,
 * /check-email, /verify-success, dashboard, etc.) instead of the hardcoded cyan
 * of APP_INLINE_LINK. Use on accent/auth pages so no cyan brand colour leaks in.
 */
export const APP_INLINE_LINK_ACCENT =
  "font-semibold text-[color:var(--page-accent-text)] underline-offset-4 transition hover:underline";

export const APP_SECONDARY_CTA = `${HOME_SECONDARY_CTA_BASE} px-5 py-2.5 text-sm border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900`;

/**
 * Primary button system — GamePing dark blue / navy. One consistent token for
 * every primary CTA (navbar + landing). Dark blue background, white text,
 * slightly lighter blue on hover. No black, no cyan. Secondary = neutral border
 * that turns blue on hover. No arrows.
 */
export const NAVY_CTA =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-white dark:text-slate-900 dark:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6)] dark:hover:bg-slate-100 dark:focus-visible:ring-white/40";
/* Primary/secondary CTAs — the hero "Start your journey" language: a soft
 * rounded rectangle, monochrome (dark-in-light / white-in-dark), a gentle lift
 * and drop-shadow on hover. Shared across the landing and product pages so every
 * call-to-action reads the same. */
export const NAVY_CTA_LG =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_44px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-white dark:text-slate-900 dark:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6)] dark:hover:bg-slate-100 dark:focus-visible:ring-white/40";
export const NAVY_OUTLINE =
  "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-transparent px-7 py-3.5 text-sm font-semibold text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:border-white/20 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/[0.04] dark:focus-visible:ring-white/40";

export const APP_INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--page-accent-strong)] focus:ring-2 focus:ring-[color:var(--page-accent-soft)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[color:var(--page-accent-strong)] dark:focus:ring-[color:var(--page-accent-soft)]";

export const APP_AUTH_CARD =
  "w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-950/50";

export const APP_PROSE_HEADING = "text-xl font-bold text-slate-900 dark:text-white";

export const APP_LIST_ROW =
  "group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:border-[color:var(--page-accent-border)] hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-[color:var(--page-accent-border)]";
