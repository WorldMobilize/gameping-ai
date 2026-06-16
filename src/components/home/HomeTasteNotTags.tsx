"use client";

import { HOME_TASTE_FLOW } from "@/components/home/home-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

function FlowArrow({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col items-center py-2" aria-hidden>
      <div
        className={`gp-home-flow-line h-6 w-px ${isDark ? "bg-violet-500/50" : "bg-violet-300"}`}
      />
      <span className={`text-lg leading-none ${isDark ? "text-violet-400" : "text-violet-500"}`}>↓</span>
    </div>
  );
}

export default function HomeTasteNotTags() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const tagChip = isDark
    ? "rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
    : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600";
  const wantCard = isDark
    ? "border-slate-700 bg-slate-950/60 text-slate-200"
    : "border-slate-100 bg-slate-50/90 text-slate-800";
  const signalChip = isDark
    ? "gp-home-chip-drift rounded-full bg-cyan-950/70 px-3 py-1 text-xs font-bold text-cyan-300"
    : "gp-home-chip-drift rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800";
  const signalChipAlt = isDark
    ? "gp-home-chip-drift-alt rounded-full bg-violet-950/70 px-3 py-1 text-xs font-bold text-violet-300"
    : "gp-home-chip-drift-alt rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800";
  const muted = isDark ? "text-slate-500" : "text-slate-400";
  const text = isDark ? "text-slate-50" : "text-slate-900";
  const body = isDark ? "text-slate-400" : "text-slate-600";

  return (
    <HomeSectionShell tone="taste" ariaLabelledby="taste-not-tags-heading">
      <header className="max-w-2xl">
        <h2
          id="taste-not-tags-heading"
          className={`text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] ${text}`}
        >
          Taste, not just tags
        </h2>
        <p className={`mt-4 text-lg leading-relaxed ${body}`}>
          Genre filters match labels on a store page. GamePing reads the feeling behind what
          you ask for — mood, pacing, freedom, and why you keep playing.
        </p>
      </header>

      <div
        className={`gp-home-card mx-auto mt-10 max-w-xl rounded-[28px] border p-6 sm:p-8 ${
          isDark ? "gp-home-card-dark" : "gp-home-card-light"
        }`}
        aria-label="Taste vs tags explanation"
      >
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${muted}`}>Traditional search</p>
          <p className={`mt-2 text-sm font-medium ${body}`}>Genre</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HOME_TASTE_FLOW.tagGenres.map((tag) => (
              <span key={tag} className={tagChip}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <FlowArrow isDark={isDark} />

        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDark ? "text-violet-300" : "text-violet-600"}`}>
            GamePing
          </p>
          <p className={`mt-2 text-sm font-medium ${body}`}>What you actually want</p>
          <ul className="mt-3 space-y-2">
            {HOME_TASTE_FLOW.whatYouWant.map((line, i) => (
              <li
                key={line}
                className={`rounded-xl border px-3 py-2.5 text-sm ${wantCard} ${i === 1 ? "gp-home-float-delayed" : "gp-home-float"}`}
              >
                &ldquo;{line}&rdquo;
              </li>
            ))}
          </ul>
        </div>

        <FlowArrow isDark={isDark} />

        <div>
          <p className={`text-sm font-semibold ${body}`}>AI understands the feeling behind the request</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HOME_TASTE_FLOW.detectedSignals.map((signal, i) => (
              <span key={signal} className={i % 2 === 0 ? signalChip : signalChipAlt}>
                {signal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </HomeSectionShell>
  );
}
