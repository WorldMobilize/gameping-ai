/**
 * Theme-aware styles for the recommend advanced filters panel.
 * UI tokens only — no filter logic. Unified GamePing blue identity.
 */

export const RECOMMEND_FILTER_TOGGLE_ON =
  "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-600/50 dark:bg-blue-950/40 dark:text-blue-200";

// No visible default border in light mode (border-transparent so the call
// site's bare `border` doesn't fall back to currentColor) — depth comes from
// the frosted glass surface + soft shadow. Dark keeps a subtle slate edge for
// definition on the cinematic background. Hover/selected stay blue.
export const RECOMMEND_FILTER_TOGGLE_OFF =
  "border-transparent bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-600/50 dark:hover:bg-slate-900";

export const RECOMMEND_FILTER_TOGGLE_TRACK_ON = "justify-end bg-blue-600 dark:bg-blue-500";

export const RECOMMEND_FILTER_TOGGLE_TRACK_OFF =
  "justify-start bg-slate-300 dark:bg-slate-600";

// No default outline in light mode (border-transparent) to avoid the pale-blue
// remap artifact on the frosted surface; depth via shadow. Hover/focus = blue.
export const RECOMMEND_FILTER_PRESET_CARD =
  "rounded-2xl border border-transparent bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-slate-950/30 dark:hover:border-blue-600/50";

export const RECOMMEND_FILTER_PLATFORM_SELECTED =
  "border-blue-300 bg-blue-50 shadow-md shadow-blue-100/50 dark:border-blue-600/50 dark:bg-blue-950/40 dark:shadow-blue-950/20";

// No default outline in light mode (border-transparent); the OPTION_BASE
// shadow provides depth. Dark keeps a subtle slate edge. Hover/selected = blue.
export const RECOMMEND_FILTER_PLATFORM_UNSELECTED =
  "border-transparent bg-white hover:border-blue-200 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/70 dark:hover:border-blue-600/40 dark:hover:shadow-slate-950/30";

export const RECOMMEND_FILTER_BUDGET_PANEL =
  "rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/50";

// Budget slider: thumb/track follow the page accent (blue). The `.gp-budget-range`
// class (see recommend-page.css) strips the native focus outline across browsers and
// applies the standard GamePing page-accent ring on keyboard focus only — so no
// rectangle appears around the slider. Focus styling lives in CSS (not Tailwind here)
// to reach the webkit/moz range pseudo-elements and override the shared input:focus glow.
export const RECOMMEND_FILTER_BUDGET_RANGE =
  "gp-budget-range mt-6 w-full cursor-pointer rounded-full accent-[color:var(--page-accent)]";

// Budget number input: same shape as APP_INPUT but the focus border/ring follow
// the page accent, so it matches the rest of the product.
export const RECOMMEND_FILTER_BUDGET_INPUT =
  "mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--page-accent-border)] focus:ring-2 focus:ring-[color:var(--page-accent-soft)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500";

export const RECOMMEND_FILTER_TAG_ACTIVE =
  "bg-blue-800 text-white shadow-sm";

// Borderless tag pill: the call site keeps a transparent `border` only to reserve
// width (no layout shift) — no visible outline in any state, including hover.
// Depth comes from the frosted surface + soft shadow; hover lifts the background
// tint and text colour instead of drawing a border. Focus ring is at the call site.
export const RECOMMEND_FILTER_TAG_INACTIVE =
  "bg-white text-slate-700 shadow-sm hover:bg-blue-50/70 hover:text-blue-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-blue-300";

export const RECOMMEND_FILTER_OPTION_BASE =
  "rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]";
