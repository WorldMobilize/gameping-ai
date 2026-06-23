"use client";

import Link from "next/link";
import { HOME_HOW_CARDS } from "@/components/home/home-demo-data";
import HomeHeroTasteVisual from "@/components/home/HomeHeroTasteVisual";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_BLOCK_BODY,
  HOME_BLOCK_TITLE,
  HOME_DISPLAY_FONT,
  HOME_SECTION_TITLE,
} from "@/components/home/home-styles";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

export default function HomeHowItWorks() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  // On-background ("HUD") text floats over the fixed dark cinematic room, so it
  // stays light in BOTH themes (these are the dark-mode values — dark mode is
  // unchanged; light mode now matches instead of going dark-on-dark).
  const text = "text-slate-50";
  // Step descriptions are real explanatory copy over the cinematic background —
  // slate-300 keeps them comfortably readable rather than faint.
  const body = "text-slate-300";
  const accent = "text-cyan-400";

  return (
    <HomeSectionShell
      tone="how-it-works"
      id="how-it-works"
      ariaLabelledby="how-it-works-title"
      className="scroll-mt-0"
    >
      <header className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 id="how-it-works-title" className={`${HOME_SECTION_TITLE} ${text}`}>
          How GamePing <span className={accent}>works</span>
        </h2>
      </header>

      <div className="mx-auto mt-10 max-w-5xl sm:mt-12">
        <HomeHeroTasteVisual />
      </div>

      <h3
        className={`${HOME_SECTION_TITLE} mx-auto mt-12 max-w-3xl text-center leading-snug sm:mt-14 ${text}`}
      >
        Three steps from your taste to your next favorite game.
      </h3>

      {/*
       * Open, un-boxed steps: no card container or heavy border — just a cyan
       * step number, copy, and a light text link, with a faint divider between
       * columns on large screens so the section reads as part of the cinematic
       * background instead of three rectangles sitting on top of it.
       */}
      <ol className="mt-12 grid gap-10 sm:gap-12 lg:mt-14 lg:grid-cols-3 lg:items-start lg:gap-8 xl:gap-12">
        {HOME_HOW_CARDS.map((item, i) => (
          <li key={item.id} className="relative flex">
            {i > 0 ? (
              <span
                aria-hidden
                className="absolute -left-1 top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-transparent via-white/12 to-transparent lg:block xl:-left-3"
              />
            ) : null}
            <div className="flex w-full flex-col items-center px-2 text-center sm:px-4">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border text-base font-bold tabular-nums ${HOME_DISPLAY_FONT} ${
                  isDark
                    ? "border-cyan-400/30 bg-cyan-950/40 text-cyan-300"
                    : "border-cyan-200/80 bg-cyan-50 text-cyan-700"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h4 className={`${HOME_BLOCK_TITLE} mt-5 ${text}`}>{item.title}</h4>
              <p className={`${HOME_BLOCK_BODY} max-w-sm ${body}`}>{item.summary}</p>
              <Link
                href={item.href}
                className={`group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-all ${accent} hover:gap-2.5`}
              >
                Learn more
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 8h9M8.5 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </HomeSectionShell>
  );
}
