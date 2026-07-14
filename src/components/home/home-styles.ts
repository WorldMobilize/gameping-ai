/** Shared homepage typography and CTA classes. */

export const HOME_DISPLAY_FONT = "gp-home-display";

export const HOME_HERO_DISPLAY_FONT = "gp-home-hero-display";

export const HOME_SECTION_TITLE =
  `text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] ${HOME_DISPLAY_FONT}`;

export const HOME_SECTION_LEAD = "mt-4 text-lg leading-relaxed sm:text-xl";

export const HOME_BLOCK_TITLE =
  `text-xl font-bold sm:text-[1.35rem] ${HOME_DISPLAY_FONT}`;

export const HOME_BLOCK_BODY = "mt-3 text-base leading-relaxed";

// Primary CTA — the hero "Start your journey" language: soft rounded rectangle,
// monochrome (dark-in-light / white-in-dark), gentle lift + drop-shadow on hover.
// One visual language for every primary call-to-action across the app.
export const HOME_PRIMARY_CTA_BASE =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 font-semibold text-white shadow-[0_18px_44px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-white dark:text-slate-900 dark:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6)] dark:hover:bg-slate-100 dark:focus-visible:ring-white/40";

export const HOME_PRIMARY_CTA_LG = `${HOME_PRIMARY_CTA_BASE} px-8 py-3.5 text-base`;

export const HOME_PRIMARY_CTA_SM = `${HOME_PRIMARY_CTA_BASE} px-5 py-2.5 text-sm`;

/** Compact primary CTA — same language, fixed height (e.g. Read more). */
export const HOME_PRIMARY_CTA_COMPACT = `${HOME_PRIMARY_CTA_BASE} h-10 px-5 text-sm`;

export const HOME_SECONDARY_CTA_BASE =
  "inline-flex items-center justify-center rounded-2xl border font-semibold shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md";

export function homeSecondaryCta(isDark: boolean, size: "lg" | "sm" = "lg") {
  const sizing = size === "lg" ? "px-8 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return isDark
    ? `${HOME_SECONDARY_CTA_BASE} ${sizing} border-slate-700 bg-slate-900/70 text-slate-200 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-blue-500/10`
    : `${HOME_SECONDARY_CTA_BASE} ${sizing} border-slate-200 bg-white/80 text-slate-700 hover:border-blue-400/50 hover:bg-white hover:shadow-blue-500/10`;
}

export function homeTrustCheck(isDark: boolean) {
  return isDark
    ? "bg-blue-950/80 text-blue-400"
    : "bg-blue-100 text-blue-700";
}

/** Primary cyan chip — active product signals */
export function homeCyanChip(isDark: boolean) {
  return isDark
    ? "rounded-full border border-blue-800/60 bg-blue-950/50 px-2.5 py-1 text-xs font-medium text-blue-300"
    : "rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800";
}

/** Soft cyan chip — coming-soon / secondary labels (same palette as primary) */
export function homeSoonChip(isDark: boolean) {
  return homeCyanChip(isDark);
}

/** @deprecated Prefer homeSoonChip / homeCyanChip on the public homepage */
export function homeVioletChip(isDark: boolean) {
  return homeSoonChip(isDark);
}

export function homeCyanAccentText(isDark: boolean) {
  return isDark ? "text-blue-400" : "text-blue-700";
}

export function homeVioletAccentText(isDark: boolean) {
  return isDark ? "text-violet-400" : "text-violet-700";
}
