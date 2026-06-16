"use client";

import { HOME_PERSONAL_FIT_MOCK } from "@/components/home/home-demo-data";
import { HomeGameCoverImage } from "@/components/home/HomeGameCoverImage";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { HomeProductPanel, HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

export default function HomePersonalFit() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const game = HOME_PERSONAL_FIT_MOCK;

  return (
    <HomeSectionShell tone="personal-fit" ariaLabelledby="know-before-play-heading">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <header>
          <h2
            id="know-before-play-heading"
            className={`text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] ${isDark ? "text-slate-50" : "text-slate-900"}`}
          >
            Know if a game fits you
          </h2>
          <p className={`mt-4 max-w-md text-lg leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            On every game page, GamePing explains whether a title fits what you&apos;re looking for
            — in plain language, with honest trade-offs before you buy.
          </p>
        </header>

        <div aria-label="Personal fit preview">
          <HomeProductPanel kicker="Personal fit" float={false}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <HomeGameCoverImage
                src={game.image}
                alt={`${game.title} cover art`}
                size="showcase"
                fallbackClassName={game.fallback}
                priority
                className="mx-auto w-full max-w-[9rem] sm:mx-0 sm:shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? "text-slate-50" : "text-slate-900"}`}>
                      {game.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">Based on your search context</p>
                  </div>
                  <div
                    className={`shrink-0 rounded-[16px] px-3 py-2 text-right ${isDark ? "bg-emerald-950/70" : "bg-emerald-100"}`}
                  >
                    <p className={`text-[10px] font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                      {game.fitLabel}
                    </p>
                    <p
                      className={`text-xl font-extrabold tabular-nums ${isDark ? "text-emerald-200" : "text-emerald-800"}`}
                    >
                      {game.fitScore}%
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Why it might fit you
                    </p>
                    <ul className={`mt-2 space-y-2.5 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {game.likes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`rounded-xl border px-3 py-2.5 ${isDark ? "border-amber-800/40 bg-amber-950/30" : "border-amber-200 bg-amber-50/80"}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Potential concern
                    </p>
                    <p className={`mt-1.5 text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {game.concerns[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </HomeProductPanel>
        </div>
      </div>
    </HomeSectionShell>
  );
}
