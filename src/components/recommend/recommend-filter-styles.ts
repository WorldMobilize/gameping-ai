/**
 * Theme-aware styles for the recommend advanced filters panel.
 * UI tokens only — no filter logic. Recommend identity = green / emerald.
 */

export const RECOMMEND_FILTER_TOGGLE_ON =
  "border-green-300 bg-green-50 text-green-800 dark:border-green-600/50 dark:bg-green-950/40 dark:text-green-200";

// No visible default border in light mode (border-transparent so the call
// site's bare `border` doesn't fall back to currentColor) — depth comes from
// the frosted glass surface + soft shadow. Dark keeps a subtle slate edge for
// definition on the cinematic background. Hover/selected stay green.
export const RECOMMEND_FILTER_TOGGLE_OFF =
  "border-transparent bg-white text-slate-700 shadow-sm hover:border-green-300 hover:bg-green-50/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-green-600/50 dark:hover:bg-slate-900";

export const RECOMMEND_FILTER_TOGGLE_TRACK_ON = "justify-end bg-green-600 dark:bg-green-500";

export const RECOMMEND_FILTER_TOGGLE_TRACK_OFF =
  "justify-start bg-slate-300 dark:bg-slate-600";

// No default outline in light mode (border-transparent) to avoid the pale-green
// remap artifact on the frosted surface; depth via shadow. Hover/focus = green.
export const RECOMMEND_FILTER_PRESET_CARD =
  "rounded-2xl border border-transparent bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-300/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-slate-950/30 dark:hover:border-green-600/50";

export const RECOMMEND_FILTER_PLATFORM_SELECTED =
  "border-green-300 bg-green-50 shadow-md shadow-green-100/50 dark:border-green-600/50 dark:bg-green-950/40 dark:shadow-green-950/20";

// No default outline in light mode (border-transparent); the OPTION_BASE
// shadow provides depth. Dark keeps a subtle slate edge. Hover/selected = green.
export const RECOMMEND_FILTER_PLATFORM_UNSELECTED =
  "border-transparent bg-white hover:border-green-200 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/70 dark:hover:border-green-600/40 dark:hover:shadow-slate-950/30";

export const RECOMMEND_FILTER_BUDGET_PANEL =
  "rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/50";

// Budget slider: thumb/track follow the page accent (green here) and the native
// focus outline is replaced with a soft, rounded page-accent ring so the focus
// stays keyboard-visible without the ugly browser-default rectangle.
export const RECOMMEND_FILTER_BUDGET_RANGE =
  "mt-6 w-full cursor-pointer rounded-full accent-[color:var(--page-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

// Budget number input: same shape as APP_INPUT but the focus border/ring follow
// the page accent instead of the global cyan, so it matches the recommend page.
export const RECOMMEND_FILTER_BUDGET_INPUT =
  "mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--page-accent-border)] focus:ring-2 focus:ring-[color:var(--page-accent-soft)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500";

export const RECOMMEND_FILTER_TAG_ACTIVE =
  "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-sm shadow-green-600/20";

// Borderless tag pill: the call site keeps a transparent `border` only to reserve
// width (no layout shift) — no visible outline in any state, including hover.
// Depth comes from the frosted surface + soft shadow; hover lifts the background
// tint and text colour instead of drawing a border. Focus ring is at the call site.
export const RECOMMEND_FILTER_TAG_INACTIVE =
  "bg-white text-slate-700 shadow-sm hover:bg-green-50/70 hover:text-green-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-green-300";

export const RECOMMEND_FILTER_OPTION_BASE =
  "rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]";
