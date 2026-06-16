"use client";

import { HomeWhyMiniVisual } from "@/components/home/HomeWhyMiniVisuals";
import { HOME_WHY_MOCKUPS, HOME_WHY_SIMPLE } from "@/components/home/home-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_BLOCK_BODY,
  HOME_BLOCK_TITLE,
  HOME_SECTION_LEAD,
  HOME_SECTION_TITLE,
  homeCyanAccentText,
  homeCyanChip,
  homeSoonChip,
} from "@/components/home/home-styles";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

function TasteInline({ isDark }: { isDark: boolean }) {
  const muted = isDark ? "text-slate-500" : "text-slate-500";
  const tagChip = isDark ? "text-sm text-slate-500 line-through" : "text-sm text-slate-400 line-through";
  const signalChip = homeCyanChip(isDark);

  return (
    <div className="mt-6 space-y-2">
      <p className={tagChip}>{HOME_WHY_MOCKUPS.tasteTags.join(" · ")}</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {HOME_WHY_MOCKUPS.tasteSignals.map((signal) => (
          <span key={signal} className={signalChip}>
            {signal}
          </span>
        ))}
      </div>
      <p className={`text-xs ${muted}`}>Signals GamePing reads instead</p>
    </div>
  );
}

function FitInline({ isDark }: { isDark: boolean }) {
  const muted = isDark ? "text-slate-500" : "text-slate-500";
  const score = homeCyanAccentText(isDark);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-center gap-2">
        <span className={`text-2xl font-extrabold tabular-nums ${score}`}>
          {HOME_WHY_MOCKUPS.fitScore}%
        </span>
        <span className={`text-sm font-semibold ${score}`}>{HOME_WHY_MOCKUPS.fitLabel}</span>
      </div>
      <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        Why you may like it — on every game page
      </p>
      <p className={`mt-1 text-xs ${muted}`}>Before you buy or download</p>
    </div>
  );
}

function RadarInline({ isDark }: { isDark: boolean }) {
  const text = isDark ? "text-slate-200" : "text-slate-800";
  const accent = homeCyanAccentText(isDark);
  const soonChip = homeSoonChip(isDark);
  const { radar } = HOME_WHY_MOCKUPS;

  return (
    <div className="mt-6 space-y-2">
      <p className={`text-sm font-semibold ${text}`}>
        {radar.game}{" "}
        <span className={`text-sm font-semibold ${accent}`}>· {radar.alert}</span>
      </p>
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
        Because you like {radar.because.join(" and ")}
      </p>
      <span className={`inline-flex ${soonChip}`}>Taste alerts · coming soon</span>
    </div>
  );
}

const INLINES = [TasteInline, FitInline, RadarInline] as const;

function whyCardTitle(id: (typeof HOME_WHY_SIMPLE)[number]["id"], isDark: boolean) {
  const accent = homeCyanAccentText(isDark);
  if (id === "taste") {
    return (
      <>
        <span className={accent}>Taste</span> over tags
      </>
    );
  }
  if (id === "fit") {
    return (
      <>
        <span className={accent}>Know before</span> playing
      </>
    );
  }
  return (
    <>
      Your gaming <span className={accent}>radar</span>
    </>
  );
}

function WhyMiniVisual({ id, isDark }: { id: string; isDark: boolean }) {
  return <HomeWhyMiniVisual id={id} isDark={isDark} />;
}

export default function HomeFeatureCards() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const text = isDark ? "text-slate-50" : "text-slate-900";
  const body = isDark ? "text-slate-400" : "text-slate-600";
  const accent = homeCyanAccentText(isDark);

  return (
    <HomeSectionShell tone="why-gameping" ariaLabelledby="why-gameping-heading">
      <header className="mx-auto max-w-2xl text-center">
        <h2 id="why-gameping-heading" className={`${HOME_SECTION_TITLE} ${text}`}>
          <span className={accent}>Why</span> GamePing
        </h2>
        <p className={`${HOME_SECTION_LEAD} ${body}`}>
          Better picks because GamePing reads taste — not just store tags.
        </p>
      </header>

      <ul className="mt-14 grid gap-12 sm:gap-14 lg:grid-cols-3 lg:items-start lg:gap-10 xl:gap-14">
        {HOME_WHY_SIMPLE.map((prop, i) => {
          const Inline = INLINES[i];

          return (
            <li key={prop.id} className="h-full">
              <article className="flex h-full flex-col items-center text-center">
                <WhyMiniVisual id={prop.id} isDark={isDark} />
                <h3 className={`${HOME_BLOCK_TITLE} min-h-[2rem] ${text}`}>
                  {whyCardTitle(prop.id, isDark)}
                </h3>
                <p className={`${HOME_BLOCK_BODY} min-h-[5.5rem] max-w-sm ${body}`}>{prop.detail}</p>
                <Inline isDark={isDark} />
              </article>
            </li>
          );
        })}
      </ul>
    </HomeSectionShell>
  );
}
