import type { ReactNode } from "react";

/**
 * Landing icon system — one coherent set of line glyphs shared across every
 * landing section (hero pillars, How it works, Feature bento, Discovery cards,
 * Companion steps). Each glyph is drawn on a 24×24 grid, optically centred, and
 * uses only `currentColor` + `stroke` so it renders white inside the blue
 * `PremiumIcon` chip and accent-blue when placed inline — no new colours.
 *
 * These are the inner paths only; wrap them in an <svg viewBox="0 0 24 24"
 * fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
 * strokeLinejoin="round"> (each section's local `Icon`). Reuse the SAME glyph
 * for the same concept so the page reads as one system. Presentation only.
 */

/* ── Ecosystem pillars ── */

/** Discovery — a clean magnifier (search / find). */
export const GLYPH_DISCOVERY: ReactNode = (
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.6 15.6 20 20" />
  </>
);

/** Companion — a screen with answer lines + a stand (overlay while you play). */
export const GLYPH_COMPANION: ReactNode = (
  <>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M7.5 8.5h9M7.5 11.5h5.5" />
    <path d="M9 21h6M12 17v4" />
  </>
);

/** WorldMobilize — a globe (one connected world). */
export const GLYPH_WORLDMOBILIZE: ReactNode = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c3 3 4.6 6 4.6 9S15 18 12 21c-3-3-4.6-6-4.6-9S9 6 12 3z" />
  </>
);

/* ── Discovery tools ── */

/** AI Recommendations — a sparkle (AI magic). */
export const GLYPH_SPARKLE: ReactNode = (
  <>
    <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z" />
    <path d="M18.7 13.6l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </>
);

/** Games Like… — two overlapping cards (more titles like this one). */
export const GLYPH_SIMILAR: ReactNode = (
  <>
    <rect x="8" y="3" width="11" height="15" rx="2" />
    <rect x="4" y="6" width="11" height="15" rx="2" />
  </>
);

/** Hidden Gems — a cut gem. */
export const GLYPH_GEM: ReactNode = (
  <>
    <path d="M6 3h12l3 6-9 12L3 9z" />
    <path d="M3 9h18M9 3l3 6 3-6" />
  </>
);

/** Games of the Week — a calendar with the current day marked. */
export const GLYPH_CALENDAR: ReactNode = (
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9.5h18M8 3v4M16 3v4" />
    <rect x="6.5" y="12.5" width="4" height="3.5" rx="1" />
  </>
);

/** Curated Collections — stacked layers (a curated set). */
export const GLYPH_LAYERS: ReactNode = (
  <>
    <path d="M12 3l8 4-8 4-8-4z" />
    <path d="M4 12l8 4 8-4" />
    <path d="M4 16l8 4 8-4" />
  </>
);

/** Browse Games — a tile grid (the full library). */
export const GLYPH_GRID: ReactNode = (
  <>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </>
);

/* ── Companion steps ── */

/** Press a shortcut — a keyboard. */
export const GLYPH_KEYBOARD: ReactNode = (
  <>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <path d="M6 10.5h.01M9.5 10.5h.01M13 10.5h.01M16.5 10.5h.01M8 14h8" />
  </>
);

/** Ask in plain words — a chat bubble. */
export const GLYPH_CHAT: ReactNode = (
  <>
    <path d="M20 14.5a2 2 0 0 1-2 2H9l-4 3.5V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z" />
    <path d="M8.5 9h8M8.5 12h5" />
  </>
);

/** Get the answer — a lightning bolt (instant). */
export const GLYPH_BOLT: ReactNode = <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />;

/* ── Feature bento ── */

/** Price-drop pings — a bell (notify). */
export const GLYPH_BELL: ReactNode = (
  <>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </>
);

/* ── Discovery · Personal (premium) ── */

/** Weekly Picks — a star: the short list picked for you. */
export const GLYPH_STAR: ReactNode = (
  <path d="M12 3.5l2.6 5.5 5.9.8-4.3 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.5 9.8l5.9-.8z" />
);

/** Deals For You — a price tag. */
export const GLYPH_TAG: ReactNode = (
  <>
    <path d="M20.5 12.5l-8 8-9-9V3h8.5z" />
    <circle cx="7.6" cy="7.6" r="1.2" />
  </>
);

/** Monthly Recap — a written report. */
export const GLYPH_RECAP: ReactNode = (
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </>
);

/** Steam Library — the imported library that feeds everything else. */
export const GLYPH_LIBRARY: ReactNode = (
  <>
    <rect x="3.5" y="4" width="4" height="16" rx="1.2" />
    <rect x="9.5" y="4" width="4" height="16" rx="1.2" />
    <path d="M16 5.6l3.9 1.1-3.1 13-2.4-.7" />
  </>
);

/** Your GamePing DNA — a double helix. */
export const GLYPH_DNA: ReactNode = (
  <>
    <path d="M9 3Q15 7 9 12 3 17 9 21" />
    <path d="M15 3Q9 7 15 12 21 17 15 21" />
    <path d="M9.8 5.2h4.4M9 12h6M9.8 18.8h4.4" />
  </>
);
