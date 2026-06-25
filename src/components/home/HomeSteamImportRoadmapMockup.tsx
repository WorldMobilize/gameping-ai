"use client";

import { useHomeTheme } from "@/components/home/HomeThemeProvider";

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
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Connected
        </span>
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

const DNA_TRAITS = [
  { label: "Exploration", value: 92 },
  { label: "Story-driven", value: 84 },
  { label: "Challenge", value: 71 },
] as const;

const DNA_LOVES = ["Open worlds", "Player choices", "Progression systems"] as const;

export function HomeTasteMemoryRoadmapMockup() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const panel = isDark
    ? "border-slate-700/80 bg-slate-950/60"
    : "border-slate-200/90 bg-white/80 shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-slate-600";
  const label = isDark ? "text-slate-300" : "text-slate-700";
  const strong = isDark ? "text-slate-100" : "text-slate-900";
  const track = isDark ? "bg-slate-800" : "bg-slate-200";
  const fill = isDark ? "bg-violet-500/80" : "bg-violet-500";
  const chip = isDark
    ? "border-violet-400/25 bg-violet-500/10 text-violet-200"
    : "border-violet-300/70 bg-violet-50 text-violet-700";

  return (
    <div
      aria-hidden
      className={`mt-6 w-full max-w-md rounded-2xl border p-4 sm:p-5 ${panel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${muted}`}>
            Gaming DNA
          </p>
          <p className={`mt-1 text-sm font-bold ${strong}`}>The Explorer</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
          Your profile
        </span>
      </div>

      <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${muted}`}>
        Taste traits
      </p>
      <ul className="mt-2 space-y-2">
        {DNA_TRAITS.map((trait) => (
          <li key={trait.label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className={`font-medium ${label}`}>{trait.label}</span>
              <span className={`tabular-nums ${muted}`}>{trait.value}%</span>
            </div>
            <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${track}`}>
              <div className={`h-full rounded-full ${fill}`} style={{ width: `${trait.value}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${muted}`}>
        You love
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {DNA_LOVES.map((item) => (
          <li
            key={item}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${chip}`}
          >
            {item}
          </li>
        ))}
      </ul>

      <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
        Built from your Steam library, searches, and saved games — it personalizes your
        Weekly Picks, Deals For You, and Monthly Recap.
      </p>
    </div>
  );
}

/** @deprecated Public roadmap no longer shows PING — kept for potential reuse. */
export function HomePingRoadmapMockup() {
  return null;
}
