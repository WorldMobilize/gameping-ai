"use client";

import type { ReactNode } from "react";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";

export type HomeSectionTone =
  | "hero"
  | "how-it-works"
  | "why-gameping"
  | "taste"
  | "personal-fit"
  | "gaming-radar"
  | "deals"
  | "coming-soon"
  | "cta";

type SectionBg = {
  light: string;
  dark: string;
  blobLightA: string;
  blobLightB: string;
  blobLightC?: string;
  blobDarkA: string;
  blobDarkB: string;
  blobDarkC?: string;
};

const SECTION_BG: Record<HomeSectionTone, SectionBg> = {
  hero: {
    light: "bg-white",
    dark: "bg-[#0b0f1a]",
    blobLightA: "bg-cyan-200/18 gp-home-blob-drift",
    blobLightB: "bg-violet-200/14 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/8 gp-home-blob-drift",
    blobDarkB: "bg-violet-500/6 gp-home-blob-drift-alt",
  },
  "how-it-works": {
    light: "bg-white",
    dark: "bg-[#0a0e18]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  "why-gameping": {
    light: "bg-white",
    dark: "bg-[#0b0f1a]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  taste: {
    light: "bg-white",
    dark: "bg-[#0b0f1a]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  "personal-fit": {
    light: "bg-[#FAFBFF]",
    dark: "bg-[#0a0e18]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  "gaming-radar": {
    light: "bg-white",
    dark: "bg-[#0b0f1a]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  deals: {
    light: "bg-[#FAFBFF]",
    dark: "bg-[#0a0e18]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  "coming-soon": {
    light: "bg-white",
    dark: "bg-[#0a0e18]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  cta: {
    light: "bg-white",
    dark: "bg-[#0b0f1a]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
};

function SectionBlobs({ bg, isDark }: { bg: SectionBg; isDark: boolean }) {
  const blobA = isDark ? bg.blobDarkA : bg.blobLightA;
  const blobB = isDark ? bg.blobDarkB : bg.blobLightB;
  const blobC = isDark ? bg.blobDarkC : bg.blobLightC;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {!blobA.includes("opacity-0") ? (
        <div className={`absolute -left-20 top-8 h-56 w-56 rounded-full blur-3xl ${blobA}`} />
      ) : null}
      {!blobB.includes("opacity-0") ? (
        <div className={`absolute -right-16 bottom-4 h-48 w-48 rounded-full blur-3xl ${blobB}`} />
      ) : null}
      {blobC && !blobC.includes("opacity-0") ? (
        <div className={`absolute left-1/3 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full blur-3xl ${blobC}`} />
      ) : null}
    </div>
  );
}

type HomeSectionShellProps = {
  tone: HomeSectionTone;
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabelledby?: string;
};

export function HomeSectionShell({
  tone,
  children,
  className = "",
  id,
  ariaLabelledby,
}: HomeSectionShellProps) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const bg = SECTION_BG[tone];

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={`relative isolate overflow-hidden py-14 sm:py-16 lg:py-20 ${isDark ? bg.dark : bg.light} ${className}`}
    >
      <SectionBlobs bg={bg} isDark={isDark} />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

type HomeProductPanelProps = {
  children: ReactNode;
  kicker?: string;
  className?: string;
  float?: boolean;
};

/** Clean GamePing-style panel — no fake browser chrome. */
export function HomeProductPanel({
  children,
  kicker,
  className = "",
  float = true,
}: HomeProductPanelProps) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`gp-home-card relative overflow-hidden rounded-[24px] border ${
        float ? "gp-home-panel-float" : ""
      } ${isDark ? "gp-home-panel-dark" : "gp-home-panel-light"} ${className}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08),transparent_50%)]"
            : "bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.06),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.06),transparent_50%)]"
        }`}
      />
      <div className="relative p-5 sm:p-6">
        {kicker ? (
          <p
            className={`mb-4 text-[11px] font-bold uppercase tracking-[0.16em] ${
              isDark ? "text-cyan-400" : "text-cyan-700"
            }`}
          >
            {kicker}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type HomeMockupFrameProps = {
  children: ReactNode;
  label?: string;
  className?: string;
  float?: boolean;
};

export function HomeMockupFrame({ children, label, className = "", float = true }: HomeMockupFrameProps) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`gp-home-card overflow-hidden rounded-[20px] border ${
        float ? "gp-home-panel-float" : ""
      } ${isDark ? "gp-home-panel-dark" : "gp-home-panel-light"} ${className}`}
    >
      <div
        className={`flex items-center gap-2 border-b px-3 py-2 ${
          isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-100 bg-slate-50/90"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-rose-400/80" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80" aria-hidden />
        {label ? (
          <span className={`ml-2 truncate text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {label}
          </span>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function HomeGameCover({
  emoji,
  gradient,
  className = "",
}: {
  emoji: string;
  gradient: string;
  className?: string;
}) {
  return (
    <div
      className={`flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br text-3xl shadow-inner ${gradient} ${className}`}
      aria-hidden
    >
      {emoji}
    </div>
  );
}

export function HomeMatchBadge({
  children,
  className = "",
  shimmer = true,
}: {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
}) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
        shimmer ? "gp-home-badge-shimmer" : ""
      } ${
        isDark
          ? "bg-gradient-to-r from-cyan-900/80 via-cyan-800/90 to-cyan-900/80 text-cyan-200"
          : "bg-gradient-to-r from-cyan-100 via-cyan-50 to-cyan-100 text-cyan-800"
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function HomeCtaSectionShell({ children }: { children: ReactNode }) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const bg = SECTION_BG.cta;

  return (
    <section className={`relative overflow-hidden py-16 sm:py-20 lg:py-24 ${isDark ? bg.dark : bg.light}`}>
      <SectionBlobs bg={bg} isDark={isDark} />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
