/** Shared homepage typography and CTA classes. */

export const HOME_DISPLAY_FONT = "gp-home-display";

export const HOME_HERO_DISPLAY_FONT = "gp-home-hero-display";

export const HOME_SECTION_TITLE =
  `text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] ${HOME_DISPLAY_FONT}`;

export const HOME_SECTION_LEAD = "mt-4 text-lg leading-relaxed sm:text-xl";

export const HOME_BLOCK_TITLE =
  `text-xl font-bold sm:text-[1.35rem] ${HOME_DISPLAY_FONT}`;

export const HOME_BLOCK_BODY = "mt-3 text-base leading-relaxed";

export const HOME_PRIMARY_CTA_BASE =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-600/30";

export const HOME_PRIMARY_CTA_LG = `${HOME_PRIMARY_CTA_BASE} px-8 py-3.5 text-base`;

export const HOME_PRIMARY_CTA_SM = `${HOME_PRIMARY_CTA_BASE} px-5 py-2.5 text-sm`;

/** Compact cyan CTA — secondary actions (e.g. Read more). */
export const HOME_PRIMARY_CTA_COMPACT =
  "inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-md shadow-cyan-600/15 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-600/20";

export const HOME_SECONDARY_CTA_BASE =
  "inline-flex items-center justify-center rounded-full border font-semibold shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md";

export function homeSecondaryCta(isDark: boolean, size: "lg" | "sm" = "lg") {
  const sizing = size === "lg" ? "px-8 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return isDark
    ? `${HOME_SECONDARY_CTA_BASE} ${sizing} border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-900`
    : `${HOME_SECONDARY_CTA_BASE} ${sizing} border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white`;
}

export function homeTrustCheck(isDark: boolean) {
  return isDark
    ? "bg-cyan-950/80 text-cyan-400"
    : "bg-cyan-100 text-cyan-700";
}

/** Primary cyan chip — active product signals */
export function homeCyanChip(isDark: boolean) {
  return isDark
    ? "rounded-full border border-cyan-800/60 bg-cyan-950/50 px-2.5 py-1 text-xs font-medium text-cyan-300"
    : "rounded-full border border-cyan-200/80 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-800";
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
  return isDark ? "text-cyan-400" : "text-cyan-700";
}

export function homeVioletAccentText(isDark: boolean) {
  return isDark ? "text-violet-400" : "text-violet-700";
}
