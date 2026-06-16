export type RecommendCardTheme = "dark" | "light";
export type RecommendCardDensity = "page" | "export" | "demo";

export function recommendResultCardStyles(
  theme: RecommendCardTheme,
  density: RecommendCardDensity,
  emphasizeCyanBorder = false,
) {
  const isExport = density === "export";
  const isDemo = density === "demo";
  const isLight = theme === "light";

  const shellDark = emphasizeCyanBorder
    ? "relative flex w-full flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#0a0b14]/50"
    : "relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b14]/50";

  const shellLight =
    "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm";

  return {
    shell: isLight ? shellLight : shellDark,
    imageWrap: isExport
      ? "h-[300px] w-full overflow-hidden bg-black/40"
      : isDemo
        ? "h-28 w-full overflow-hidden bg-slate-900"
        : "h-52 w-full overflow-hidden bg-black/40",
    imagePlaceholder: isExport ? "h-[300px] text-lg" : isDemo ? "h-28 text-sm" : "h-52",
    bodyPad: isExport ? "flex flex-1 flex-col p-8" : isDemo ? "flex flex-1 flex-col p-3" : "flex flex-1 flex-col p-6",
    rank: isLight
      ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tabular-nums text-slate-500"
      : isExport
        ? "rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm font-semibold tabular-nums text-white/60"
        : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold tabular-nums text-white/60",
    title: isExport
      ? "text-4xl font-black leading-tight tracking-tight"
      : isDemo
        ? "text-base font-bold leading-snug tracking-tight text-slate-900"
        : isLight
          ? "text-2xl font-bold tracking-tight text-slate-900"
          : "text-2xl font-bold tracking-tight",
    fitNote: isLight
      ? "mt-2 text-xs leading-5 text-slate-500"
      : isExport
        ? "mt-3 text-base leading-6 text-white/50"
        : "mt-2 text-xs leading-5 text-white/50",
    badgeTier: isExport ? "rounded-full px-4 py-1.5 text-sm font-bold" : "rounded-full px-3 py-1 text-xs font-bold",
    tierBest: isLight ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80" : "bg-emerald-500/20 text-emerald-200",
    tierAlt: isLight ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80" : "bg-amber-500/25 text-amber-200",
    tierPartial: isLight ? "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80" : "bg-orange-500/25 text-orange-200",
    badgeMatch: isLight
      ? "rounded-full bg-cyan-50 px-3 py-1 text-sm font-bold tabular-nums text-cyan-800 ring-1 ring-cyan-200/80"
      : isExport
        ? "rounded-full bg-cyan-400/12 px-4 py-1.5 text-base font-bold tabular-nums text-cyan-200 ring-1 ring-cyan-400/20"
        : "rounded-full bg-cyan-400/12 px-3 py-1 text-sm font-bold tabular-nums text-cyan-200 ring-1 ring-cyan-400/20",
    budget: isLight
      ? "mt-3 text-xs text-slate-500"
      : isExport
        ? "mt-4 text-sm text-white/45"
        : "mt-3 text-xs text-white/45",
    whyLabel: isLight
      ? "text-xs font-semibold uppercase tracking-[0.15em] text-slate-500"
      : isExport
        ? "text-sm font-semibold uppercase tracking-[0.15em] text-white/40"
        : "text-xs font-semibold uppercase tracking-[0.15em] text-white/40",
    whyBody: isLight
      ? `mt-1.5 text-sm leading-5 text-slate-600${isDemo ? " line-clamp-2" : ""}`
      : isExport
        ? "mt-3 text-lg leading-8 text-white/70"
        : "mt-2 text-sm leading-6 text-white/70",
    whyMeta: isLight
      ? `mt-1.5 text-xs text-slate-400${isDemo ? " line-clamp-1" : ""}`
      : isExport
        ? "mt-3 text-sm text-white/40"
        : "mt-2 text-xs text-white/40",
    cta: isLight
      ? "inline-flex rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/20"
      : isExport
        ? "inline-flex rounded-full bg-cyan-400 px-6 py-3.5 text-base font-bold text-black"
        : "inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-black",
    ctaDivider: isLight ? `mt-auto border-t border-slate-200 ${isDemo ? "pt-3" : "pt-4"}` : "mt-auto border-t border-white/10 pt-5",
    placeholderText: isLight ? "text-slate-400" : "text-white/40",
    placeholderBg: isLight ? "bg-slate-100" : "bg-black/40",
  };
}
