"use client";

import type { ReactNode } from "react";
import { HOME_WHY_MOCKUPS } from "@/components/home/home-demo-data";

type MiniVisualProps = {
  isDark: boolean;
};

const TASTE_TAGS = [
  "Freedom",
  "Choices",
  "Exploration",
  "Story Rich",
  "RPG",
  "Open World",
] as const;

function tasteChipTone(isDark: boolean, index: number) {
  const darkTones = [
    "border-cyan-400/40 bg-cyan-950/70 text-cyan-200",
    "border-cyan-500/30 bg-slate-800/90 text-cyan-300/90",
    "border-teal-400/30 bg-teal-950/50 text-teal-200",
    "border-sky-400/30 bg-sky-950/45 text-sky-200",
    "border-cyan-400/25 bg-slate-900/80 text-cyan-300",
    "border-emerald-400/25 bg-emerald-950/40 text-emerald-200",
  ];
  const lightTones = [
    "border-cyan-300/80 bg-cyan-50 text-cyan-800",
    "border-sky-200/80 bg-sky-50 text-sky-800",
    "border-teal-200/80 bg-teal-50 text-teal-800",
    "border-cyan-200/70 bg-white text-cyan-700",
    "border-emerald-200/70 bg-emerald-50 text-emerald-800",
    "border-cyan-200/80 bg-cyan-50/80 text-cyan-800",
  ];
  const tones = isDark ? darkTones : lightTones;
  return tones[index % tones.length];
}

function whyGlassShell(isDark: boolean) {
  return isDark
    ? "border-cyan-400/25 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/90 shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
    : "border-cyan-200/70 bg-gradient-to-br from-white/95 via-cyan-50/55 to-violet-50/45 shadow-[0_8px_28px_rgba(8,145,178,0.1),0_0_0_1px_rgba(8,145,178,0.06)]";
}

const WHY_MINI_SHELL =
  "gp-home-why-mini mx-auto mb-5 flex h-[11rem] w-full max-w-[15.5rem] flex-col overflow-hidden rounded-2xl border p-4 backdrop-blur-md";

function WhyMiniVisualShell({
  isDark,
  children,
  className = "",
}: {
  isDark: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${WHY_MINI_SHELL} ${whyGlassShell(isDark)} ${className}`} aria-hidden>
      {children}
    </div>
  );
}

function MiniLabel({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  return (
    <p
      className={`text-[9px] font-bold uppercase tracking-[0.16em] ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
    >
      {children}
    </p>
  );
}

function TasteTagsMiniVisual({ isDark }: MiniVisualProps) {
  return (
    <WhyMiniVisualShell isDark={isDark} className="justify-center py-3.5">
      <div className="w-full px-0.5">
        <MiniLabel isDark={isDark}>Your taste</MiniLabel>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {TASTE_TAGS.map((tag, index) => (
            <span
              key={tag}
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${tasteChipTone(isDark, index)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </WhyMiniVisualShell>
  );
}

function FitCheckIcon({ isDark }: { isDark: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
        isDark ? "bg-cyan-500/25 text-cyan-300" : "bg-cyan-100 text-cyan-700"
      }`}
    >
      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function KnowBeforePlayingMiniVisual({ isDark }: MiniVisualProps) {
  const label = isDark ? "text-slate-500" : "text-slate-400";
  const score = isDark ? "text-cyan-100" : "text-cyan-700";
  const scoreGlow = isDark ? "text-cyan-400/80" : "text-cyan-600/80";
  const row = isDark ? "text-slate-100" : "text-slate-700";
  const divider = isDark ? "border-white/10" : "border-slate-200/80";
  const badge = isDark
    ? "border-emerald-500/35 bg-emerald-950/55 text-emerald-300"
    : "border-emerald-200/80 bg-emerald-50 text-emerald-700";
  const fitReasons = ["Story-rich pacing", "Open-world exploration"] as const;

  return (
    <WhyMiniVisualShell isDark={isDark} className="justify-center py-3.5">
      <div className="flex w-full flex-col justify-center gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${label}`}>Game match</p>
            <div className="mt-1 flex items-end gap-0.5">
              <span className={`text-[2.15rem] font-extrabold tabular-nums leading-none ${score}`}>
                {HOME_WHY_MOCKUPS.fitScore}
              </span>
              <span className={`mb-1 text-base font-extrabold leading-none ${scoreGlow}`}>%</span>
            </div>
          </div>
          <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${badge}`}>
            {HOME_WHY_MOCKUPS.fitLabel}
          </span>
        </div>

        <div className={`border-t pt-2.5 ${divider}`}>
          <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${label}`}>Why it fits</p>
          <ul className="mt-2 space-y-1.5">
            {fitReasons.map((reason) => (
              <li key={reason} className={`flex items-center gap-2 text-[11px] font-medium leading-snug ${row}`}>
                <FitCheckIcon isDark={isDark} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </WhyMiniVisualShell>
  );
}

type RadarPing = {
  top: string;
  left: string;
  delayClass: string;
};

const RADAR_PINGS: RadarPing[] = [
  // Scatter away from center (no near-center pings).
  { top: "24%", left: "22%", delayClass: "gp-home-why-radar-dot-delay-0" }, // upper-left (outer)
  { top: "34%", left: "88%", delayClass: "gp-home-why-radar-dot-delay-1" }, // upper-right / right edge
  { top: "72%", left: "76%", delayClass: "gp-home-why-radar-dot-delay-2" }, // lower-right (mid)
  { top: "88%", left: "54%", delayClass: "gp-home-why-radar-dot-delay-3" }, // lower-middle (outer)
  { top: "70%", left: "28%", delayClass: "gp-home-why-radar-dot-delay-4" }, // lower-left (mid)
];

function GamingRadarMiniVisual({ isDark }: MiniVisualProps) {
  const ring = isDark ? "border-cyan-400/35" : "border-cyan-500/30";
  const ringMid = isDark ? "border-cyan-400/22" : "border-cyan-500/20";
  const ringInner = isDark ? "border-cyan-400/15" : "border-cyan-500/15";
  const sweep = isDark
    ? "from-cyan-400/70 via-cyan-300/35 to-transparent"
    : "from-cyan-600/55 via-cyan-500/25 to-transparent";
  const dotHit = isDark
    ? "bg-cyan-200 gp-home-why-radar-dot gp-home-why-radar-dot-hit"
    : "bg-cyan-600 gp-home-why-radar-dot gp-home-why-radar-dot-hit";
  const hub = isDark ? "bg-cyan-400/25" : "bg-cyan-500/18";

  return (
    <WhyMiniVisualShell isDark={isDark} className="items-center justify-center p-3">
      <div className="relative mx-auto h-[7.75rem] w-[7.75rem] shrink-0">
        <div className={`absolute inset-0 rounded-full border ${ring}`} />
        <div className={`absolute inset-[14%] rounded-full border ${ringMid}`} />
        <div className={`absolute inset-[28%] rounded-full border ${ringInner}`} />
        <div className={`absolute inset-[28%] rounded-full ${hub}`} />

        <div className="gp-home-why-radar-sweep absolute inset-0 origin-center">
          <div
            className={`absolute left-1/2 top-1/2 h-[47%] w-[2px] -translate-x-1/2 -translate-y-full rounded-full bg-gradient-to-t ${sweep}`}
          />
        </div>

        {RADAR_PINGS.map((signal, index) => (
          <div
            key={index}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: signal.top, left: signal.left }}
          >
            <span className={`block h-2 w-2 rounded-full ${dotHit} ${signal.delayClass}`} />
          </div>
        ))}

        {/* Intentionally no center pulse — only sweep-detected pings. */}
      </div>
    </WhyMiniVisualShell>
  );
}

export function HomeWhyMiniVisual({ id, isDark }: { id: string; isDark: boolean }) {
  switch (id) {
    case "taste":
      return <TasteTagsMiniVisual isDark={isDark} />;
    case "fit":
      return <KnowBeforePlayingMiniVisual isDark={isDark} />;
    case "radar":
      return <GamingRadarMiniVisual isDark={isDark} />;
    default:
      return null;
  }
}
