"use client";

import HomeWhyCarousel from "@/components/home/HomeWhyCarousel";
import {
  HOME_SECTION_LEAD,
  HOME_SECTION_TITLE,
} from "@/components/home/home-styles";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

export default function HomeFeatureCards() {
  // On-background header text stays light in both themes (the room is dark).
  const text = "text-slate-50";
  // Lead copy over the cinematic background — slate-300 reads clearly.
  const body = "text-slate-300";
  const accent = "text-cyan-400";

  return (
    <HomeSectionShell tone="why-gameping" ariaLabelledby="why-gameping-heading">
      <header className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 id="why-gameping-heading" className={`${HOME_SECTION_TITLE} ${text}`}>
          <span className={accent}>Why</span> GamePing
        </h2>
        <p className={`${HOME_SECTION_LEAD} ${body}`}>
          Better picks because GamePing reads taste — not just store tags.
        </p>
      </header>

      <HomeWhyCarousel />
    </HomeSectionShell>
  );
}
