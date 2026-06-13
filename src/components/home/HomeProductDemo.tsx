"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HOME_INITIAL_PICKS,
  HOME_INITIAL_PROMPT,
  HOME_REFINE_PROMPT,
  HOME_REFINED_PICKS,
  type HomeDemoPick,
} from "@/components/home/home-demo-data";
import { useReducedMotion } from "@/components/home/use-reduced-motion";

type DemoPhase =
  | "typing-initial"
  | "thinking-initial"
  | "results-initial"
  | "hold-initial"
  | "typing-refine"
  | "thinking-refine"
  | "results-refined"
  | "hold-refined";

function DemoPickCard({
  pick,
  index,
  visible,
  expanded,
  refined,
}: {
  pick: HomeDemoPick;
  index: number;
  visible: boolean;
  expanded: boolean;
  refined: boolean;
}) {
  return (
    <article
      className={`gp-home-demo-card overflow-hidden rounded-xl border transition-all duration-500 motion-reduce:transition-none ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
      } ${
        expanded
          ? "border-sky-400/25 bg-sky-400/[0.05]"
          : "border-white/[0.07] bg-white/[0.02]"
      }`}
      style={{ transitionDelay: visible ? `${index * 90}ms` : "0ms" }}
    >
      <div className="flex items-start justify-between gap-3 p-3.5">
        <div className="min-w-0">
          {refined && expanded ? (
            <span className="mb-1 inline-flex rounded-md bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200/90 ring-1 ring-amber-400/20">
              Refined
            </span>
          ) : null}
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-white/95">
            {pick.title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
            expanded
              ? "bg-sky-400/12 text-sky-100 ring-1 ring-sky-400/25"
              : "bg-white/[0.04] text-white/55 ring-1 ring-white/10"
          }`}
        >
          {pick.match}%
        </span>
      </div>
      {expanded ? (
        <div className="border-t border-white/[0.06] px-3.5 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
            Why it fits
          </p>
          <p className="mt-1 text-xs leading-5 text-white/55">{pick.reason}</p>
        </div>
      ) : null}
    </article>
  );
}

export default function HomeProductDemo() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<DemoPhase>("typing-initial");
  const [typedLength, setTypedLength] = useState(0);

  const isRefined =
    phase === "typing-refine" ||
    phase === "thinking-refine" ||
    phase === "results-refined" ||
    phase === "hold-refined";

  const typingTarget =
    phase === "typing-initial"
      ? HOME_INITIAL_PROMPT
      : phase === "typing-refine"
        ? HOME_REFINE_PROMPT
        : "";

  const picks =
    phase === "results-refined" || phase === "hold-refined"
      ? HOME_REFINED_PICKS
      : HOME_INITIAL_PICKS;

  const showResults =
    phase === "results-initial" ||
    phase === "hold-initial" ||
    phase === "results-refined" ||
    phase === "hold-refined";

  const showThinking = phase === "thinking-initial" || phase === "thinking-refine";
  const isTyping = phase === "typing-initial" || phase === "typing-refine";
  const showRefineBar =
    phase === "hold-initial" ||
    phase === "typing-refine" ||
    phase === "thinking-refine" ||
    phase === "results-refined" ||
    phase === "hold-refined";

  const advance = useCallback((next: DemoPhase) => setPhase(next), []);

  useEffect(() => {
    if (reducedMotion) return;
    if (!isTyping) return;

    if (typedLength >= typingTarget.length) {
      const t = window.setTimeout(() => {
        if (phase === "typing-initial") advance("thinking-initial");
        else if (phase === "typing-refine") advance("thinking-refine");
      }, 350);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setTypedLength((n) => Math.min(n + 1, typingTarget.length));
    }, 26);
    return () => window.clearTimeout(t);
  }, [reducedMotion, isTyping, typedLength, typingTarget, phase, advance]);

  useEffect(() => {
    if (reducedMotion) {
      if (phase === "typing-initial") {
        setTypedLength(HOME_INITIAL_PROMPT.length);
        advance("results-initial");
      } else if (phase === "hold-initial") {
        setTypedLength(HOME_REFINE_PROMPT.length);
        advance("results-refined");
      } else if (phase === "hold-refined") {
        setTypedLength(0);
        advance("typing-initial");
      }
      return;
    }

    if (phase === "thinking-initial") {
      const t = window.setTimeout(() => advance("results-initial"), 1100);
      return () => window.clearTimeout(t);
    }
    if (phase === "hold-initial") {
      const t = window.setTimeout(() => {
        setTypedLength(0);
        advance("typing-refine");
      }, 2200);
      return () => window.clearTimeout(t);
    }
    if (phase === "thinking-refine") {
      const t = window.setTimeout(() => advance("results-refined"), 1100);
      return () => window.clearTimeout(t);
    }
    if (phase === "results-initial") {
      const t = window.setTimeout(() => advance("hold-initial"), 3200);
      return () => window.clearTimeout(t);
    }
    if (phase === "hold-refined") {
      const t = window.setTimeout(() => {
        setTypedLength(0);
        advance("typing-initial");
      }, 3200);
      return () => window.clearTimeout(t);
    }
    if (phase === "results-refined") {
      const t = window.setTimeout(() => advance("hold-refined"), 3200);
      return () => window.clearTimeout(t);
    }
  }, [phase, advance, reducedMotion]);

  useEffect(() => {
    if (phase === "typing-initial" || phase === "typing-refine") {
      setTypedLength(reducedMotion ? typingTarget.length : 0);
    }
  }, [phase, reducedMotion, typingTarget]);

  const mainPromptText =
    phase === "typing-initial"
      ? HOME_INITIAL_PROMPT.slice(0, typedLength)
      : HOME_INITIAL_PROMPT;

  const refineText =
    phase === "typing-refine"
      ? HOME_REFINE_PROMPT.slice(0, typedLength)
      : phase === "hold-initial"
        ? "Add a refinement…"
        : showRefineBar
          ? HOME_REFINE_PROMPT
          : "";

  return (
    <div className="gp-home-demo relative w-full" aria-hidden>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080b12] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0e16] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/12" />
            <span className="h-2 w-2 rounded-full bg-white/12" />
            <span className="h-2 w-2 rounded-full bg-white/12" />
          </div>
          <p className="text-[11px] font-medium text-white/35">Recommend</p>
          <div className="w-8" />
        </div>

        <div className="space-y-4 p-4 md:p-5">
          <div className="rounded-xl border border-white/[0.07] bg-black/35 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              What do you feel like playing?
            </p>
            <p className="mt-2 min-h-[3.5rem] text-[15px] leading-relaxed text-white/88">
              {mainPromptText}
              {phase === "typing-initial" && typedLength < HOME_INITIAL_PROMPT.length ? (
                <span className="gp-home-demo-cursor ml-0.5 inline-block h-4 w-0.5 align-middle bg-sky-400" />
              ) : null}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-white/30">Interactive preview</span>
              <span
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  showThinking
                    ? "bg-sky-400/15 text-sky-200"
                    : "bg-sky-400 text-[#041018]"
                }`}
              >
                {showThinking ? "Finding picks…" : "Get my picks"}
              </span>
            </div>
          </div>

          {showRefineBar ? (
            <div
              className={`gp-home-demo-refine rounded-xl border px-3.5 py-3 transition-all duration-300 ${
                phase === "typing-refine" || phase === "thinking-refine"
                  ? "border-amber-400/25 bg-amber-400/[0.06]"
                  : phase === "hold-initial"
                    ? "border-white/[0.06] bg-white/[0.015]"
                    : "border-white/[0.07] bg-white/[0.02]"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Refine
              </p>
              <p
                className={`mt-1 text-sm ${
                  phase === "hold-initial" ? "text-white/35 italic" : "text-white/75"
                }`}
              >
                {refineText}
                {phase === "typing-refine" && typedLength < HOME_REFINE_PROMPT.length ? (
                  <span className="gp-home-demo-cursor ml-0.5 inline-block h-3.5 w-0.5 align-middle bg-amber-300" />
                ) : null}
              </p>
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between px-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Your picks
              </p>
              {showThinking ? (
                <span className="gp-home-demo-pulse text-[11px] text-sky-200/80">
                  Matching taste…
                </span>
              ) : showResults ? (
                <span className="text-[11px] tabular-nums text-white/40">
                  {isRefined ? "Refined · 3 of 5" : "3 of 5"}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              {picks.map((pick, index) => (
                <DemoPickCard
                  key={`${isRefined ? "r" : "i"}-${pick.title}`}
                  pick={pick}
                  index={index}
                  visible={showResults || (showThinking && index === 0)}
                  expanded={showResults && index === 0}
                  refined={isRefined && (phase === "results-refined" || phase === "hold-refined")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
