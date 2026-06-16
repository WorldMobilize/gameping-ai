"use client";

import Link from "next/link";
import { HOME_FUTURE_ROADMAP } from "@/components/home/home-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HomeSteamImportRoadmapMockup,
  HomeTasteMemoryRoadmapMockup,
} from "@/components/home/HomeSteamImportRoadmapMockup";
import {
  HOME_BLOCK_BODY,
  HOME_BLOCK_TITLE,
  HOME_PRIMARY_CTA_COMPACT,
  HOME_SECTION_TITLE,
  homeCyanAccentText,
  homeSoonChip,
} from "@/components/home/home-styles";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

function roadmapMockup(id: (typeof HOME_FUTURE_ROADMAP)[number]["id"]) {
  if (id === "steam-import") return <HomeSteamImportRoadmapMockup />;
  if (id === "taste-memory") return <HomeTasteMemoryRoadmapMockup />;
  return null;
}

export default function HomeComingSoon() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const text = isDark ? "text-slate-50" : "text-slate-900";
  const body = isDark ? "text-slate-400" : "text-slate-600";
  const accent = homeCyanAccentText(isDark);
  const soonBadge = homeSoonChip(isDark);
  const chip = isDark
    ? "inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/50 px-3 py-1 text-xs font-medium leading-none text-slate-300"
    : "inline-flex items-center rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium leading-none text-slate-600 shadow-sm";

  return (
    <HomeSectionShell tone="coming-soon" ariaLabelledby="future-roadmap-heading">
      <header className="max-w-2xl">
        <span className={`inline-flex uppercase tracking-wide ${soonBadge}`}>Coming soon</span>
        <h2
          id="future-roadmap-heading"
          className={`${HOME_SECTION_TITLE} mt-3 text-2xl sm:text-3xl ${text}`}
        >
          GamePing gets <span className={accent}>smarter</span> with you
        </h2>
        <p className={`mt-3 max-w-xl text-base leading-relaxed sm:text-lg ${body}`}>
          Steam import and taste memory are planned features — not live yet.
        </p>
      </header>

      <ul className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
        {HOME_FUTURE_ROADMAP.map((item) => (
          <li key={item.id} className="flex h-full">
            <article className="flex h-full w-full flex-col">
              <h3 className={`${HOME_BLOCK_TITLE} ${text}`}>{item.title}</h3>
              <p className={`${HOME_BLOCK_BODY} max-w-md ${body}`}>{item.detail}</p>
              <ul className="mt-6 flex flex-wrap items-center gap-2">
                {item.chips.map((label) => (
                  <li key={label} className="flex">
                    <span className={chip}>{label}</span>
                  </li>
                ))}
              </ul>
              <Link href={item.href} className={`mt-8 w-auto self-start !px-6 ${HOME_PRIMARY_CTA_COMPACT}`}>
                Read more
              </Link>
              {roadmapMockup(item.id)}
            </article>
          </li>
        ))}
      </ul>
    </HomeSectionShell>
  );
}
