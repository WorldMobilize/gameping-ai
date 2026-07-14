"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { NAVY_CTA_LG } from "@/components/app/app-styles";
import PremiumIcon from "@/components/home/landing/PremiumIcon";
import {
  GLYPH_CALENDAR,
  GLYPH_DNA,
  GLYPH_GEM,
  GLYPH_GRID,
  GLYPH_LAYERS,
  GLYPH_LIBRARY,
  GLYPH_RECAP,
  GLYPH_SIMILAR,
  GLYPH_SPARKLE,
  GLYPH_STAR,
  GLYPH_TAG,
} from "@/components/home/landing/landing-icons";

/**
 * Discovery chapter — scroll-driven "morph → cards reveal", fully REVERSIBLE and
 * in NORMAL DOCUMENT FLOW.
 *
 * No pinning, no scroll-lock, no animation library — the page scrolls naturally.
 * A single rAF-throttled scroll handler maps the section's position in the
 * viewport to a `progress` (0..1) and interpolates EVERYTHING imperatively
 * (transform + opacity only), with ZERO React re-renders in the loop. Because the
 * effect is a pure function of `progress`, scrolling back up reverses it on its
 * own. Every interpolation passes through `smoothstep`.
 *
 * Editorial FLIP: the whole block (eyebrow, headline, subtitle, CTA) starts as a
 * big centred hero and travels to its small resting slot in the left column.
 * There are two copies of the content with morphing elements marked `data-m` in
 * the SAME ORDER:
 *   1. GHOST — big, centred, at the top of the section, `aria-hidden`. The
 *      OPENING layout and the measurement reference.
 *   2. FINAL — small, left column, the true resting position.
 * Each FINAL element is translated + scaled onto its GHOST twin and returns home
 * as progress grows (inv → 0). To keep both held states pixel-crisp, the reading
 * HOLD shows the GHOST itself; the FINAL cross-fades in only while it's flying
 * (where transform-scaling blur is imperceptible).
 *
 * Cards emerge from a source point inside the text block, travelling to their
 * slot (scale 0.42 → 1) in a wave, row by row.
 *
 * Below lg OR with prefers-reduced-motion: no scrub — all inline styles are
 * cleared and the final static layout shows.
 */

/* ── Choreography (fractions of the scroll pass-through) ── */
const COLS = 3; // active only ≥1024px, where the grid is lg:grid-cols-3
const MORPH_START = 0.34; // 0 → here: reading HOLD, big centred hero, still
const MORPH_END = 0.6; // block has reached its small left home by here
const STAGGER = 0.012; // top→bottom cascade between morphing elements
// Card reveal windows per row (col adds +0.01 each). Rows 0–1 are the six Explore
// cards; row 2 is the "Personal" header and row 3 its five premium cards, so the
// personal half lands last, as its own beat. Nothing extends past 0.94.
const ROW_WINDOWS: [number, number][] = [
  [0.54, 0.72],
  [0.6, 0.8],
  [0.66, 0.86],
  [0.72, 0.92],
];
// The reading HOLD shows the crisp, centred GHOST; the FLYING FINAL cross-fades
// in only while it's in motion (where scaling blur is imperceptible), so both
// held states — big hero and small rest — stay pixel-crisp.
const GHOST_FADE: [number, number] = [0.34, 0.52];
const FINAL_FADE: [number, number] = [0.4, 0.58];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Hermite smoothstep — the single easing every interpolation passes through. */
function smoothstep(e0: number, e1: number, x: number) {
  if (e0 === e1) return x < e0 ? 0 : 1;
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/** Shared landing glyph — matches the Icon used across the ecosystem sections. */
function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

type Tool = { title: string; desc: string; href: string; icon: ReactNode };

/** The six Discovery tools — one per revealed card. */
const TOOLS: Tool[] = [
  {
    title: "AI Recommendations",
    desc: "Describe a vibe and get games that fit — each with a clear reason.",
    href: "/recommend",
    icon: GLYPH_SPARKLE,
  },
  {
    title: "Games Like…",
    desc: "Loved one game? Find your next favourite, matched on what made it click.",
    href: "/games-like",
    icon: GLYPH_SIMILAR,
  },
  {
    title: "Hidden Gems",
    desc: "Underrated games worth your time, refreshed regularly.",
    href: "/hidden-gems",
    icon: GLYPH_GEM,
  },
  {
    title: "Games of the Week",
    desc: "A fresh rotation of standout games every week.",
    href: "/games-of-the-week",
    icon: GLYPH_CALENDAR,
  },
  {
    title: "Curated Collections",
    desc: "Hand-built lists around themes, moods, and moments.",
    href: "/collections",
    icon: GLYPH_LAYERS,
  },
  {
    title: "A–Z Games Directory",
    desc: "Explore the full A–Z library at your own pace.",
    href: "/games",
    icon: GLYPH_GRID,
  },
];

/**
 * The Personal (premium) half of Discovery — the same five tools the /discover
 * hub lists under "Personal", with the copy anonymous visitors see there. They
 * ride the same reveal wave as the six above, one row later.
 */
const PERSONAL: Tool[] = [
  {
    title: "Weekly Picks",
    desc: "A short, personalized shortlist refreshed every week from your taste.",
    href: "/weekly-picks",
    icon: GLYPH_STAR,
  },
  {
    title: "Deals For You",
    desc: "Price drops on games matched to how you actually play.",
    href: "/deals-for-you",
    icon: GLYPH_TAG,
  },
  {
    title: "Monthly Recap",
    desc: "A monthly look back at your gaming, with a taste read and what's next.",
    href: "/monthly-recap",
    icon: GLYPH_RECAP,
  },
  {
    title: "Taste DNA",
    desc: "A play-style fingerprint that explains why a game fits you.",
    href: "/how-it-works/taste-memory",
    icon: GLYPH_DNA,
  },
  {
    title: "Steam Library",
    desc: "Powers Weekly Picks, Deals For You, Monthly Recap & Taste DNA.",
    href: "/how-it-works/steam-import",
    icon: GLYPH_LIBRARY,
  },
];

/** One revealed card. Explore and Personal share it — same surface, same behaviour. */
function ToolCard({
  tool,
  card,
  heading,
  body,
}: {
  tool: Tool;
  card: string;
  heading: string;
  body: string;
}) {
  return (
    <div data-card>
      <Link
        href={tool.href}
        className={`group flex h-full flex-col gap-4 rounded-2xl border p-5 transition-[border-color,box-shadow] duration-300 hover:border-blue-400/45 ${card}`}
      >
        <PremiumIcon className="h-12 w-12 transition-transform duration-300 group-hover:scale-105">
          <Icon>{tool.icon}</Icon>
        </PremiumIcon>
        <span className="min-w-0">
          <span className={`block text-[15px] font-semibold tracking-tight ${heading}`}>
            {tool.title}
          </span>
          <span className={`mt-1 block text-sm leading-5 ${body}`}>{tool.desc}</span>
        </span>
      </Link>
    </div>
  );
}

/**
 * The editorial block, rendered twice: `ghost` (big, centred — reference) and
 * `final` (small, left — resting). Elements carry `data-m` in the SAME ORDER in
 * both so measurement pairs them by index: eyebrow → headline → subtitle → CTA.
 */
function Editorial({
  variant,
  heading,
  body,
  eyebrow,
}: {
  variant: "ghost" | "final";
  heading: string;
  body: string;
  eyebrow: string;
}) {
  const ghost = variant === "ghost";
  return (
    <>
      <p
        data-m
        className={`flex items-center gap-3 font-semibold uppercase ${eyebrow} ${
          ghost ? "justify-center text-sm tracking-[0.28em]" : "w-fit text-[13px] tracking-[0.2em]"
        }`}
      >
        <span className="tabular-nums">01</span>
        <span className="h-px w-8 bg-current opacity-40" aria-hidden />
        Discovery
      </p>

      <h2
        data-m
        className={`gp-home-display font-semibold uppercase leading-[0.98] ${heading} ${
          ghost ? "text-[3.5rem] sm:text-[5.5rem]" : "w-fit text-[2.4rem]"
        }`}
      >
        Discovery
      </h2>

      <p
        data-m
        className={`leading-relaxed ${body} ${
          ghost ? "max-w-[36rem] text-xl sm:text-2xl" : "max-w-[17rem] text-base"
        }`}
      >
        Every way to find your next game — recommendations, look-alikes, hidden gems and more, in one place.
      </p>

      <div data-m className="w-fit">
        <Link href="/discover" className={NAVY_CTA_LG} tabIndex={ghost ? -1 : undefined}>
          Open Discovery
        </Link>
      </div>
    </>
  );
}

export default function DiscoveryMorphShowcase({
  heading,
  body,
  eyebrow,
  className = "",
}: {
  heading: string;
  body: string;
  eyebrow: string;
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const finalRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const ghostC = ghostRef.current;
    const finalC = finalRef.current;
    const cardsC = cardsRef.current;
    if (!section || !ghostC || !finalC || !cardsC) return;

    const finalEls = Array.from(finalC.querySelectorAll<HTMLElement>("[data-m]"));
    const ghostEls = Array.from(ghostC.querySelectorAll<HTMLElement>("[data-m]"));
    const cardEls = Array.from(cardsC.querySelectorAll<HTMLElement>("[data-card]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let morph: { dx: number; dy: number; scale: number }[] = [];
    let cards: { dx: number; dy: number; row: number; col: number }[] = [];
    let active = false;
    let ticking = false;
    let raf = 0;
    let resizeTimer = 0;

    // Reset every driven element to its natural, untransformed geometry.
    const clearStyles = () => {
      for (const el of finalEls) {
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.willChange = "";
      }
      for (const el of cardEls) {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.pointerEvents = "";
        el.style.transformOrigin = "";
        el.style.willChange = "";
      }
      // Static / inactive: crisp final block visible, ghost hidden.
      ghostC.style.opacity = "0";
      finalC.style.opacity = "1";
    };

    // Measure only on mount / resize / fonts — with NOTHING transformed.
    const measure = () => {
      clearStyles();

      // FLIP deltas: final element → its ghost twin (same index).
      morph = finalEls.map((fEl, i) => {
        const gEl = ghostEls[i];
        const f = fEl.getBoundingClientRect();
        const g = gEl.getBoundingClientRect();
        const gFont = parseFloat(getComputedStyle(gEl).fontSize) || 1;
        const fFont = parseFloat(getComputedStyle(fEl).fontSize) || 1;
        // dx/dy from the top-left corners; scale from the font-size ratio (the
        // CTA uses it too — anchored top-left it stays clean even as a button).
        return { dx: g.left - f.left, dy: g.top - f.top, scale: gFont / fFont };
      });

      // Cards travel from a source point inside the (untransformed) text block.
      const hb = finalC.getBoundingClientRect();
      const sx = hb.left + hb.width * 0.72;
      const sy = hb.top + hb.height * 0.5;
      cards = cardEls.map((cEl, i) => {
        const c = cEl.getBoundingClientRect();
        return {
          dx: sx - (c.left + c.width / 2),
          dy: sy - (c.top + c.height / 2),
          row: Math.floor(i / COLS),
          col: i % COLS,
        };
      });

      // Prime origins + will-change once (never re-read after this).
      for (const el of finalEls) {
        el.style.transformOrigin = "0 0";
        el.style.willChange = "transform";
      }
      for (const el of cardEls) {
        el.style.transformOrigin = "center";
        el.style.willChange = "transform, opacity";
      }
    };

    // progress = clamp((ih*0.9 − section.top) / ih, 0, 1) — 0 as the section
    // enters low, 1 once it has scrolled a full viewport up. ~one screen of
    // scroll carries the whole choreography while the section stays in view.
    const progress = () => {
      const ih = window.innerHeight;
      return clamp01((ih * 0.9 - section.getBoundingClientRect().top) / ih);
    };

    const apply = (p: number) => {
      // Cross-fade: crisp centred ghost carries the hold; final fades in as it flies.
      ghostC.style.opacity = String(1 - smoothstep(GHOST_FADE[0], GHOST_FADE[1], p));
      finalC.style.opacity = String(smoothstep(FINAL_FADE[0], FINAL_FADE[1], p));
      // Editorial FLIP — each element morphs home with a top→bottom cascade.
      for (let i = 0; i < morph.length; i++) {
        const m = morph[i];
        const t = smoothstep(MORPH_START + i * STAGGER, MORPH_END + i * STAGGER, p);
        const inv = 1 - t;
        const s = m.scale + (1 - m.scale) * t;
        finalEls[i].style.transform = `translate(${m.dx * inv}px, ${m.dy * inv}px) scale(${s})`;
      }
      // Cards emerge from the source point in a per-row wave.
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const win = ROW_WINDOWS[Math.min(c.row, ROW_WINDOWS.length - 1)];
        const cp = smoothstep(win[0] + c.col * 0.01, win[1] + c.col * 0.01, p);
        const inv = 1 - cp;
        const el = cardEls[i];
        el.style.transform = `translate(${c.dx * inv}px, ${c.dy * inv}px) scale(${0.42 + 0.58 * cp})`;
        el.style.opacity = String(cp);
        el.style.pointerEvents = cp > 0.95 ? "" : "none";
      }
    };

    const update = () => {
      ticking = false;
      if (active) apply(progress());
    };

    const onScroll = () => {
      if (!active || ticking) return;
      ticking = true;
      raf = requestAnimationFrame(update);
    };

    // (Re)initialise: decide active, then measure + paint once (or go static).
    const setup = () => {
      active = window.innerWidth >= 1024 && !reduce.matches;
      if (!active) {
        cancelAnimationFrame(raf);
        clearStyles();
        return;
      }
      measure();
      apply(progress());
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setup, 150);
    };

    setup();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    reduce.addEventListener?.("change", setup);
    document.fonts?.ready
      ?.then(() => {
        if (!active) return;
        measure();
        apply(progress());
      })
      .catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reduce.removeEventListener?.("change", setup);
      clearStyles();
    };
  }, []);

  const card =
    "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";

  return (
    <section
      ref={sectionRef}
      id="discovery"
      className={`relative overflow-x-clip scroll-mt-[150px] py-24 sm:py-32 ${className}`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6">
        {/* GHOST — big centred opening layout + measurement reference. Kept in
            layout (invisible, not display:none) so it can be measured; hidden
            below lg where the static final layout takes over. */}
        <div
          ref={ghostRef}
          aria-hidden
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-x-0 top-6 z-0 hidden flex-col items-center gap-6 text-center will-change-[opacity] lg:flex"
        >
          <Editorial variant="ghost" heading={heading} body={body} eyebrow={eyebrow} />
        </div>

        <div className="grid items-start gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          {/* FINAL editorial — resting position + source of the card wave. */}
          <div ref={finalRef} className="flex flex-col items-start gap-5">
            <Editorial variant="final" heading={heading} body={body} eyebrow={eyebrow} />
          </div>

          {/* Cards — reveal from the text block, row by row: the six Explore
              tools, then the Personal (premium) half as its own beat. */}
          <div ref={cardsRef} className="flex flex-col gap-9">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.title} tool={tool} card={card} heading={heading} body={body} />
              ))}
            </div>

            <div data-card className="flex flex-col gap-4 border-t border-slate-200/80 pt-8 dark:border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className={`text-sm font-semibold uppercase tracking-[0.14em] ${heading}`}>Personal</h3>
                <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300">
                  Premium
                </span>
                <p className={`w-full text-sm leading-6 sm:w-auto ${body}`}>
                  Built from your library and your taste — not everyone&apos;s.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PERSONAL.map((tool) => (
                <ToolCard key={tool.title} tool={tool} card={card} heading={heading} body={body} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
