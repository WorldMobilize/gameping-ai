"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
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

function UserBubble({
  text,
  typing,
  visible,
}: {
  text: string;
  typing: boolean;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="gp-home-demo-user flex justify-end">
      <div className="max-w-[92%] rounded-2xl rounded-br-md border border-violet-400/15 bg-violet-500/[0.12] px-4 py-3 text-[14px] leading-relaxed text-white/88 backdrop-blur-sm">
        {text}
        {typing ? (
          <span className="gp-home-demo-cursor ml-0.5 inline-block h-4 w-0.5 align-middle bg-violet-200" />
        ) : null}
      </div>
    </div>
  );
}

function AssistantMessage({
  children,
  pulse,
}: {
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className="gp-home-demo-assistant flex gap-3">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-400/15 ring-1 ring-sky-400/25">
        <span className="text-[10px] font-bold text-sky-300">GP</span>
      </span>
      <div
        className={`min-w-0 flex-1 text-sm leading-relaxed text-white/70 ${
          pulse ? "gp-home-demo-pulse" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function DemoGameCard({
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
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
      } ${
        expanded
          ? "border-sky-400/20 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          : "border-white/[0.07] bg-white/[0.025]"
      }`}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <div className="relative aspect-[460/215] w-full overflow-hidden bg-[#080a12]">
        <Image
          src={pick.image}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 768px) 88vw, 340px"
          className="scale-[1.35] object-cover object-[42%_50%] opacity-50 blur-lg saturate-150"
        />
        <Image
          src={pick.image}
          alt={`${pick.title} header art`}
          fill
          sizes="(max-width: 768px) 88vw, 340px"
          priority={index === 0}
          className="z-[1] scale-[1.08] object-contain object-[42%_50%]"
        />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 z-[3] flex items-end justify-between gap-2">
          <h3 className="truncate text-sm font-semibold tracking-tight text-white drop-shadow-sm">
            {pick.title}
          </h3>
          <span className="shrink-0 rounded-full bg-sky-400/90 px-2.5 py-1 text-xs font-bold tabular-nums text-[#041018]">
            {pick.match}%
          </span>
        </div>
        {refined && index === 0 ? (
          <span className="absolute left-3 top-3 z-[3] rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100 ring-1 ring-amber-400/25 backdrop-blur-sm">
            Refined
          </span>
        ) : null}
      </div>

      <div className="space-y-2.5 p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {pick.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-white/45"
            >
              {tag}
            </span>
          ))}
        </div>
        {expanded ? (
          <div className="border-t border-white/[0.06] pt-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Why it fits you
            </p>
            <p className="mt-1 text-xs leading-5 text-white/55">{pick.reason}</p>
          </div>
        ) : null}
      </div>
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

  const showInitialResults =
    phase === "results-initial" ||
    phase === "hold-initial" ||
    phase === "typing-refine";

  const showRefinedResults = phase === "results-refined" || phase === "hold-refined";

  const showThinkingInitial = phase === "thinking-initial";
  const showThinkingRefine = phase === "thinking-refine";
  const isTypingInitial = phase === "typing-initial";
  const isTypingRefine = phase === "typing-refine";

  const advance = useCallback((next: DemoPhase) => setPhase(next), []);

  useEffect(() => {
    if (reducedMotion) return;
    if (phase !== "typing-initial" && phase !== "typing-refine") return;

    if (typedLength >= typingTarget.length) {
      const t = window.setTimeout(() => {
        if (phase === "typing-initial") advance("thinking-initial");
        else advance("thinking-refine");
      }, 400);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setTypedLength((n) => Math.min(n + 1, typingTarget.length));
    }, 24);
    return () => window.clearTimeout(t);
  }, [reducedMotion, phase, typedLength, typingTarget, advance]);

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
      const t = window.setTimeout(() => advance("results-initial"), 1200);
      return () => window.clearTimeout(t);
    }
    if (phase === "hold-initial") {
      const t = window.setTimeout(() => {
        setTypedLength(0);
        advance("typing-refine");
      }, 2400);
      return () => window.clearTimeout(t);
    }
    if (phase === "thinking-refine") {
      const t = window.setTimeout(() => advance("results-refined"), 1200);
      return () => window.clearTimeout(t);
    }
    if (phase === "results-initial") {
      const t = window.setTimeout(() => advance("hold-initial"), 3400);
      return () => window.clearTimeout(t);
    }
    if (phase === "hold-refined") {
      const t = window.setTimeout(() => {
        setTypedLength(0);
        advance("typing-initial");
      }, 3400);
      return () => window.clearTimeout(t);
    }
    if (phase === "results-refined") {
      const t = window.setTimeout(() => advance("hold-refined"), 3400);
      return () => window.clearTimeout(t);
    }
  }, [phase, advance, reducedMotion]);

  useEffect(() => {
    if (phase === "typing-initial" || phase === "typing-refine") {
      setTypedLength(reducedMotion ? typingTarget.length : 0);
    }
  }, [phase, reducedMotion, typingTarget]);

  const initialBubbleText =
    phase === "typing-initial"
      ? HOME_INITIAL_PROMPT.slice(0, typedLength)
      : HOME_INITIAL_PROMPT;

  const refineBubbleText = isTypingRefine
    ? HOME_REFINE_PROMPT.slice(0, typedLength)
    : isRefined && !isTypingRefine
      ? HOME_REFINE_PROMPT
      : "";

  const showUserInitial =
    phase !== "typing-initial" || typedLength > 0 || reducedMotion;

  return (
    <div className="gp-home-demo relative w-full" aria-hidden>
      <div className="gp-home-demo-glass overflow-hidden rounded-2xl border border-white/[0.09] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.75)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/25 px-4 py-3 backdrop-blur-md">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <p className="text-[11px] font-medium tracking-wide text-white/35">
            gameping.ai
          </p>
          <div className="w-10" />
        </div>

        <div className="space-y-4 bg-[#070910]/80 p-4 backdrop-blur-sm md:p-5">
          <UserBubble
            visible={showUserInitial}
            text={initialBubbleText}
            typing={isTypingInitial && typedLength < HOME_INITIAL_PROMPT.length}
          />

          {(showThinkingInitial || showInitialResults || showRefinedResults || showThinkingRefine) && (
            <AssistantMessage pulse={showThinkingInitial || showThinkingRefine}>
              {showThinkingInitial
                ? "Found games matching your taste…"
                : showThinkingRefine
                  ? "Updating your taste…"
                  : showRefinedResults
                    ? "Refined picks based on your update"
                    : "Found games matching your taste"}
            </AssistantMessage>
          )}

          {showInitialResults && !showRefinedResults ? (
            <div className="space-y-2.5">
              {HOME_INITIAL_PICKS.map((pick, index) => (
                <DemoGameCard
                  key={`initial-${pick.title}`}
                  pick={pick}
                  index={index}
                  visible={showInitialResults && phase !== "typing-refine"}
                  expanded={
                    index === 0 &&
                    (phase === "results-initial" || phase === "hold-initial")
                  }
                  refined={false}
                />
              ))}
            </div>
          ) : null}

          {(isTypingRefine || isRefined) && refineBubbleText ? (
            <UserBubble
              visible
              text={refineBubbleText}
              typing={isTypingRefine && typedLength < HOME_REFINE_PROMPT.length}
            />
          ) : null}

          {showRefinedResults ? (
            <div className="space-y-2.5">
              {picks.map((pick, index) => (
                <DemoGameCard
                  key={`refined-${pick.title}`}
                  pick={pick}
                  index={index}
                  visible
                  expanded={index === 0}
                  refined
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/20 px-4 py-2.5 text-[11px] text-white/35 backdrop-blur-md">
          <span>{showRefinedResults ? "Refined results" : "Sample session"}</span>
          <span className="tabular-nums">
            {showRefinedResults || showInitialResults ? "3 of 5" : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
