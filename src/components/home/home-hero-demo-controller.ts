import {
  HOME_HERO_DEMO_PROMPT,
  HOME_HERO_DEMO_REFINE,
} from "@/components/home/demo/home-hero-product-demo-data";

export const HERO_DEMO_TYPING_MS = 85;
export const HERO_DEMO_REFINE_TYPING_MS = 95;
export const HERO_DEMO_SCROLL_TO_CTA_MS = 1050;
export const HERO_DEMO_SEARCH_POST_TYPE_PAUSE_MS = 200;
export const HERO_DEMO_SEARCH_FINDING_MS = 550;
export const HERO_DEMO_SCROLL_TO_RESULTS_MS = 1800;
/** Same px/s feel for each row step; initial browse spans 2 steps (row1→row3), refined spans 1 (row1→row2). */
export const HERO_DEMO_RESULTS_ROW_SCROLL_MS = 2000;
export const HERO_DEMO_RESULTS_SCROLL_MS = HERO_DEMO_RESULTS_ROW_SCROLL_MS * 2;
export const HERO_DEMO_REFINED_SCROLL_MS = HERO_DEMO_RESULTS_ROW_SCROLL_MS;
export const HERO_DEMO_SCROLL_TO_REFINE_MS = 2200;
// Scroll-to-top takes HERO_DEMO_REFINE_SCROLL_UP_MS; keep this only slightly
// longer so the refined cards reveal almost immediately after reaching the top
// (was 1800 → ~600ms idle gap at the top before the cards appeared).
export const HERO_DEMO_REFINE_SCROLL_UP_MS = 1200;
export const HERO_DEMO_REFINE_UPDATING_MS = HERO_DEMO_REFINE_SCROLL_UP_MS + 150;
export const HERO_DEMO_REFINED_ROW_MIN_GAP_PX = 180;
export const HERO_DEMO_REFINED_ROW1_HOLD_MS = 1500;
export const HERO_DEMO_REFINED_ROW2_HOLD_MS = 1400;
export const HERO_DEMO_CURSOR_MOVE_MS = 750;
export const HERO_DEMO_CURSOR_HOLD_MS = 300;
export const HERO_DEMO_CURSOR_CLICK_MS = 400;
export const HERO_DEMO_REFINED_DETAILS_CURSOR_MOVE_MS = 850;
export const HERO_DEMO_REFINED_DETAILS_HOLD_MS = 2000;
// Final appended step: the Subnautica detail preview opens, scrolls slowly from
// top to bottom, then holds before the loop restarts.
export const HERO_DEMO_DETAIL_OPEN_MS = 600;
// Slower, calmer read-through of the full detail page (was 5200).
export const HERO_DEMO_DETAIL_SCROLL_MS = 8800;
export const HERO_DEMO_DETAIL_HOLD_MS = 1600;
export const HERO_DEMO_REFINED_VIEW_DETAILS_CARD_INDEX = 2;
export const HERO_DEMO_LOOP_RESET_CURSOR_MS = 500;
export const HERO_DEMO_RESULTS_REVEAL_SCROLL_PROGRESS = 0.28;
export const HERO_DEMO_RESULTS_END_HOLD_MS = 280;
export const HERO_DEMO_REFINED_ROW1_NUDGE_PX = 20;
export const HERO_DEMO_RESULTS_ROW_VIEWPORT_PADDING = 12;
export const HERO_DEMO_RESULTS_ROW_BOTTOM_GUARD_PX = 28;
export const HERO_DEMO_REFINE_PANEL_HIDDEN_GUARD_PX = 24;
export const HERO_DEMO_REFINE_VIEWPORT_PADDING = 28;
export const HERO_DEMO_REFINE_CONTEXT_PEEK_PX = 90;
export const HERO_DEMO_CTA_VIEWPORT_PADDING_PX = 20;
export const HERO_DEMO_CTA_TOP_PADDING_PX = 12;
export const HERO_DEMO_CURSOR_SIZE_PX = 18;

export type WalkthroughPhase =
  | "search-typing"
  | "scroll-to-cta"
  | "search-cursor-hold"
  | "search-cursor-click"
  | "search-finding"
  | "scroll-to-results"
  | "results-scroll"
  | "results-end-hold"
  | "scroll-to-refine"
  | "refine"
  | "refine-settle"
  | "refine-cursor-move"
  | "refine-cursor-hold"
  | "refine-cursor-click"
  | "refine-updating"
  | "refined-row1-hold"
  | "refined-scroll"
  | "refined-row2-hold"
  | "refined-details-cursor-move"
  | "refined-details-hold"
  | "detail-open"
  | "detail-scroll"
  | "detail-hold";

export const HERO_DEMO_PHASE_ORDER: WalkthroughPhase[] = [
  "search-typing",
  "scroll-to-cta",
  "search-cursor-hold",
  "search-cursor-click",
  "search-finding",
  "scroll-to-results",
  "results-scroll",
  "results-end-hold",
  "scroll-to-refine",
  "refine",
  "refine-settle",
  "refine-cursor-move",
  "refine-cursor-hold",
  "refine-cursor-click",
  "refine-updating",
  "refined-row1-hold",
  "refined-scroll",
  "refined-row2-hold",
  "refined-details-cursor-move",
  "refined-details-hold",
  "detail-open",
  "detail-scroll",
  "detail-hold",
];

const PHASE_DURATION: Record<WalkthroughPhase, number> = {
  "search-typing": 3200,
  "scroll-to-cta": HERO_DEMO_SCROLL_TO_CTA_MS,
  "search-cursor-hold": HERO_DEMO_CURSOR_HOLD_MS,
  "search-cursor-click": HERO_DEMO_CURSOR_CLICK_MS,
  "search-finding": HERO_DEMO_SEARCH_FINDING_MS,
  "scroll-to-results": HERO_DEMO_SCROLL_TO_RESULTS_MS,
  "results-scroll": HERO_DEMO_RESULTS_SCROLL_MS,
  "results-end-hold": HERO_DEMO_RESULTS_END_HOLD_MS,
  "scroll-to-refine": HERO_DEMO_SCROLL_TO_REFINE_MS,
  refine: 3000,
  "refine-settle": 250,
  "refine-cursor-move": HERO_DEMO_CURSOR_MOVE_MS,
  "refine-cursor-hold": HERO_DEMO_CURSOR_HOLD_MS,
  "refine-cursor-click": HERO_DEMO_CURSOR_CLICK_MS,
  "refine-updating": HERO_DEMO_REFINE_UPDATING_MS,
  "refined-row1-hold": HERO_DEMO_REFINED_ROW1_HOLD_MS,
  "refined-scroll": HERO_DEMO_REFINED_SCROLL_MS,
  "refined-row2-hold": HERO_DEMO_REFINED_ROW2_HOLD_MS,
  "refined-details-cursor-move": HERO_DEMO_REFINED_DETAILS_CURSOR_MOVE_MS,
  "refined-details-hold": HERO_DEMO_REFINED_DETAILS_HOLD_MS,
  "detail-open": HERO_DEMO_DETAIL_OPEN_MS,
  "detail-scroll": HERO_DEMO_DETAIL_SCROLL_MS,
  "detail-hold": HERO_DEMO_DETAIL_HOLD_MS,
};

type PhaseWindow = {
  phase: WalkthroughPhase;
  start: number;
  end: number;
  duration: number;
};

function buildPhaseTimeline(): { windows: PhaseWindow[]; loopDuration: number } {
  let start = 0;
  const windows: PhaseWindow[] = [];
  for (const phase of HERO_DEMO_PHASE_ORDER) {
    const duration = PHASE_DURATION[phase];
    windows.push({ phase, start, end: start + duration, duration });
    start += duration;
  }
  return { windows, loopDuration: start };
}

const { windows: HERO_DEMO_PHASE_WINDOWS, loopDuration: HERO_DEMO_LOOP_DURATION } =
  buildPhaseTimeline();

export { HERO_DEMO_LOOP_DURATION };

export const HERO_DEMO_SEARCH_PHASES: WalkthroughPhase[] = [
  "search-typing",
  "scroll-to-cta",
  "search-cursor-hold",
  "search-cursor-click",
  "search-finding",
];

export const HERO_DEMO_REFINE_LOCKED_SCROLL_PHASES: WalkthroughPhase[] = [
  "refine",
  "refine-settle",
  "refine-cursor-move",
  "refine-cursor-hold",
  "refine-cursor-click",
];

export const HERO_DEMO_REFINE_TEXT_PHASES: WalkthroughPhase[] = [
  "refine",
  "refine-settle",
  "refine-cursor-move",
  "refine-cursor-hold",
  "refine-cursor-click",
  "refine-updating",
];

export type DemoCursorPoint = { x: number; y: number };

export type DemoRowScrollTargets = {
  row1: number;
  row2: number;
  row3: number;
};

export type DemoRefinedRowScrollTargets = {
  row1: number;
  row2: number;
};

export type DemoRefinedBrowseScroll = {
  fromScrollY: number;
  row1: number;
  row2: number;
};

export type DemoScrollMetrics = {
  ctaScrollY: number;
  initialRows: DemoRowScrollTargets;
  refineScrollY: number;
  refineViewScrollY: number;
  lockedRefineViewScrollY: number;
  refineExitScrollY: number;
  refinedRows: DemoRefinedRowScrollTargets;
  refinedBrowse: DemoRefinedBrowseScroll | null;
};

export type DemoCursorMetrics = {
  scaleX: number;
  scaleY: number;
  prompt: DemoCursorPoint;
  getMyPicks: DemoCursorPoint;
  refineInput: DemoCursorPoint;
  refineButton: DemoCursorPoint;
  initialRowCenters: [DemoCursorPoint, DemoCursorPoint, DemoCursorPoint];
  refinedRowCenters: [DemoCursorPoint, DemoCursorPoint];
  refinedViewDetailsTape: DemoCursorPoint;
  refinedViewDetailsStage: DemoCursorPoint;
};

export const HERO_DEMO_GUIDED_RESULTS_PHASES: WalkthroughPhase[] = [
  "scroll-to-results",
  "results-scroll",
  "results-end-hold",
  "scroll-to-refine",
];

export const HERO_DEMO_GUIDED_REFINED_PHASES: WalkthroughPhase[] = [
  "refine-updating",
  "refined-row1-hold",
  "refined-scroll",
  "refined-row2-hold",
  "refined-details-cursor-move",
  "refined-details-hold",
];

/** Final appended step — the Subnautica detail overlay is shown during these. */
export const HERO_DEMO_DETAIL_PHASES: WalkthroughPhase[] = [
  "detail-open",
  "detail-scroll",
  "detail-hold",
];

export const HERO_DEMO_HIDE_REFINE_PANEL_PHASES: WalkthroughPhase[] = [
  ...HERO_DEMO_GUIDED_REFINED_PHASES,
  ...HERO_DEMO_DETAIL_PHASES,
];

// Refined cards appear only AFTER the scroll-to-top beat: during `refine-updating`
// the results are faded out (see phaseResultsRevealed) while the viewport resets to
// the top, so the prior cards are never scrolled through and the grid swap is hidden
// at opacity 0. The refined grid is then revealed from `refined-row1-hold` onward,
// fading in already at the top, and scrolled down. So `refine-updating` is excluded.
export const HERO_DEMO_REFINED_GRID_PHASES: WalkthroughPhase[] = [
  "refined-row1-hold",
  "refined-scroll",
  "refined-row2-hold",
  "refined-details-cursor-move",
  "refined-details-hold",
  ...HERO_DEMO_DETAIL_PHASES,
];

export type DemoFrameState = {
  phase: WalkthroughPhase;
  phaseElapsed: number;
  loopElapsed: number;
  displayedPrompt: string;
  displayedRefine: string;
  scrollY: number;
  filtersEnabled: boolean;
  resultsRevealed: boolean;
  showRefinedResults: boolean;
  hideRefinePanel: boolean;
  /** Final step: Subnautica detail overlay open state + 0..1 scroll progress. */
  detailPreview: { open: boolean; scrollProgress: number };
  cursor: {
    x: number;
    y: number;
    visible: boolean;
    clicking: boolean;
  };
};

export function easeOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function resolveWalkthroughPhase(loopElapsed: number): {
  phase: WalkthroughPhase;
  phaseElapsed: number;
} {
  const elapsed =
    ((loopElapsed % HERO_DEMO_LOOP_DURATION) + HERO_DEMO_LOOP_DURATION) %
    HERO_DEMO_LOOP_DURATION;

  for (const window of HERO_DEMO_PHASE_WINDOWS) {
    if (elapsed >= window.start && elapsed < window.end) {
      return { phase: window.phase, phaseElapsed: elapsed - window.start };
    }
  }

  const last = HERO_DEMO_PHASE_WINDOWS[HERO_DEMO_PHASE_WINDOWS.length - 1];
  return { phase: last.phase, phaseElapsed: last.duration };
}

function typingSlice(text: string, elapsed: number, charMs: number): string {
  const visible = Math.min(text.length, Math.floor(elapsed / charMs));
  return text.slice(0, visible);
}

function lerpPoint(a: DemoCursorPoint, b: DemoCursorPoint, t: number): DemoCursorPoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function readTapeScrollY(tape: HTMLElement): number {
  const transform = tape.style.transform;
  const match = transform.match(/translateY\(-?([\d.]+)px\)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

function relativeOffsetInTape(
  tape: HTMLElement,
  element: HTMLElement,
): { top: number; left: number } {
  const tapeRect = tape.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const scrollY = readTapeScrollY(tape);
  return {
    top: elementRect.top - tapeRect.top + scrollY,
    left: elementRect.left - tapeRect.left,
  };
}

function rowBoundsFromCards(tape: HTMLElement, rowCards: HTMLElement[]): RowBounds {
  let top = Infinity;
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;

  for (const card of rowCards) {
    const offset = relativeOffsetInTape(tape, card);
    const cardBottom = offset.top + card.offsetHeight;
    const cardRight = offset.left + card.offsetWidth;
    top = Math.min(top, offset.top);
    bottom = Math.max(bottom, cardBottom);
    left = Math.min(left, offset.left);
    right = Math.max(right, cardRight);
  }

  return { top, bottom, left, right };
}

function elementCenterInTape(tape: HTMLElement, element: HTMLElement): DemoCursorPoint {
  const { top, left } = relativeOffsetInTape(tape, element);
  const rect = element.getBoundingClientRect();
  return {
    x: left + rect.width / 2,
    y: top + rect.height / 2,
  };
}

function elementPointInTape(
  tape: HTMLElement,
  element: HTMLElement,
  offsetXRatio: number,
  offsetYRatio: number,
): DemoCursorPoint {
  const { top, left } = relativeOffsetInTape(tape, element);
  return {
    x: left + element.offsetWidth * offsetXRatio,
    y: top + element.offsetHeight * offsetYRatio,
  };
}

function tapePointToCursor(
  tapePoint: DemoCursorPoint,
  scrollY: number,
  scaleX: number,
  scaleY: number,
): DemoCursorPoint {
  return {
    x: tapePoint.x / scaleX - HERO_DEMO_CURSOR_SIZE_PX / 2,
    y: (tapePoint.y - scrollY) / scaleY - HERO_DEMO_CURSOR_SIZE_PX / 2,
  };
}

function scrollBlendProgress(scrollY: number, fromScroll: number, toScroll: number): number {
  const span = toScroll - fromScroll;
  return span <= 0 ? 1 : Math.min(1, Math.max(0, (scrollY - fromScroll) / span));
}

function lerpScroll(from: number, to: number, phaseElapsed: number, duration: number): number {
  return from + (to - from) * linearProgress(phaseElapsed, duration);
}

function lerpScrollEase(from: number, to: number, phaseElapsed: number, duration: number): number {
  return from + (to - from) * easeOutCubic(phaseElapsed / duration);
}

function lerpScrollEaseInOut(from: number, to: number, phaseElapsed: number, duration: number): number {
  return from + (to - from) * easeInOutCubic(phaseElapsed / duration);
}

function stageScale(stage: HTMLElement): { scaleX: number; scaleY: number } {
  const rect = stage.getBoundingClientRect();
  const scaleX = stage.offsetWidth > 0 ? rect.width / stage.offsetWidth : 1;
  const scaleY = stage.offsetHeight > 0 ? rect.height / stage.offsetHeight : 1;
  return { scaleX, scaleY };
}

export function handPositionForTarget(
  stage: HTMLElement,
  target: HTMLElement,
): DemoCursorPoint {
  const stageRect = stage.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const { scaleX, scaleY } = stageScale(stage);

  return {
    x:
      (targetRect.left - stageRect.left) / scaleX +
      targetRect.width / scaleX / 2 -
      HERO_DEMO_CURSOR_SIZE_PX / 2,
    y:
      (targetRect.top - stageRect.top) / scaleY +
      targetRect.height / scaleY / 2 -
      HERO_DEMO_CURSOR_SIZE_PX / 2,
  };
}

export function handPositionForElementPoint(
  stage: HTMLElement,
  target: HTMLElement,
  offsetXRatio: number,
  offsetYRatio: number,
): DemoCursorPoint {
  const stageRect = stage.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const { scaleX, scaleY } = stageScale(stage);

  const centerX =
    (targetRect.left - stageRect.left) / scaleX + (targetRect.width / scaleX) * offsetXRatio;
  const centerY =
    (targetRect.top - stageRect.top) / scaleY + (targetRect.height / scaleY) * offsetYRatio;

  return {
    x: centerX - HERO_DEMO_CURSOR_SIZE_PX / 2,
    y: centerY - HERO_DEMO_CURSOR_SIZE_PX / 2,
  };
}

/** @deprecated Use handPositionForTarget */
export function cursorCenterForTarget(
  stage: HTMLElement,
  target: HTMLElement,
): DemoCursorPoint {
  return handPositionForTarget(stage, target);
}

export function computeResultsScrollTarget(stage: HTMLElement, resultsSection: HTMLElement): number {
  const viewport = stage.clientHeight;
  const tape = resultsSection.parentElement;
  const tapeHeight = tape?.scrollHeight ?? resultsSection.offsetTop + resultsSection.offsetHeight;
  const tapeMax = Math.max(0, tapeHeight - viewport);
  const target = resultsSection.offsetTop - HERO_DEMO_CTA_TOP_PADDING_PX;
  return Math.min(Math.max(0, target), tapeMax);
}

function tapeMaxScrollY(stage: HTMLElement, tape: HTMLElement): number {
  return Math.max(0, tape.scrollHeight - stage.clientHeight);
}

type RowBounds = { top: number; bottom: number; left: number; right: number };

function rowBoundsInTape(tape: HTMLElement, rowCards: HTMLElement[]): RowBounds {
  return rowBoundsFromCards(tape, rowCards);
}

function rowCenterInTape(bounds: RowBounds): DemoCursorPoint {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}

export function computeRowScrollTarget(
  stage: HTMLElement,
  tape: HTMLElement,
  rowTop: number,
  rowBottom: number,
  padding: number = HERO_DEMO_RESULTS_ROW_VIEWPORT_PADDING,
): number {
  const viewport = stage.clientHeight;
  const tapeMax = tapeMaxScrollY(stage, tape);
  const rowHeight = rowBottom - rowTop;

  let scrollY = rowTop - padding;

  if (rowHeight + padding * 2 <= viewport && rowBottom + padding > scrollY + viewport) {
    scrollY = rowBottom + padding - viewport;
  }

  return Math.min(Math.max(0, scrollY), tapeMax);
}

function computeRowScrollTargetBottomAligned(
  stage: HTMLElement,
  tape: HTMLElement,
  rowTop: number,
  rowBottom: number,
  padding: number = HERO_DEMO_RESULTS_ROW_VIEWPORT_PADDING,
  bottomGuard: number = HERO_DEMO_RESULTS_ROW_BOTTOM_GUARD_PX,
): number {
  const viewport = stage.clientHeight;
  const tapeMax = tapeMaxScrollY(stage, tape);

  let scrollY = rowBottom + padding + bottomGuard - viewport;

  if (scrollY > rowTop - padding) {
    scrollY = rowTop - padding;
  }

  return Math.min(Math.max(0, scrollY), tapeMax);
}

function computeMaxScrollYBeforeElementPeeks(
  stage: HTMLElement,
  tape: HTMLElement,
  elementTopInTape: number,
  hiddenGuard: number = HERO_DEMO_REFINE_PANEL_HIDDEN_GUARD_PX,
): number {
  const viewport = stage.clientHeight;
  const tapeMax = tapeMaxScrollY(stage, tape);
  return Math.min(Math.max(0, elementTopInTape - viewport - hiddenGuard), tapeMax);
}

function capRowScrollBeforeRefinePanel(
  stage: HTMLElement,
  tape: HTMLElement,
  refinePanel: HTMLElement,
  rowScrollY: number,
  minScrollY = 0,
): number {
  const maxBeforeRefine = computeMaxScrollYBeforeElementPeeks(stage, tape, refinePanel.offsetTop);
  const tapeMax = tapeMaxScrollY(stage, tape);
  return Math.min(Math.max(minScrollY, rowScrollY), maxBeforeRefine, tapeMax);
}

function gridRowCards(grid: HTMLElement, cardsPerRow = 2): HTMLElement[][] {
  const cards = Array.from(grid.children) as HTMLElement[];
  const rows: HTMLElement[][] = [];
  for (let i = 0; i < cards.length; i += cardsPerRow) {
    rows.push(cards.slice(i, i + cardsPerRow));
  }
  return rows;
}

function rowBoundsFromOffsetInTape(
  section: HTMLElement,
  grid: HTMLElement,
  rowCards: HTMLElement[],
): RowBounds {
  const baseTop = section.offsetTop + grid.offsetTop;
  let top = Infinity;
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;

  for (const card of rowCards) {
    const cardTop = baseTop + card.offsetTop;
    const cardBottom = cardTop + card.offsetHeight;
    const cardLeft = card.offsetLeft;
    const cardRight = cardLeft + card.offsetWidth;
    top = Math.min(top, cardTop);
    bottom = Math.max(bottom, cardBottom);
    left = Math.min(left, cardLeft);
    right = Math.max(right, cardRight);
  }

  return { top, bottom, left, right };
}

function computeGridRowScrollTargetsFromOffset(
  stage: HTMLElement,
  tape: HTMLElement,
  section: HTMLElement,
  grid: HTMLElement,
  cardsPerRow = 2,
): number[] {
  const tapeMax = tapeMaxScrollY(stage, tape);
  const rows = gridRowCards(grid, cardsPerRow);
  const targets: number[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const { top, bottom } = rowBoundsFromOffsetInTape(section, grid, rows[index]);
    const isLastRow = index === rows.length - 1;
    let target = isLastRow
      ? computeRowScrollTargetBottomAligned(stage, tape, top, bottom)
      : computeRowScrollTarget(stage, tape, top, bottom);
    if (index > 0 && target <= targets[index - 1]) {
      target = Math.min(targets[index - 1] + 1, tapeMax);
    }
    targets.push(target);
  }

  return targets;
}

export function computeGridRowScrollTargets(
  stage: HTMLElement,
  tape: HTMLElement,
  grid: HTMLElement,
  cardsPerRow = 2,
): number[] {
  const tapeMax = tapeMaxScrollY(stage, tape);
  const rows = gridRowCards(grid, cardsPerRow);
  const targets: number[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const { top, bottom } = rowBoundsFromCards(tape, rows[index]);
    const isLastRow = index === rows.length - 1;
    let target = isLastRow
      ? computeRowScrollTargetBottomAligned(stage, tape, top, bottom)
      : computeRowScrollTarget(stage, tape, top, bottom);
    if (index > 0 && target <= targets[index - 1]) {
      target = Math.min(targets[index - 1] + 1, tapeMax);
    }
    targets.push(target);
  }

  return targets;
}

export function computeGridRowCentersInTape(
  tape: HTMLElement,
  grid: HTMLElement,
  cardsPerRow = 2,
): DemoCursorPoint[] {
  return gridRowCards(grid, cardsPerRow).map((rowCards) =>
    rowCenterInTape(rowBoundsInTape(tape, rowCards)),
  );
}

export type DemoScrollMeasureRefs = {
  stage: HTMLElement;
  tape: HTMLElement;
  getMyPicksButton: HTMLElement;
  resultsSection: HTMLElement;
  resultsGrid: HTMLElement;
  refinePanel: HTMLElement;
  refineButton: HTMLElement | null;
};

export function measureDemoScrollMetrics(
  refs: DemoScrollMeasureRefs,
  previous?: DemoScrollMetrics | null,
  options?: { refinedGrid?: boolean },
): DemoScrollMetrics | null {
  const { stage, tape, getMyPicksButton, resultsSection, resultsGrid, refinePanel, refineButton } =
    refs;
  const refinedGrid = options?.refinedGrid ?? resultsGrid.children.length <= 4;
  const tapeMax = tapeMaxScrollY(stage, tape);
  const rowTargets = refinedGrid
    ? computeGridRowScrollTargetsFromOffset(stage, tape, resultsSection, resultsGrid)
    : computeGridRowScrollTargets(stage, tape, resultsGrid);
  const [row1 = 0, row2 = row1, row3Raw = row2] = rowTargets;
  const refineScrollY = computeRefineScrollTarget(stage, refinePanel, refineButton);
  const ctaScrollY = computeCtaScrollTarget(stage, getMyPicksButton);

  if (refinedGrid) {
    const row1Target = rowTargets[0] ?? previous?.refinedRows.row1 ?? row1;
    const refinedRow1 = Math.min(
      tapeMax,
      row1Target + HERO_DEMO_REFINED_ROW1_NUDGE_PX,
    );
    const refinedRow2Raw = rowTargets[1] ?? previous?.refinedRows.row2 ?? row2;
    const refinedRow2 = Math.max(
      refinedRow1 + HERO_DEMO_REFINED_ROW_MIN_GAP_PX,
      capRowScrollBeforeRefinePanel(stage, tape, refinePanel, refinedRow2Raw, refinedRow1),
    );
    const lockedRefineViewScrollY =
      previous?.lockedRefineViewScrollY ?? previous?.refineViewScrollY ?? refineScrollY;
    return {
      ctaScrollY: previous?.ctaScrollY ?? ctaScrollY,
      initialRows: previous?.initialRows ?? { row1, row2, row3: row3Raw },
      refineScrollY,
      refineViewScrollY: Math.min(refineScrollY, tapeMax),
      lockedRefineViewScrollY,
      refineExitScrollY: previous?.refineExitScrollY ?? previous?.lockedRefineViewScrollY ?? refineScrollY,
      refinedRows: {
        row1: refinedRow1,
        row2: refinedRow2,
      },
      refinedBrowse: previous?.refinedBrowse ?? null,
    };
  }

  const row3 = capRowScrollBeforeRefinePanel(stage, tape, refinePanel, row3Raw, row2);

  return {
    ctaScrollY,
    initialRows: { row1, row2, row3 },
    refineScrollY,
    refineViewScrollY: refineScrollY,
    lockedRefineViewScrollY: refineScrollY,
    refineExitScrollY: refineScrollY,
    refinedRows: previous?.refinedRows ?? { row1: 0, row2: 0 },
    refinedBrowse: null,
  };
}

export function computeCtaScrollTarget(stage: HTMLElement, button: HTMLElement): number {
  const viewport = stage.clientHeight;
  const ctaBlock = button.parentElement?.parentElement ?? button;
  const ctaTop = ctaBlock.offsetTop;
  const buttonBottom = button.offsetTop + button.offsetHeight;
  const tape = ctaBlock.parentElement;
  const tapeHeight = tape?.scrollHeight ?? buttonBottom;
  const tapeMax = Math.max(0, tapeHeight - viewport);
  const ctaHeight = buttonBottom - ctaTop;

  let scrollY: number;
  if (ctaHeight + HERO_DEMO_CTA_VIEWPORT_PADDING_PX <= viewport) {
    scrollY = Math.max(0, ctaTop - HERO_DEMO_CTA_TOP_PADDING_PX);
  } else {
    scrollY = Math.max(0, buttonBottom - viewport + HERO_DEMO_CTA_VIEWPORT_PADDING_PX);
  }

  return Math.min(scrollY, tapeMax);
}

export function computeRefineScrollTarget(
  stage: HTMLElement,
  panel: HTMLElement,
  refineButton?: HTMLElement | null,
): number {
  const viewport = stage.clientHeight;
  const panelTop = panel.offsetTop;
  const panelBottom = panelTop + panel.offsetHeight;
  const tape = panel.parentElement;
  const tapeHeight = tape?.scrollHeight ?? panelBottom;
  const tapeMax = Math.max(0, tapeHeight - viewport);
  const bottomPadding = HERO_DEMO_REFINE_VIEWPORT_PADDING;

  const buttonBottom = refineButton
    ? refineButton.offsetTop + refineButton.offsetHeight
    : panelBottom;

  const scrollForButton = Math.max(0, buttonBottom - viewport + bottomPadding);
  const scrollForPanelTop = Math.max(0, panelTop - 12);
  const panelHeight = panelBottom - panelTop;

  let scrollY: number;
  if (panelHeight + 12 + bottomPadding <= viewport) {
    scrollY = scrollForPanelTop;
  } else if (
    panelTop - scrollForButton >= 0 &&
    buttonBottom - scrollForButton <= viewport - bottomPadding
  ) {
    scrollY = scrollForButton;
  } else {
    scrollY = Math.max(scrollForButton, scrollForPanelTop);
  }

  return Math.min(Math.max(0, scrollY), tapeMax);
}

function initialRowScrollY(metrics: DemoScrollMetrics, row: 1 | 2 | 3): number {
  if (row === 1) return metrics.initialRows.row1;
  if (row === 2) return metrics.initialRows.row2;
  return metrics.initialRows.row3;
}

function refinedRowScrollY(metrics: DemoScrollMetrics, row: 1 | 2): number {
  const measured = row === 1 ? metrics.refinedRows.row1 : metrics.refinedRows.row2;
  if (measured > 0) return measured;
  return row === 1 ? metrics.initialRows.row1 : metrics.initialRows.row2;
}

function refinedBrowseScroll(metrics: DemoScrollMetrics): DemoRefinedBrowseScroll {
  if (metrics.refinedBrowse) return metrics.refinedBrowse;
  const row1 = refinedRowScrollY(metrics, 1);
  const row2 = refinedRowScrollY(metrics, 2);
  const exitScrollY = metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
  return {
    fromScrollY: Math.max(exitScrollY, row2 + 24, row1 + 120),
    row1,
    row2,
  };
}

function computeScrollY(
  phase: WalkthroughPhase,
  phaseElapsed: number,
  metrics: DemoScrollMetrics,
): number {
  const { ctaScrollY, refineScrollY, refineViewScrollY } = metrics;
  const row1 = initialRowScrollY(metrics, 1);
  const row2 = initialRowScrollY(metrics, 2);
  const row3 = initialRowScrollY(metrics, 3);
  const refinedRow1 = refinedRowScrollY(metrics, 1);
  const refinedRow2 = refinedRowScrollY(metrics, 2);
  const refinedBrowse = refinedBrowseScroll(metrics);

  if (phase === "search-typing") {
    return 0;
  }

  if (phase === "scroll-to-cta") {
    return lerpScrollEaseInOut(0, ctaScrollY, phaseElapsed, PHASE_DURATION["scroll-to-cta"]);
  }

  if (
    phase === "search-cursor-hold" ||
    phase === "search-cursor-click" ||
    phase === "search-finding"
  ) {
    return ctaScrollY;
  }

  if (phase === "scroll-to-results") {
    return lerpScrollEaseInOut(
      ctaScrollY,
      row1,
      phaseElapsed,
      PHASE_DURATION["scroll-to-results"],
    );
  }

  if (phase === "results-scroll") {
    return lerpScrollEaseInOut(row1, row3, phaseElapsed, PHASE_DURATION["results-scroll"]);
  }

  if (phase === "results-end-hold") {
    return row3;
  }

  if (phase === "scroll-to-refine") {
    return lerpScrollEaseInOut(
      row3,
      refineViewScrollY,
      phaseElapsed,
      PHASE_DURATION["scroll-to-refine"],
    );
  }

  if (HERO_DEMO_REFINE_LOCKED_SCROLL_PHASES.includes(phase)) {
    return refineViewScrollY;
  }

  if (phase === "refine-updating") {
    if (!metrics.refinedBrowse) {
      return metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
    }
    if (phaseElapsed < HERO_DEMO_REFINE_SCROLL_UP_MS) {
      return lerpScrollEaseInOut(
        refinedBrowse.fromScrollY,
        refinedBrowse.row1,
        phaseElapsed,
        HERO_DEMO_REFINE_SCROLL_UP_MS,
      );
    }
    return refinedBrowse.row1;
  }

  if (phase === "refined-row1-hold") {
    if (!metrics.refinedBrowse) {
      return metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
    }
    return refinedBrowse.row1;
  }

  if (phase === "refined-scroll") {
    if (!metrics.refinedBrowse) {
      return metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
    }
    return lerpScrollEaseInOut(
      refinedBrowse.row1,
      refinedBrowse.row2,
      phaseElapsed,
      PHASE_DURATION["refined-scroll"],
    );
  }

  if (phase === "refined-row2-hold") {
    if (!metrics.refinedBrowse) {
      return metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
    }
    return refinedBrowse.row2;
  }

  if (
    phase === "refined-details-cursor-move" ||
    phase === "refined-details-hold" ||
    HERO_DEMO_DETAIL_PHASES.includes(phase)
  ) {
    // Freeze the underlying tape while the detail overlay is shown on top.
    if (!metrics.refinedBrowse) {
      return metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
    }
    return refinedBrowse.row2;
  }

  return 0;
}

function linearProgress(phaseElapsed: number, duration: number): number {
  return Math.min(1, Math.max(0, phaseElapsed / duration));
}

function computeCursorState(
  phase: WalkthroughPhase,
  phaseElapsed: number,
  cursor: DemoCursorMetrics,
  scrollY: number,
  scrollMetrics: DemoScrollMetrics,
  loopResetCursorFrom: DemoCursorPoint | null = null,
): DemoFrameState["cursor"] {
  const visible = true;
  const { scaleX, scaleY } = cursor;
  const { ctaScrollY, refineScrollY, refineViewScrollY } = scrollMetrics;
  const row1 = initialRowScrollY(scrollMetrics, 1);
  const row2 = initialRowScrollY(scrollMetrics, 2);
  const row3 = initialRowScrollY(scrollMetrics, 3);
  const refinedRow1 = refinedRowScrollY(scrollMetrics, 1);
  const refinedRow2 = refinedRowScrollY(scrollMetrics, 2);
  const refinedBrowse = refinedBrowseScroll(scrollMetrics);
  const [initialRow1Center, initialRow2Center, initialRow3Center] = cursor.initialRowCenters;
  const refinedViewDetailsTape = cursor.refinedViewDetailsTape;
  const refinedViewDetailsStage = cursor.refinedViewDetailsStage;

  const toCursor = (tapePoint: DemoCursorPoint, atScrollY: number = scrollY): DemoCursorPoint =>
    tapePointToCursor(tapePoint, atScrollY, scaleX, scaleY);

  const scrollBlend = (
    from: DemoCursorPoint,
    to: DemoCursorPoint,
    fromScroll: number,
    toScroll: number,
  ): DemoCursorPoint => {
    const t = scrollBlendProgress(scrollY, fromScroll, toScroll);
    return toCursor(lerpPoint(from, to, t));
  };

  const phaseBlend = (
    from: DemoCursorPoint,
    to: DemoCursorPoint,
    duration: number,
    atScrollY: number,
  ): DemoCursorPoint => {
    const t = easeInOutCubic(linearProgress(phaseElapsed, duration));
    return toCursor(lerpPoint(from, to, t), atScrollY);
  };

  if (phase === "search-typing") {
    const target = toCursor(cursor.prompt);
    if (loopResetCursorFrom && phaseElapsed < HERO_DEMO_LOOP_RESET_CURSOR_MS) {
      const t = easeInOutCubic(linearProgress(phaseElapsed, HERO_DEMO_LOOP_RESET_CURSOR_MS));
      return {
        x: loopResetCursorFrom.x + (target.x - loopResetCursorFrom.x) * t,
        y: loopResetCursorFrom.y + (target.y - loopResetCursorFrom.y) * t,
        visible,
        clicking: false,
      };
    }
    return { ...target, visible, clicking: false };
  }

  if (phase === "scroll-to-cta") {
    if (phaseElapsed < HERO_DEMO_SEARCH_POST_TYPE_PAUSE_MS) {
      return { ...toCursor(cursor.prompt), visible, clicking: false };
    }
    const moveElapsed = phaseElapsed - HERO_DEMO_SEARCH_POST_TYPE_PAUSE_MS;
    const t = easeInOutCubic(linearProgress(moveElapsed, HERO_DEMO_CURSOR_MOVE_MS));
    return {
      ...toCursor(lerpPoint(cursor.prompt, cursor.getMyPicks, t), scrollY),
      visible,
      clicking: false,
    };
  }

  if (
    phase === "search-cursor-hold" ||
    phase === "search-cursor-click" ||
    phase === "search-finding"
  ) {
    return {
      ...toCursor(cursor.getMyPicks),
      visible,
      clicking: phase === "search-cursor-click",
    };
  }

  if (phase === "scroll-to-results") {
    return {
      ...scrollBlend(cursor.getMyPicks, initialRow1Center, ctaScrollY, row1),
      visible,
      clicking: false,
    };
  }

  if (phase === "results-scroll") {
    return {
      ...scrollBlend(initialRow1Center, initialRow3Center, row1, row3),
      visible,
      clicking: false,
    };
  }

  if (phase === "results-end-hold") {
    return { ...toCursor(initialRow3Center), visible, clicking: false };
  }

  if (phase === "scroll-to-refine") {
    return {
      ...scrollBlend(initialRow3Center, cursor.refineInput, row3, refineViewScrollY),
      visible,
      clicking: false,
    };
  }

  if (phase === "refine") {
    return { ...toCursor(cursor.refineInput, refineViewScrollY), visible, clicking: false };
  }

  if (phase === "refine-settle") {
    return { ...toCursor(cursor.refineInput, refineViewScrollY), visible, clicking: false };
  }

  if (phase === "refine-cursor-move") {
    return {
      ...phaseBlend(
        cursor.refineInput,
        cursor.refineButton,
        PHASE_DURATION["refine-cursor-move"],
        refineViewScrollY,
      ),
      visible,
      clicking: false,
    };
  }

  if (phase === "refine-cursor-hold") {
    return { ...toCursor(cursor.refineButton, refineViewScrollY), visible, clicking: false };
  }

  if (phase === "refine-cursor-click") {
    return { ...toCursor(cursor.refineButton, refineViewScrollY), visible, clicking: true };
  }

  if (phase === "refine-updating") {
    if (phaseElapsed < HERO_DEMO_REFINE_SCROLL_UP_MS) {
      return {
        ...scrollBlend(
          cursor.refineButton,
          initialRow1Center,
          refinedBrowse.fromScrollY,
          refinedBrowse.row1,
        ),
        visible,
        clicking: false,
      };
    }
    return { ...toCursor(initialRow1Center, refinedBrowse.row1), visible, clicking: false };
  }

  if (phase === "refined-row1-hold") {
    return { ...toCursor(initialRow1Center, refinedBrowse.row1), visible, clicking: false };
  }

  if (phase === "refined-scroll") {
    return {
      ...scrollBlend(
        initialRow1Center,
        initialRow2Center,
        refinedBrowse.row1,
        refinedBrowse.row2,
      ),
      visible,
      clicking: false,
    };
  }

  if (phase === "refined-row2-hold") {
    return { ...toCursor(initialRow2Center, refinedBrowse.row2), visible, clicking: false };
  }

  if (phase === "refined-details-cursor-move") {
    const from = toCursor(initialRow2Center, refinedBrowse.row2);
    const t = easeInOutCubic(linearProgress(phaseElapsed, PHASE_DURATION["refined-details-cursor-move"]));
    return {
      x: from.x + (refinedViewDetailsStage.x - from.x) * t,
      y: from.y + (refinedViewDetailsStage.y - from.y) * t,
      visible,
      clicking: false,
    };
  }

  if (phase === "refined-details-hold") {
    return { ...refinedViewDetailsStage, visible, clicking: false };
  }

  if (HERO_DEMO_DETAIL_PHASES.includes(phase)) {
    // Detail overlay is on top — hide the fake cursor, keep it parked.
    return { ...refinedViewDetailsStage, visible: false, clicking: false };
  }

  return { ...toCursor(cursor.prompt), visible, clicking: false };
}

function phaseResultsRevealed(phase: WalkthroughPhase, phaseElapsed: number): boolean {
  if (
    phase === "search-typing" ||
    phase === "scroll-to-cta" ||
    phase === "search-cursor-hold" ||
    phase === "search-cursor-click" ||
    phase === "search-finding"
  ) {
    return false;
  }

  if (phase === "scroll-to-results") {
    return (
      phaseElapsed / PHASE_DURATION["scroll-to-results"] >=
      HERO_DEMO_RESULTS_REVEAL_SCROLL_PROGRESS
    );
  }

  // Refine transition: fade the results out while the viewport resets to the top
  // so the OLD cards are never scrolled through, and the initial→refined grid swap
  // happens hidden (at opacity 0). The refined grid then fades back in already at
  // the top from `refined-row1-hold` onward (see HERO_DEMO_REFINED_GRID_PHASES).
  if (phase === "refine-updating") {
    return false;
  }

  return true;
}

function phaseHideRefinePanel(phase: WalkthroughPhase): boolean {
  return HERO_DEMO_HIDE_REFINE_PANEL_PHASES.includes(phase);
}

function phaseShowRefinedResults(phase: WalkthroughPhase): boolean {
  return HERO_DEMO_REFINED_GRID_PHASES.includes(phase);
}

function phaseDetailPreview(
  phase: WalkthroughPhase,
  phaseElapsed: number,
): DemoFrameState["detailPreview"] {
  if (phase === "detail-open") return { open: true, scrollProgress: 0 };
  if (phase === "detail-scroll") {
    return {
      open: true,
      scrollProgress: easeInOutCubic(phaseElapsed / PHASE_DURATION["detail-scroll"]),
    };
  }
  if (phase === "detail-hold") return { open: true, scrollProgress: 1 };
  return { open: false, scrollProgress: 0 };
}

export function computeDemoFrame(
  loopElapsed: number,
  scrollMetrics: DemoScrollMetrics,
  cursorMetrics: DemoCursorMetrics,
  options?: { loopResetCursorFrom?: DemoCursorPoint | null },
): DemoFrameState {
  const { phase, phaseElapsed } = resolveWalkthroughPhase(loopElapsed);

  let displayedPrompt = HOME_HERO_DEMO_PROMPT;
  if (phase === "search-typing") {
    displayedPrompt = typingSlice(HOME_HERO_DEMO_PROMPT, phaseElapsed, HERO_DEMO_TYPING_MS);
  }

  let displayedRefine = "";
  if (phase === "refine") {
    displayedRefine = typingSlice(HOME_HERO_DEMO_REFINE, phaseElapsed, HERO_DEMO_REFINE_TYPING_MS);
  } else if (HERO_DEMO_REFINE_TEXT_PHASES.includes(phase)) {
    displayedRefine = HOME_HERO_DEMO_REFINE;
  }

  const scrollY = computeScrollY(phase, phaseElapsed, scrollMetrics);
  const cursor = computeCursorState(
    phase,
    phaseElapsed,
    cursorMetrics,
    scrollY,
    scrollMetrics,
    options?.loopResetCursorFrom ?? null,
  );

  return {
    phase,
    phaseElapsed,
    loopElapsed,
    displayedPrompt,
    displayedRefine,
    scrollY,
    filtersEnabled: false,
    resultsRevealed: phaseResultsRevealed(phase, phaseElapsed),
    showRefinedResults: phaseShowRefinedResults(phase),
    hideRefinePanel: phaseHideRefinePanel(phase),
    detailPreview: phaseDetailPreview(phase, phaseElapsed),
    cursor,
  };
}

export type DemoCursorMeasureRefs = {
  stage: HTMLElement;
  tape: HTMLElement;
  promptTextarea: HTMLElement | null;
  getMyPicksButton: HTMLElement | null;
  refineInput: HTMLElement | null;
  refineButton: HTMLElement | null;
  resultsGrid: HTMLElement | null;
  refinedViewDetailsButton: HTMLElement | null;
};

export function measureCursorMetrics(
  refs: DemoCursorMeasureRefs,
  previous?: DemoCursorMetrics | null,
  options?: { refinedGrid?: boolean },
): DemoCursorMetrics | null {
  const {
    stage,
    tape,
    promptTextarea,
    getMyPicksButton,
    refineInput,
    refineButton,
    resultsGrid,
    refinedViewDetailsButton,
  } = refs;

  if (!promptTextarea || !getMyPicksButton || !refineInput || !refineButton || !resultsGrid) {
    return null;
  }

  const { scaleX, scaleY } = stageScale(stage);
  const rowCenters = computeGridRowCentersInTape(tape, resultsGrid);
  const fallbackCenter: DemoCursorPoint = { x: 0, y: 0 };
  const refinedGrid = options?.refinedGrid ?? resultsGrid.children.length <= 4;
  const viewDetailsTape = refinedViewDetailsButton
    ? elementCenterInTape(tape, refinedViewDetailsButton)
    : (previous?.refinedViewDetailsTape ?? rowCenters[1] ?? rowCenters[0] ?? fallbackCenter);
  const viewDetailsStage = refinedViewDetailsButton
    ? handPositionForTarget(stage, refinedViewDetailsButton)
    : (previous?.refinedViewDetailsStage ?? viewDetailsTape);

  const initialRowCenters: [DemoCursorPoint, DemoCursorPoint, DemoCursorPoint] = refinedGrid
    ? (previous?.initialRowCenters ?? [
        rowCenters[0] ?? fallbackCenter,
        rowCenters[1] ?? rowCenters[0] ?? fallbackCenter,
        rowCenters[2] ?? rowCenters[1] ?? rowCenters[0] ?? fallbackCenter,
      ])
    : [
        rowCenters[0] ?? fallbackCenter,
        rowCenters[1] ?? rowCenters[0] ?? fallbackCenter,
        rowCenters[2] ?? rowCenters[1] ?? rowCenters[0] ?? fallbackCenter,
      ];

  const refinedRowCenters: [DemoCursorPoint, DemoCursorPoint] = refinedGrid
    ? [
        rowCenters[0] ?? fallbackCenter,
        rowCenters[1] ?? rowCenters[0] ?? fallbackCenter,
      ]
    : (previous?.refinedRowCenters ?? [
        initialRowCenters[0],
        initialRowCenters[1],
      ]);

  return {
    scaleX,
    scaleY,
    prompt: elementCenterInTape(tape, promptTextarea),
    getMyPicks: elementCenterInTape(tape, getMyPicksButton),
    refineInput: elementCenterInTape(tape, refineInput),
    refineButton: elementCenterInTape(tape, refineButton),
    initialRowCenters,
    refinedRowCenters,
    refinedViewDetailsTape: viewDetailsTape,
    refinedViewDetailsStage: viewDetailsStage,
  };
}

export function captureRefinedBrowseScroll(
  metrics: DemoScrollMetrics,
): DemoScrollMetrics {
  const row1 = metrics.initialRows.row1;
  const row2 = Math.max(metrics.initialRows.row2, row1 + HERO_DEMO_REFINED_ROW_MIN_GAP_PX);
  const exitScrollY = metrics.refineExitScrollY || metrics.lockedRefineViewScrollY;
  const fromScrollY = Math.max(exitScrollY, row2 + 32);
  return {
    ...metrics,
    refinedRows: { row1, row2 },
    refinedBrowse: { fromScrollY, row1, row2 },
  };
}

export function freezeRefineExitScroll(metrics: DemoScrollMetrics): DemoScrollMetrics {
  return {
    ...metrics,
    refineExitScrollY: metrics.refineViewScrollY,
    lockedRefineViewScrollY: metrics.refineViewScrollY,
    refinedBrowse: null,
  };
}

export function clearRefinedBrowseScroll(metrics: DemoScrollMetrics): DemoScrollMetrics {
  return {
    ...metrics,
    refinedBrowse: null,
    refinedRows: { row1: 0, row2: 0 },
    refineExitScrollY: metrics.refineExitScrollY,
  };
}

export function preloadImageUrls(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

export function waitAnimationFrames(frameCount: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = frameCount;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
