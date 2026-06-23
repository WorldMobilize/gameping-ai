"use client";

import { useHomeTheme } from "@/components/home/HomeThemeProvider";

const HERO_GAME_DATA_SOURCES = ["Steam", "RAWG", "IsThereAnyDeal", "CheapShark"] as const;

export default function HomeHeroPartnerMarquee() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <div className="w-full opacity-90">
      <p
        className={`text-center text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px] ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Searching across game data &amp; deal sources
      </p>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {HERO_GAME_DATA_SOURCES.map((source) => (
          <li key={source}>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight sm:px-3.5 sm:py-1.5 sm:text-xs ${
                isDark
                  ? "border-slate-700/60 bg-slate-900/35 text-slate-300"
                  : "border-slate-200/80 bg-slate-50/80 text-slate-700"
              }`}
            >
              {source}
            </span>
          </li>
        ))}
      </ul>

      <p
        className={`mt-3 text-center text-[11px] leading-relaxed sm:text-xs ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Data and prices may vary by store and region.
      </p>
    </div>
  );
}
