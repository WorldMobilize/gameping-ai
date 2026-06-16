"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  collectHomeHeroDemoImageUrls,
  HOME_HERO_DEMO_FIT_META,
  HOME_HERO_DEMO_INITIAL_RESULTS,
  HOME_HERO_DEMO_PROMPT,
  HOME_HERO_DEMO_REFINE,
  HOME_HERO_DEMO_REFINED_RESULTS,
} from "@/components/home/demo/home-hero-product-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  captureRefinedBrowseScroll,
  clearRefinedBrowseScroll,
  computeDemoFrame,
  freezeRefineExitScroll,
  HERO_DEMO_LOOP_RESET_CURSOR_MS,
  HERO_DEMO_REFINE_TEXT_PHASES,
  HERO_DEMO_REFINED_VIEW_DETAILS_CARD_INDEX,
  measureCursorMetrics,
  measureDemoScrollMetrics,
  preloadImageUrls,
  resolveWalkthroughPhase,
  waitAnimationFrames,
  type DemoCursorMetrics,
  type DemoCursorPoint,
  type DemoFrameState,
  type DemoScrollMetrics,
} from "@/components/home/home-hero-demo-controller";
import RecommendPromptSection from "@/components/recommend/RecommendPromptSection";
import RecommendRefinePanel from "@/components/recommend/RecommendRefinePanel";
import RecommendResultsHeader from "@/components/recommend/RecommendResultsHeader";
import RecommendResultCardView, {
  type RecommendResultCardGame,
} from "@/components/recommend/RecommendResultCardView";
import RecommendSearchCta from "@/components/recommend/RecommendSearchCta";
import { PROMPT_MAX_DEFAULT } from "@/lib/recommend-limits";

const STAGE_CLASS = "h-[44rem] sm:h-[42rem]";
/** Minimum stage pixels visible in the viewport before the walkthrough may start. */
const VIEWPORT_PLAY_MIN_VISIBLE_PX = 220;
/** Minimum share of the demo stage that must be visible (prevents edge peeks). */
const VIEWPORT_PLAY_MIN_VISIBLE_RATIO = 0.3;

function isDemoStagePlayable(entry: IntersectionObserverEntry): boolean {
  if (!entry.isIntersecting) return false;

  const rect = entry.boundingClientRect;
  const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  if (visibleHeight < VIEWPORT_PLAY_MIN_VISIBLE_PX) return false;
  if (rect.height > 0 && visibleHeight / rect.height < VIEWPORT_PLAY_MIN_VISIBLE_RATIO) return false;

  const stageCenterY = rect.top + rect.height / 2;
  return stageCenterY >= viewportHeight * 0.14 && stageCenterY <= viewportHeight * 0.9;
}

const INITIAL_FRAME: DemoFrameState = {
  phase: "search-typing",
  phaseElapsed: 0,
  loopElapsed: 0,
  displayedPrompt: "",
  displayedRefine: "",
  scrollY: 0,
  filtersEnabled: false,
  resultsRevealed: false,
  showRefinedResults: false,
  hideRefinePanel: false,
  cursor: { x: 0, y: 0, visible: false, clicking: false },
};

function DemoResultsGrid({
  games,
  gridRef,
  viewDetailsRefIndex,
  viewDetailsRef,
  highlightViewDetailsIndex,
}: {
  games: readonly RecommendResultCardGame[];
  gridRef?: RefObject<HTMLElement | null>;
  viewDetailsRefIndex?: number;
  viewDetailsRef?: RefObject<HTMLButtonElement | null>;
  highlightViewDetailsIndex?: number;
}) {
  return (
    <section ref={gridRef} className="mt-5 grid items-stretch gap-4 md:grid-cols-2 md:gap-5">
      {games.map((game, index) => (
        <div key={`${game.title}-${index}`} className="flex h-full">
          <RecommendResultCardView
            rank={index + 1}
            game={game}
            theme="light"
            density="page"
            showViewDetails
            fitMetaLine={HOME_HERO_DEMO_FIT_META}
            viewDetailsRef={index === viewDetailsRefIndex ? viewDetailsRef : undefined}
            highlightDetails={index === highlightViewDetailsIndex}
            clickPulse={index === highlightViewDetailsIndex}
          />
        </div>
      ))}
    </section>
  );
}

function FakeCursor({
  x,
  y,
  clicking,
}: {
  x: number;
  y: number;
  clicking: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute z-40 motion-reduce:hidden"
      style={{
        left: x,
        top: y,
        opacity: 0.92,
        transform: clicking ? "scale(0.88)" : "scale(1)",
      }}
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="drop-shadow">
        <path
          d="M5 3L5 19L9.5 14.5L13.5 21L16 19.5L12 13L18 13L5 3Z"
          fill="white"
          stroke="#334155"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StaticWalkthrough({ panelClass }: { panelClass: string }) {
  return (
    <div className={`gp-home-card overflow-hidden rounded-[24px] border ${panelClass}`}>
      <div className="p-5 sm:p-6 lg:p-8">
        <div className={`${STAGE_CLASS} overflow-hidden`} style={{ contain: "layout" }}>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <RecommendPromptSection
              theme="light"
              density="page"
              value={HOME_HERO_DEMO_PROMPT}
              maxLength={PROMPT_MAX_DEFAULT}
              readOnly
              showAdvancedToggle
              filtersEnabled={false}
              onToggleFilters={() => undefined}
            />
            <RecommendSearchCta theme="light" />
          </form>
        </div>
      </div>
    </div>
  );
}

function applyTapeScroll(tape: HTMLElement | null, scrollY: number) {
  if (!tape) return;
  tape.style.transform = `translateY(-${scrollY}px)`;
}

export default function HomeHeroTasteVisual() {
  const { theme } = useHomeTheme();
  const panelClass = theme === "dark" ? "gp-home-card-dark" : "gp-home-card-light";

  const [reducedMotion, setReducedMotion] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [frame, setFrame] = useState<DemoFrameState>(INITIAL_FRAME);

  const stageRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const filtersToggleRef = useRef<HTMLButtonElement>(null);
  const getMyPicksRef = useRef<HTMLButtonElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const resultsGridRef = useRef<HTMLElement>(null);
  const refinePanelRef = useRef<HTMLDivElement>(null);
  const refineInputRef = useRef<HTMLInputElement>(null);
  const refineButtonRef = useRef<HTMLButtonElement>(null);
  const refinedViewDetailsRef = useRef<HTMLButtonElement>(null);

  const scrollMetricsRef = useRef<DemoScrollMetrics | null>(null);
  const cursorMetricsRef = useRef<DemoCursorMetrics | null>(null);
  const isInViewRef = useRef(false);
  const wasInViewRef = useRef(false);
  const loopEpochRef = useRef(0);
  const rafRef = useRef(0);
  const refinedLayoutMeasuredRef = useRef(false);
  const refinedMetricsFrozenRef = useRef(false);
  const lastPhaseRef = useRef<string>("search-typing");
  const prevCursorRef = useRef<DemoCursorPoint>({ x: 0, y: 0 });
  const loopResetCursorFromRef = useRef<DemoCursorPoint | null>(null);

  const syncTapeScroll = useCallback((scrollY: number) => {
    const stage = stageRef.current;
    const tape = tapeRef.current;
    if (!tape) return;
    let y = scrollY;
    if (stage) {
      y = Math.min(y, Math.max(0, tape.scrollHeight - stage.clientHeight));
    }
    applyTapeScroll(tape, y);
  }, []);

  const measureScrollMetrics = useCallback(
    (refinedGrid = false): DemoScrollMetrics | null => {
      const stage = stageRef.current;
      const tape = tapeRef.current;
      const getMyPicksButton = getMyPicksRef.current;
      const resultsGrid = resultsGridRef.current;
      const resultsSection = resultsSectionRef.current;
      const refinePanel = refinePanelRef.current;
      const refineButton = refineButtonRef.current;
      if (!stage || !tape || !getMyPicksButton || !resultsGrid || !resultsSection || !refinePanel) {
        return null;
      }

      return measureDemoScrollMetrics(
        {
          stage,
          tape,
          getMyPicksButton,
          resultsSection,
          resultsGrid,
          refinePanel,
          refineButton,
        },
        scrollMetricsRef.current,
        { refinedGrid },
      );
    },
    [],
  );

  const measureLiveCursor = useCallback(
    (refinedGrid = false): DemoCursorMetrics | null => {
      const stage = stageRef.current;
      const tape = tapeRef.current;
      if (!stage || !tape) return null;

      return measureCursorMetrics(
        {
          stage,
          tape,
          promptTextarea: promptTextareaRef.current,
          getMyPicksButton: getMyPicksRef.current,
          refineInput: refineInputRef.current,
          refineButton: refineButtonRef.current,
          resultsGrid: resultsGridRef.current,
          refinedViewDetailsButton: refinedViewDetailsRef.current,
        },
        cursorMetricsRef.current,
        { refinedGrid },
      );
    },
    [],
  );

  const resetLoopToStart = useCallback(() => {
    loopEpochRef.current = performance.now();
    loopResetCursorFromRef.current = null;
    lastPhaseRef.current = "search-typing";
    refinedLayoutMeasuredRef.current = false;
    refinedMetricsFrozenRef.current = false;

    const remeasured = measureScrollMetrics(false);
    const remeasuredCursor = measureLiveCursor(false);
    if (remeasured) {
      scrollMetricsRef.current = clearRefinedBrowseScroll({
        ...remeasured,
        lockedRefineViewScrollY: remeasured.refineScrollY,
        refineExitScrollY: remeasured.refineScrollY,
      });
    }
    if (remeasuredCursor) cursorMetricsRef.current = remeasuredCursor;

    const scrollMetrics = scrollMetricsRef.current;
    const cursorMetrics = cursorMetricsRef.current;
    if (!scrollMetrics || !cursorMetrics) return;

    const initial = computeDemoFrame(0, scrollMetrics, cursorMetrics);
    prevCursorRef.current = { x: initial.cursor.x, y: initial.cursor.y };
    syncTapeScroll(0);
    setFrame(initial);
  }, [measureLiveCursor, measureScrollMetrics, syncTapeScroll]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;

    async function prepareLayout() {
      await preloadImageUrls(collectHomeHeroDemoImageUrls());
      if (cancelled) return;

      await waitAnimationFrames(2);
      if (cancelled) return;

      syncTapeScroll(0);
      await waitAnimationFrames(1);
      if (cancelled) return;

      const scrollMetrics = measureScrollMetrics(false);
      const cursorMetrics = measureLiveCursor(false);
      if (!scrollMetrics || !cursorMetrics || cancelled) return;

      scrollMetricsRef.current = scrollMetrics;
      cursorMetricsRef.current = cursorMetrics;
      setFrame(computeDemoFrame(0, scrollMetrics, cursorMetrics));
      setLayoutReady(true);
    }

    prepareLayout();
    return () => {
      cancelled = true;
    };
  }, [reducedMotion, measureScrollMetrics, measureLiveCursor, syncTapeScroll]);

  useEffect(() => {
    if (!layoutReady || reducedMotion) return;

    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const refinedGrid = frame.showRefinedResults;
        if (refinedGrid) {
          refinedMetricsFrozenRef.current = false;
          refinedLayoutMeasuredRef.current = false;
        }
        const scrollMetrics = measureScrollMetrics(refinedGrid);
        const cursorMetrics = measureLiveCursor(refinedGrid);
        if (scrollMetrics) scrollMetricsRef.current = scrollMetrics;
        if (cursorMetrics) cursorMetricsRef.current = cursorMetrics;
        if (refinedGrid) refinedMetricsFrozenRef.current = true;
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layoutReady, reducedMotion, measureScrollMetrics, measureLiveCursor, frame.showRefinedResults]);

  useLayoutEffect(() => {
    if (!layoutReady || !frame.showRefinedResults) {
      if (!frame.showRefinedResults) {
        refinedLayoutMeasuredRef.current = false;
        refinedMetricsFrozenRef.current = false;
      }
      return;
    }

    if (refinedMetricsFrozenRef.current && scrollMetricsRef.current?.refinedBrowse) {
      return;
    }

    const scrollMetrics = measureScrollMetrics(true);
    const cursorMetrics = measureLiveCursor(true);
    if (scrollMetrics && scrollMetricsRef.current) {
      scrollMetricsRef.current = {
        ...scrollMetricsRef.current,
        refinedRows: scrollMetrics.refinedRows,
      };
    }
    if (cursorMetrics) cursorMetricsRef.current = cursorMetrics;

    if (refinedViewDetailsRef.current) {
      refinedLayoutMeasuredRef.current = true;
      refinedMetricsFrozenRef.current = true;
    }
  }, [frame.showRefinedResults, layoutReady, measureScrollMetrics, measureLiveCursor]);

  useEffect(() => {
    if (!layoutReady || reducedMotion) return;

    const node = stageRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const inView = isDemoStagePlayable(entry);
        const wasInView = wasInViewRef.current;
        isInViewRef.current = inView;

        if (inView && !wasInView) {
          resetLoopToStart();
        }
        wasInViewRef.current = inView;
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.55, 0.7],
        rootMargin: "0px 0px -18% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [layoutReady, reducedMotion, resetLoopToStart]);

  useEffect(() => {
    if (!layoutReady || reducedMotion || !scrollMetricsRef.current) return;

    const tick = (now: number) => {
      if (!isInViewRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const scrollMetrics = scrollMetricsRef.current;
      if (!scrollMetrics) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const loopElapsed = now - loopEpochRef.current;
      const { phase, phaseElapsed } = resolveWalkthroughPhase(loopElapsed);
      const previousPhase = lastPhaseRef.current;

      if (phase === "search-typing" && previousPhase === "refined-details-hold") {
        loopResetCursorFromRef.current = { ...prevCursorRef.current };
      }

      if (phase === "search-typing" && phaseElapsed < 32) {
        refinedLayoutMeasuredRef.current = false;
        refinedMetricsFrozenRef.current = false;
        const remeasured = measureScrollMetrics(false);
        if (remeasured && scrollMetricsRef.current) {
          scrollMetricsRef.current = clearRefinedBrowseScroll({
            ...remeasured,
            lockedRefineViewScrollY: remeasured.refineScrollY,
            refineExitScrollY: remeasured.refineScrollY,
          });
        }
        const remeasuredCursor = measureLiveCursor(false);
        if (remeasuredCursor) cursorMetricsRef.current = remeasuredCursor;
      }

      if (phase === "refine-cursor-click" && scrollMetricsRef.current) {
        scrollMetricsRef.current = freezeRefineExitScroll(scrollMetricsRef.current);
      }

      if (
        (phase === "refine-updating" || phase === "refined-row1-hold") &&
        scrollMetricsRef.current &&
        !scrollMetricsRef.current.refinedBrowse
      ) {
        scrollMetricsRef.current = captureRefinedBrowseScroll(scrollMetricsRef.current);
      }

      if (
        phase === "refined-row2-hold" ||
        phase === "refined-details-cursor-move" ||
        phase === "refined-details-hold"
      ) {
        const updatedCursor = measureLiveCursor(true);
        if (updatedCursor) cursorMetricsRef.current = updatedCursor;
      }

      lastPhaseRef.current = phase;

      const activeScrollMetrics = scrollMetricsRef.current;
      const cursorMetrics = cursorMetricsRef.current;
      if (!activeScrollMetrics || !cursorMetrics) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const nextFrame = computeDemoFrame(loopElapsed, activeScrollMetrics, cursorMetrics, {
        loopResetCursorFrom: loopResetCursorFromRef.current,
      });
      if (phase === "search-typing" && phaseElapsed >= HERO_DEMO_LOOP_RESET_CURSOR_MS) {
        loopResetCursorFromRef.current = null;
      }
      prevCursorRef.current = { x: nextFrame.cursor.x, y: nextFrame.cursor.y };
      syncTapeScroll(nextFrame.scrollY);
      setFrame(nextFrame);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [layoutReady, reducedMotion, measureLiveCursor, measureScrollMetrics, syncTapeScroll]);

  if (reducedMotion) return <StaticWalkthrough panelClass={panelClass} />;

  const { phase } = frame;

  const promptValue =
    phase === "search-typing"
      ? `${frame.displayedPrompt}${
          frame.displayedPrompt.length < HOME_HERO_DEMO_PROMPT.length ? "|" : ""
        }`
      : HOME_HERO_DEMO_PROMPT;

  const refineTypingActive = phase === "refine";
  const refineValue = HERO_DEMO_REFINE_TEXT_PHASES.includes(phase)
    ? `${frame.displayedRefine}${
        refineTypingActive && frame.displayedRefine.length < HOME_HERO_DEMO_REFINE.length
          ? "|"
          : ""
      }`
    : "";

  const searchCtaLoading = phase === "search-finding";
  const searchCtaPulse = phase === "search-cursor-click";
  const activeResults = frame.showRefinedResults
    ? HOME_HERO_DEMO_REFINED_RESULTS
    : HOME_HERO_DEMO_INITIAL_RESULTS;
  const highlightViewDetails =
    phase === "refined-details-cursor-move" || phase === "refined-details-hold";

  return (
    <div
      className="w-full"
      aria-label="GamePing product walkthrough"
    >
      <div
        className={`gp-home-card overflow-hidden rounded-[24px] border ${panelClass}`}
      >
        <div className="p-5 sm:p-6 lg:p-8">
          <div
            ref={stageRef}
            className={`relative overflow-hidden ${STAGE_CLASS}`}
            style={{ contain: "layout" }}
          >
            <div ref={tapeRef} style={{ transform: `translateY(-${frame.scrollY}px)` }}>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <RecommendPromptSection
                  theme="light"
                  density="page"
                  value={promptValue}
                  maxLength={PROMPT_MAX_DEFAULT}
                  readOnly
                  showAdvancedToggle
                  filtersEnabled={frame.filtersEnabled}
                  onToggleFilters={() => undefined}
                  textareaRef={promptTextareaRef}
                  toggleRef={filtersToggleRef}
                  highlightToggle={false}
                  togglePulse={false}
                />
                <RecommendSearchCta
                  theme="light"
                  loading={searchCtaLoading}
                  buttonRef={getMyPicksRef}
                  highlightButton={phase === "search-cursor-click"}
                  buttonPulse={searchCtaPulse}
                />
              </form>

              <div
                ref={resultsSectionRef}
                className={`transition-opacity duration-300 ${
                  frame.resultsRevealed ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-hidden={!frame.resultsRevealed}
              >
                <RecommendResultsHeader theme="light" />
                <DemoResultsGrid
                  games={activeResults}
                  gridRef={resultsGridRef}
                  viewDetailsRefIndex={
                    frame.showRefinedResults ? HERO_DEMO_REFINED_VIEW_DETAILS_CARD_INDEX : undefined
                  }
                  viewDetailsRef={refinedViewDetailsRef}
                  highlightViewDetailsIndex={
                    highlightViewDetails ? HERO_DEMO_REFINED_VIEW_DETAILS_CARD_INDEX : undefined
                  }
                />
              </div>

              <div
                ref={refinePanelRef}
                className={`mt-8 pb-1 transition-opacity duration-300 ${
                  frame.resultsRevealed && !frame.hideRefinePanel
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
                aria-hidden={!frame.resultsRevealed || frame.hideRefinePanel}
              >
                <RecommendRefinePanel
                  theme="light"
                  density="page"
                  value={refineValue}
                  readOnly
                  showUpdating={phase === "refine-updating"}
                  loading={phase === "refine-updating"}
                  inputRef={refineInputRef}
                  buttonRef={refineButtonRef}
                  highlightButton={phase === "refine-cursor-click"}
                  buttonPulse={phase === "refine-cursor-click"}
                />
              </div>
            </div>

            {layoutReady ? (
              <FakeCursor
                x={frame.cursor.x}
                y={frame.cursor.y}
                clicking={frame.cursor.clicking}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
