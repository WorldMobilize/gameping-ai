"use client";

import Link from "next/link";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_PRIMARY_CTA_LG,
  HOME_SECTION_TITLE,
  homeCyanAccentText,
  homeSecondaryCta,
} from "@/components/home/home-styles";
import {
  HomeCtaSectionShell,
  HomeProductPanel,
} from "@/components/home/HomeVisualPrimitives";

/** Public discovery pages — internal links for discovery + SEO. */
const DISCOVERY_LINKS = [
  {
    label: "Hidden Gems",
    href: "/hidden-gems",
    blurb: "Underrated games worth your time.",
  },
  {
    label: "Games of the Week",
    href: "/games-of-the-week",
    blurb: "A fresh set of picks, refreshed weekly.",
  },
  {
    label: "Curated collections",
    href: "/curated",
    blurb: "Hand-built lists by theme and mood.",
  },
] as const;

export default function HomeClosing() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const accent = homeCyanAccentText(isDark);

  return (
    <HomeCtaSectionShell>
      {/* Final CTA lives inside a landing-style glass card (not a flat block). */}
      <HomeProductPanel float={false} className="text-center">
        <h2 className={`${HOME_SECTION_TITLE} ${isDark ? "text-slate-50" : "text-slate-900"}`}>
          Ready to find your <span className={accent}>next favorite game</span>?
        </h2>
        <p
          className={`mx-auto mt-4 max-w-xl text-lg leading-relaxed ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Tell GamePing what you feel like playing and get personalized picks with clear
          reasons—in under a minute.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/recommend" className={HOME_PRIMARY_CTA_LG}>
            Try GamePing
          </Link>
          <Link href="/upgrade" className={homeSecondaryCta(isDark)}>
            Explore Premium
          </Link>
        </div>
      </HomeProductPanel>

      <div className="mt-10">
        <h3
          className={`text-center text-base font-bold ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          More ways to discover
        </h3>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {DISCOVERY_LINKS.map((item) => (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                className={`gp-home-card group flex h-full w-full flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
                  isDark ? "gp-home-panel-dark" : "gp-home-panel-light"
                }`}
              >
                <span
                  className={`flex items-center justify-between gap-2 text-base font-bold ${
                    isDark ? "text-slate-50" : "text-slate-900"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${accent}`}
                  >
                    →
                  </span>
                </span>
                <span
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {item.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </HomeCtaSectionShell>
  );
}
