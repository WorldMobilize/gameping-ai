"use client";

import Link from "next/link";
import { HOME_HOW_CARDS } from "@/components/home/home-demo-data";
import HomeHeroTasteVisual from "@/components/home/HomeHeroTasteVisual";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_BLOCK_BODY,
  HOME_BLOCK_TITLE,
  HOME_PRIMARY_CTA_SM,
  HOME_SECTION_TITLE,
  homeCyanAccentText,
} from "@/components/home/home-styles";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

export default function HomeHowItWorks() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const text = isDark ? "text-slate-50" : "text-slate-900";
  const body = isDark ? "text-slate-400" : "text-slate-600";
  const accent = homeCyanAccentText(isDark);

  return (
    <HomeSectionShell
      tone="how-it-works"
      id="how-it-works"
      ariaLabelledby="how-it-works-title"
      className="scroll-mt-0"
    >
      <header className="mx-auto max-w-2xl text-center">
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

      <ol className="mt-10 grid gap-12 sm:gap-14 lg:mt-12 lg:grid-cols-3 lg:items-stretch lg:gap-10 xl:gap-14">
        {HOME_HOW_CARDS.map((item) => (
          <li key={item.id} className="flex">
            <article className="flex w-full flex-col items-center text-center">
              <h4 className={`${HOME_BLOCK_TITLE} ${text}`}>{item.title}</h4>
              <p className={`${HOME_BLOCK_BODY} max-w-sm flex-1 ${body}`}>{item.summary}</p>
              <Link href={item.href} className={`mt-8 ${HOME_PRIMARY_CTA_SM}`}>
                Learn more
              </Link>
            </article>
          </li>
        ))}
      </ol>
    </HomeSectionShell>
  );
}
