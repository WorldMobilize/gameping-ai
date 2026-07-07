"use client";

import Link from "next/link";
import HomeHeroCollage from "@/components/home/HomeHeroCollage";
import HomeHeroPartnerMarquee from "@/components/home/HomeHeroPartnerMarquee";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_HERO_DISPLAY_FONT,
  HOME_PRIMARY_CTA_LG,
  homeSecondaryCta,
} from "@/components/home/home-styles";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

const HERO_TRUST_POINTS = ["No login required", "Under a minute", "No credit card"] as const;

export default function HomeHero() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  // Hero copy floats over the fixed dark room, so it stays light in both themes.
  const accent = "text-cyan-400";

  return (
    <HomeSectionShell
      tone="hero"
      className="scroll-mt-0 flex flex-col border-b border-transparent !py-14 sm:!py-16 lg:!py-24"
    >
      <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p
            className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
              isDark
                ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-300"
                : "border-cyan-200/80 bg-cyan-50/80 text-cyan-700"
            }`}
          >
            Discover · Deals · Your taste
          </p>

          <h1
            className={`${HOME_HERO_DISPLAY_FONT} mt-6 text-balance text-[2rem] leading-[1.08] tracking-tight text-slate-50 sm:text-5xl lg:text-[3.25rem]`}
          >
            {/* Line 1 stays intact ("The home") so it never breaks mid-phrase;
             * line 2 may wrap cleanly on the smallest screens. */}
            <span className="block whitespace-nowrap">
              The <span className={accent}>home</span>
            </span>
            <span className="block">for gamers</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 sm:mt-6 sm:text-xl">
            Discover what to play with AI that learns your taste, track the deals that matter,
            and always know what&apos;s next. GamePing is growing into one place for your whole
            gaming life.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
            <Link href="/recommend" className={HOME_PRIMARY_CTA_LG}>
              Try GamePing
            </Link>
            <a href="#how-it-works" className={homeSecondaryCta(isDark)}>
              See how it works
            </a>
          </div>

          <p
            className={`mt-6 text-sm font-medium sm:text-base ${
              isDark ? "text-slate-400" : "text-slate-300"
            }`}
          >
            {HERO_TRUST_POINTS.join(" · ")}
          </p>
        </div>

        <div className="w-full">
          <HomeHeroCollage isDark={isDark} />
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-3xl sm:mt-14">
        <HomeHeroPartnerMarquee />
      </div>
    </HomeSectionShell>
  );
}
