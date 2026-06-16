"use client";

import type { ReactNode } from "react";
import { HOME_WHY_MOCKUPS } from "@/components/home/home-demo-data";
import { homeCyanChip } from "@/components/home/home-styles";

type MiniVisualProps = {
  isDark: boolean;
};

function whyGlassShell(isDark: boolean) {
  return isDark
    ? "border-cyan-400/20 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-violet-950/45 shadow-[0_0_36px_rgba(34,211,238,0.14)]"
    : "border-cyan-200/70 bg-gradient-to-br from-white/95 via-cyan-50/55 to-violet-50/45 shadow-[0_0_28px_rgba(8,145,178,0.12)]";
}

const WHY_MINI_SHELL =
  "gp-home-why-mini mb-5 flex h-[9.375rem] w-[13.75rem] flex-col overflow-hidden rounded-2xl border p-4 backdrop-blur-md";

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
      className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
    >
      {children}
    </p>
  );
}

function TasteOverTagsMiniVisual({ isDark }: MiniVisualProps) {
  const mutedTag = isDark
    ? "border-slate-700/80 bg-slate-800/50 text-slate-500 line-through decoration-slate-600"
    : "border-slate-200 bg-slate-100/80 text-slate-400 line-through decoration-slate-300";
  const signalChip = homeCyanChip(isDark);
  const arrow = isDark ? "text-cyan-400/80" : "text-cyan-600/80";
  const [firstSignal, secondSignal, ...restSignals] = HOME_WHY_MOCKUPS.tasteSignals;

  return (
    <WhyMiniVisualShell isDark={isDark} className="justify-center">
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-full">
          <MiniLabel isDark={isDark}>Store tags</MiniLabel>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {HOME_WHY_MOCKUPS.tasteTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${mutedTag}`}
              >
                {tag}
                <span className="text-[10px] no-underline opacity-70" aria-hidden>
                  ✕
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className={`text-base font-semibold leading-none ${arrow}`} aria-hidden>
          ↓
        </div>

        <div className="w-full">
          <MiniLabel isDark={isDark}>Your taste</MiniLabel>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {firstSignal && secondSignal ? (
              <>
                <span className={`${signalChip} px-2.5 py-1 text-[11px]`}>{firstSignal}</span>
                <span className={`${signalChip} px-2.5 py-1 text-[11px]`}>{secondSignal}</span>
              </>
            ) : null}
          </div>
          {restSignals.length > 0 ? (
            <div className="mt-1 flex justify-center gap-1.5">
              {restSignals.map((signal) => (
                <span key={signal} className={`${signalChip} px-2.5 py-1 text-[11px]`}>
                  {signal}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </WhyMiniVisualShell>
  );
}

function KnowBeforePlayingMiniVisual({ isDark }: MiniVisualProps) {
  const label = isDark ? "text-slate-500" : "text-slate-400";
  const score = isDark ? "text-cyan-300" : "text-cyan-700";
  const check = isDark ? "text-cyan-400" : "text-cyan-600";
  const row = isDark ? "text-slate-300" : "text-slate-600";
  const divider = isDark ? "border-white/10" : "border-slate-200/80";
  const fitReasons = ["Story", "Exploration"] as const;

  return (
    <WhyMiniVisualShell isDark={isDark} className="justify-center">
      <div className="flex w-full flex-col justify-center gap-2">
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${label}`}>Game match</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-[1.65rem] font-extrabold tabular-nums leading-none ${score}`}>
              {HOME_WHY_MOCKUPS.fitScore}%
            </span>
            <span className={`text-xs font-semibold ${score}`}>match</span>
          </div>
        </div>

        <div className={`border-t pt-2 ${divider}`}>
          <p className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${label}`}>
            Why it fits
          </p>
          <ul className="mt-1.5 space-y-1">
            {fitReasons.map((reason) => (
              <li key={reason} className={`flex items-center gap-1.5 text-xs font-medium ${row}`}>
                <span className={`text-xs font-bold ${check}`} aria-hidden>
                  ✓
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </WhyMiniVisualShell>
  );
}

function GamingRadarMiniVisual({ isDark }: MiniVisualProps) {
  const ring = isDark ? "border-cyan-400/40" : "border-cyan-500/35";
  const ringMid = isDark ? "border-cyan-400/28" : "border-cyan-500/25";
  const ringInner = isDark ? "border-violet-400/32" : "border-violet-500/28";
  const dotCyan = isDark
    ? "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
    : "bg-cyan-500 shadow-[0_0_6px_rgba(8,145,178,0.6)]";
  const dotViolet = isDark
    ? "bg-violet-300 shadow-[0_0_7px_rgba(167,139,250,0.7)]"
    : "bg-violet-500 shadow-[0_0_5px_rgba(124,58,237,0.5)]";
  const sweep = isDark
    ? "from-cyan-400/60 via-cyan-300/30 to-transparent"
    : "from-cyan-600/50 via-cyan-500/22 to-transparent";
  const sweepArc = isDark ? "fill-cyan-400/22" : "fill-cyan-500/18";

  return (
    <WhyMiniVisualShell isDark={isDark} className="items-center justify-center p-3">
      <div className="relative h-[7.25rem] w-[7.25rem] shrink-0">
        <div className={`absolute inset-0 rounded-full border ${ring}`} />
        <div className={`absolute inset-[14%] rounded-full border ${ringMid}`} />
        <div className={`absolute inset-[28%] rounded-full border ${ringInner}`} />
        <div
          className={`absolute inset-[28%] rounded-full ${isDark ? "bg-cyan-400/20" : "bg-cyan-500/16"}`}
        />

        <div className="gp-home-why-radar-sweep absolute inset-0 origin-center">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
            <path d="M50 50 L50 8 A42 42 0 0 1 82 68 Z" className={sweepArc} />
          </svg>
          <div
            className={`absolute left-1/2 top-1/2 h-[46%] w-[2.5px] -translate-x-1/2 -translate-y-full rounded-full bg-gradient-to-t ${sweep}`}
          />
        </div>

        <span className={`absolute left-[64%] top-[16%] h-2 w-2 rounded-full ${dotCyan}`} />
        <span className={`absolute left-[22%] top-[38%] h-1.5 w-1.5 rounded-full ${dotViolet}`} />
        <span className={`absolute left-[30%] top-[68%] h-2 w-2 rounded-full ${dotCyan} opacity-90`} />
        <span className={`absolute left-[72%] top-[58%] h-1.5 w-1.5 rounded-full ${dotViolet}`} />

        <span
          className={`gp-home-why-radar-pulse absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            isDark ? "bg-cyan-300/95" : "bg-cyan-500"
          }`}
        />
      </div>
    </WhyMiniVisualShell>
  );
}

export function HomeWhyMiniVisual({ id, isDark }: { id: string; isDark: boolean }) {
  switch (id) {
    case "taste":
      return <TasteOverTagsMiniVisual isDark={isDark} />;
    case "fit":
      return <KnowBeforePlayingMiniVisual isDark={isDark} />;
    case "radar":
      return <GamingRadarMiniVisual isDark={isDark} />;
    default:
      return null;
  }
}
