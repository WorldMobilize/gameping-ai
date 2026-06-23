"use client";

import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { homeSoonChip } from "@/components/home/home-styles";

const LIBRARY_ROWS = [
  { title: "Open-world RPG", meta: "142h played", tone: "cyan" as const },
  { title: "Metroidvania", meta: "38h played", tone: "violet" as const },
  { title: "Cozy life sim", meta: "Owned · skip reco", tone: "slate" as const },
] as const;

const PLAYTIME_PATTERNS = [
  { label: "Story-rich", value: 72 },
  { label: "Exploration", value: 88 },
  { label: "Roguelike runs", value: 34 },
] as const;

function toneSwatch(tone: (typeof LIBRARY_ROWS)[number]["tone"], isDark: boolean) {
  if (tone === "cyan") {
    return isDark ? "from-cyan-500/35 to-cyan-400/10" : "from-cyan-400/30 to-cyan-100/60";
  }
  if (tone === "violet") {
    return isDark ? "from-violet-500/35 to-violet-400/10" : "from-violet-400/25 to-violet-100/55";
  }
  return isDark ? "from-slate-600/40 to-slate-700/20" : "from-slate-300/50 to-slate-100/70";
}

export function HomeSteamImportRoadmapMockup() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const soonBadge = homeSoonChip(isDark);

  const panel = isDark
    ? "border-slate-700/80 bg-slate-950/60"
    : "border-slate-200/90 bg-white/80 shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-slate-600";
  const label = isDark ? "text-slate-300" : "text-slate-700";
  const rowBg = isDark ? "bg-slate-900/55" : "bg-slate-50/90";
  const track = isDark ? "bg-slate-800" : "bg-slate-200";
  const fill = isDark ? "bg-cyan-500/80" : "bg-cyan-500";

  return (
    <div
      aria-hidden
      className={`mt-6 w-full max-w-md rounded-2xl border p-4 sm:p-5 ${panel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${muted}`}>
            Connected account
          </p>
          <p className={`mt-1 text-sm font-bold ${label}`}>Steam</p>
        </div>
        <span className={`shrink-0 uppercase tracking-wide ${soonBadge}`}>Coming soon</span>
      </div>

      <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${muted}`}>
        Library analysis preview
      </p>

      <ul className="mt-2 space-y-2">
        {LIBRARY_ROWS.map((row) => (
          <li
            key={row.title}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              isDark ? "border-slate-800" : "border-slate-100"
            } ${rowBg}`}
          >
            <div
              className={`h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br ${toneSwatch(row.tone, isDark)}`}
            />
            <div className="min-w-0 flex-1 text-left">
              <p className={`truncate text-sm font-semibold ${label}`}>{row.title}</p>
              <p className={`text-xs ${muted}`}>{row.meta}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${muted}`}>
        Playtime patterns
      </p>
      <ul className="mt-2 space-y-2">
        {PLAYTIME_PATTERNS.map((pattern) => (
          <li key={pattern.label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className={`font-medium ${label}`}>{pattern.label}</span>
              <span className={`tabular-nums ${muted}`}>{pattern.value}%</span>
            </div>
            <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${track}`}>
              <div className={`h-full rounded-full ${fill}`} style={{ width: `${pattern.value}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
        Owned games help GamePing avoid recommending titles you already have.
      </p>
    </div>
  );
}

export function HomeTasteMemoryRoadmapMockup() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const panel = isDark
    ? "border-slate-700/80 bg-slate-950/60"
    : "border-slate-200/90 bg-white/80 shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-slate-600";
  const label = isDark ? "text-slate-300" : "text-slate-700";
  const filled = isDark ? "bg-violet-500/75" : "bg-violet-500";
  const empty = isDark ? "bg-slate-800" : "bg-slate-200";

  const bars = [
    { label: "Exploration", bars: 5 },
    { label: "Story", bars: 4 },
    { label: "Strategy", bars: 2 },
  ] as const;

  return (
    <div
      aria-hidden
      className={`mt-6 w-full max-w-md rounded-2xl border p-4 sm:p-5 ${panel}`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${muted}`}>
        Taste profile preview
      </p>
      <ul className="mt-3 space-y-2.5">
        {bars.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <span className={`w-24 shrink-0 text-left text-xs font-medium ${label}`}>
              {row.label}
            </span>
            <div className="flex flex-1 gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-sm ${i < row.bars ? filled : empty}`}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @deprecated Public roadmap no longer shows PING — kept for potential reuse. */
export function HomePingRoadmapMockup() {
  return null;
}
