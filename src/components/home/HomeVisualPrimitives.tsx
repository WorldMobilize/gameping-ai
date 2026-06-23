"use client";

import type { ReactNode } from "react";
import HomeAtmosphere from "@/components/home/HomeAtmosphere";
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

/*
 * Section surfaces use vertical gradients whose top/bottom endpoints all match
 * the page background (#0b0f1a dark / white light). Because every section
 * starts and ends on the same tone, adjacent seams blend into one continuous
 * atmosphere instead of hard background cuts; the mid-stop adds gentle depth.
 */
const DARK_SURFACE = "bg-gradient-to-b from-[#0b0f1a] via-[#0a0e18] to-[#0b0f1a]";
const DARK_SURFACE_ALT = "bg-gradient-to-b from-[#0b0f1a] via-[#0c1120] to-[#0b0f1a]";
const LIGHT_SURFACE = "bg-gradient-to-b from-white via-[#f7f9ff] to-white";
const LIGHT_SURFACE_ALT = "bg-gradient-to-b from-white via-[#f3f8ff] to-white";

const SECTION_BG: Record<HomeSectionTone, SectionBg> = {
  hero: {
    light: "bg-white",
    dark: "bg-[#0b0f1a]",
    blobLightA: "opacity-0",
    blobLightB: "opacity-0",
    blobDarkA: "opacity-0",
    blobDarkB: "opacity-0",
  },
  "how-it-works": {
    light: LIGHT_SURFACE,
    dark: DARK_SURFACE,
    blobLightA: "bg-cyan-200/14 gp-home-blob-drift",
    blobLightB: "bg-teal-200/12 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/7 gp-home-blob-drift",
    blobDarkB: "bg-teal-500/6 gp-home-blob-drift-alt",
  },
  "why-gameping": {
    light: LIGHT_SURFACE_ALT,
    dark: DARK_SURFACE_ALT,
    blobLightA: "bg-cyan-200/12 gp-home-blob-drift",
    blobLightB: "bg-teal-200/10 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/6 gp-home-blob-drift",
    blobDarkB: "bg-teal-500/5 gp-home-blob-drift-alt",
  },
  taste: {
    light: LIGHT_SURFACE,
    dark: DARK_SURFACE,
    blobLightA: "bg-teal-200/12 gp-home-blob-drift",
    blobLightB: "bg-cyan-200/10 gp-home-blob-drift-alt",
    blobDarkA: "bg-teal-500/6 gp-home-blob-drift",
    blobDarkB: "bg-cyan-500/6 gp-home-blob-drift-alt",
  },
  "personal-fit": {
    light: LIGHT_SURFACE_ALT,
    dark: DARK_SURFACE_ALT,
    blobLightA: "bg-cyan-200/12 gp-home-blob-drift",
    blobLightB: "bg-teal-200/9 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/6 gp-home-blob-drift",
    blobDarkB: "bg-teal-500/5 gp-home-blob-drift-alt",
  },
  "gaming-radar": {
    light: LIGHT_SURFACE,
    dark: DARK_SURFACE,
    blobLightA: "bg-cyan-200/14 gp-home-blob-drift",
    blobLightB: "bg-teal-200/12 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/8 gp-home-blob-drift",
    blobDarkB: "bg-teal-500/6 gp-home-blob-drift-alt",
  },
  deals: {
    light: LIGHT_SURFACE_ALT,
    dark: DARK_SURFACE_ALT,
    blobLightA: "bg-teal-200/12 gp-home-blob-drift",
    blobLightB: "bg-cyan-200/10 gp-home-blob-drift-alt",
    blobDarkA: "bg-teal-500/6 gp-home-blob-drift",
    blobDarkB: "bg-cyan-500/6 gp-home-blob-drift-alt",
  },
  "coming-soon": {
    light: LIGHT_SURFACE,
    dark: DARK_SURFACE,
    blobLightA: "bg-cyan-200/12 gp-home-blob-drift",
    blobLightB: "bg-teal-200/10 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/6 gp-home-blob-drift",
    blobDarkB: "bg-teal-500/5 gp-home-blob-drift-alt",
  },
  cta: {
    light: LIGHT_SURFACE,
    dark: DARK_SURFACE,
    blobLightA: "bg-cyan-200/16 gp-home-blob-drift",
    blobLightB: "bg-teal-200/12 gp-home-blob-drift-alt",
    blobDarkA: "bg-cyan-500/8 gp-home-blob-drift",
    blobDarkB: "bg-teal-500/6 gp-home-blob-drift-alt",
  },
};

/*
 * Landing background atmosphere. A theme-aware inline-SVG recreation of the
 * reference (deep navy glass panels, top-down cyan light beams, cyan edge
 * highlights, vignette) renders behind the hero at full strength; the lower
 * sections share the same world but each gets its own softer composition
 * (see the variant docs in HomeAtmosphere.tsx) so the page reads as one
 * coherent AI game-discovery interface without repeating the hero verbatim.
 * Colours are CSS variables (dark + light) in home-light.css.
 */
function SectionPattern({ tone }: { tone: HomeSectionTone }) {
  if (tone === "hero") return <HomeAtmosphere variant="hero" />;
  if (tone === "how-it-works") return <HomeAtmosphere variant="how-it-works" />;
  if (tone === "why-gameping") return <HomeAtmosphere variant="why-gameping" />;
  if (tone === "coming-soon") return <HomeAtmosphere variant="coming-soon" />;
  return null;
}

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
      className={`gp-home-section relative isolate overflow-hidden py-14 sm:py-16 lg:py-20 ${isDark ? bg.dark : bg.light} ${className}`}
    >
      <SectionPattern tone={tone} />
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
          <span className={`ml-2 truncate text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
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
