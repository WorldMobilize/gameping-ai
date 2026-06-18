"use client";

import PingOrb from "@/components/home/PingOrb";
import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

const PANEL_TONES = ["violet", "mint", "coral", "amber"] as const;

export default function HomePingPanel() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <div className="gp-home-ping-panel w-full min-w-0">
      <div className="gp-home-showcase-card">
        <span className="gp-home-showcase-glow gp-showcase-glow-mint" aria-hidden />
        <span className="gp-home-showcase-glow gp-showcase-glow-violet" aria-hidden />
        <span className="gp-home-showcase-glow gp-showcase-glow-coral" aria-hidden />

        <div className="gp-home-showcase-inner">
          <div className="flex flex-col items-center text-center">
            <PingOrb size={300} variant="showcase" />
            <p
              className={`gp-home-ping-wordmark mt-2 text-[1.65rem] font-bold tracking-[0.32em] ${
                isDark ? "text-teal-100" : "text-teal-800"
              }`}
            >
              PING
            </p>
            <p className={`mt-1.5 text-sm ${isDark ? "text-white/55" : "text-slate-600"}`}>
              Your game discovery companion
            </p>
          </div>

          <blockquote
            className={`gp-home-ping-quote mx-auto mt-8 max-w-[20rem] text-center text-[15px] leading-[1.7] ${
              isDark ? "text-white/80" : "text-slate-700"
            }`}
          >
            &ldquo;I don&apos;t just look at tags. I learn{" "}
            <span className="gp-home-accent-text font-semibold">why</span> you play.&rdquo;
          </blockquote>

          <ul className="mt-8 grid grid-cols-2 gap-3 min-[480px]:grid-cols-4 min-[480px]:gap-2.5">
            {HOME_VALUE_PROPS.map((prop, i) => {
              const tone = PANEL_TONES[i % 4];
              return (
                <li
                  key={prop.id}
                  className={`gp-home-mini-card gp-mini-${tone} flex flex-col items-center rounded-[1.15rem] px-3 py-4 text-center`}
                >
                  <span className="gp-home-mini-icon flex h-12 w-12 items-center justify-center rounded-full">
                    <HomeValuePropIcon id={prop.id} />
                  </span>
                  <p className={`gp-mini-title gp-mini-title-${tone} mt-3 text-[12px] font-semibold leading-snug`}>
                    {prop.label}
                  </p>
                  <p className={`mt-1.5 text-[11px] leading-4 ${isDark ? "text-white/50" : "text-slate-600"}`}>
                    {prop.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
