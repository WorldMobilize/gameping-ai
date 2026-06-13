"use client";

import { useEffect, useState } from "react";
import {
  HOME_DEMO_PICKS,
  HOME_DEMO_SCENARIOS,
} from "@/components/home/home-demo-data";

type DemoPhase = "idle" | "typing" | "thinking" | "results";

export default function HomeProductDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [typedLength, setTypedLength] = useState(0);

  const scenario = HOME_DEMO_SCENARIOS[scenarioIndex] ?? HOME_DEMO_SCENARIOS[0];
  const prompt = scenario.prompt;
  const highlightIndex = scenario.highlightIndex;

  useEffect(() => {
    setPhase("typing");
    setTypedLength(0);
  }, [scenarioIndex]);

  useEffect(() => {
    if (phase !== "typing") return;

    if (typedLength >= prompt.length) {
      const t = window.setTimeout(() => setPhase("thinking"), 400);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setTypedLength((n) => Math.min(n + 1, prompt.length));
    }, 28);
    return () => window.clearTimeout(t);
  }, [phase, typedLength, prompt.length]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(() => setPhase("results"), 900);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "results") return;
    const t = window.setTimeout(() => {
      setScenarioIndex((i) => (i + 1) % HOME_DEMO_SCENARIOS.length);
    }, 4800);
    return () => window.clearTimeout(t);
  }, [phase, scenarioIndex]);

  const displayedPrompt = prompt.slice(0, typedLength);
  const showResults = phase === "results";
  const showThinking = phase === "thinking";

  return (
    <div
      className="gp-home-demo relative mx-auto w-full max-w-lg lg:max-w-none"
      aria-hidden
    >
      <div className="absolute -inset-px rounded-[1.35rem] bg-gradient-to-b from-cyan-400/20 via-transparent to-transparent opacity-60" />

      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#080910] shadow-2xl shadow-black/40">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0c0d14] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <p className="text-[11px] font-medium tracking-wide text-white/35">
            gameping.ai / recommend
          </p>
          <div className="w-12" aria-hidden />
        </div>

        <div className="p-4 md:p-5">
          {/* Prompt mock */}
          <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Your search
            </p>
            <p className="gp-home-demo-prompt mt-2 min-h-[3.25rem] text-[15px] leading-relaxed text-white/85">
              {displayedPrompt}
              {phase === "typing" && typedLength < prompt.length ? (
                <span className="gp-home-demo-cursor ml-0.5 inline-block h-4 w-0.5 align-middle bg-cyan-400" />
              ) : null}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-white/30">Sample demo</span>
              <span
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  showThinking
                    ? "bg-cyan-400/20 text-cyan-200"
                    : "bg-cyan-400 text-black"
                }`}
              >
                {showThinking ? "Finding picks…" : "Get my picks"}
              </span>
            </div>
          </div>

          {/* Results */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Curated picks
              </p>
              {showThinking ? (
                <span className="gp-home-demo-pulse text-[11px] text-cyan-200/80">
                  Matching taste…
                </span>
              ) : showResults ? (
                <span className="text-[11px] tabular-nums text-white/40">3 of 5</span>
              ) : null}
            </div>

            {HOME_DEMO_PICKS.map((pick, index) => {
              const isHighlight = index === highlightIndex;
              const visible = showResults || (showThinking && index === 0);

              return (
                <article
                  key={pick.title}
                  className={`gp-home-demo-pick overflow-hidden rounded-xl border transition-all duration-500 motion-reduce:transition-none ${
                    visible
                      ? "max-h-40 opacity-100 translate-y-0"
                      : "max-h-0 opacity-0 -translate-y-1 border-transparent p-0"
                  } ${
                    showResults && isHighlight
                      ? "border-cyan-400/30 bg-cyan-400/[0.06] shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                      : showResults
                        ? "border-white/[0.06] bg-white/[0.02]"
                        : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                  style={{
                    transitionDelay: showResults ? `${index * 80}ms` : "0ms",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                        {pick.tag}
                      </p>
                      <h3 className="mt-0.5 truncate text-base font-bold tracking-tight">
                        {pick.title}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ${
                        isHighlight && showResults
                          ? "bg-cyan-400/15 text-cyan-100 ring-cyan-400/30"
                          : "bg-white/[0.04] text-white/55 ring-white/10"
                      }`}
                    >
                      {pick.match}%
                    </span>
                  </div>
                  {showResults && isHighlight ? (
                    <div className="border-t border-white/[0.06] px-3.5 py-2.5">
                      <p className="text-xs leading-5 text-white/55">{pick.reason}</p>
                      <p className="mt-2 text-[11px] text-white/35">
                        Best price{" "}
                        <span className="font-semibold tabular-nums text-cyan-200/90">
                          {pick.price}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        {/* Scenario dots */}
        <div className="flex justify-center gap-1.5 border-t border-white/[0.06] py-3">
          {HOME_DEMO_SCENARIOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === scenarioIndex ? "w-5 bg-cyan-400/80" : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
