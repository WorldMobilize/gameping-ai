"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAVY_CTA_LG } from "@/components/app/app-styles";
import { steamPortraitImage } from "@/lib/curated/game-links";

/**
 * Discovery chapter — fluid, scroll-driven (NOT pinned).
 *
 * As you scroll normally through the section, the SAME "Discovery" title glides
 * from centred → its final left slot (scaling down) and the tool cards unfold
 * on the right, row by row. Everything is a pure function of the section's
 * scroll position, so the page never stops on the section and the animation
 * reverses when you scroll back up. Once in view, an auto-rotation walks a
 * "selected" highlight through the cards and a large panel below explains the
 * current tool with a real visual reference (game covers), advancing every few
 * seconds. Below lg / reduced-motion it renders the final static layout.
 */

type ToolKey = "recommend" | "gameslike" | "gems" | "week" | "curated" | "browse";

type Tool = { key: ToolKey; title: string; desc: string; long: string; href: string; covers: number[] };

const TOOLS: Tool[] = [
  {
    key: "recommend",
    title: "AI Recommendations",
    desc: "Describe a vibe and get games that fit — each with a clear reason.",
    long: "Describe a mood, a memory, or a mechanic you love. GamePing reads the intent and returns games that actually fit — each with a short, honest reason why it made the list.",
    href: "/recommend",
    covers: [413150, 1145360, 1091500],
  },
  {
    key: "gameslike",
    title: "Games Like…",
    desc: "Loved one game? Get your next favorite, matched on what made it click.",
    long: "Point at a game you loved and get its closest kin — matched on the feel, pacing, and mechanics that made it click, not just on shared tags.",
    href: "/games-like",
    covers: [1245620, 1086940],
  },
  {
    key: "gems",
    title: "Hidden Gems",
    desc: "Underrated games worth your time, refreshed regularly.",
    long: "A rotating shelf of underrated games worth your time — surfaced from the long tail and refreshed regularly, so there's always something new to find.",
    href: "/hidden-gems",
    covers: [1794680, 632360, 1966720],
  },
  {
    key: "week",
    title: "Games of the Week",
    desc: "A fresh rotation of standout games every week.",
    long: "A fresh, hand-checked rotation of standout releases and rediscoveries — a quick way to stay current without trawling every storefront yourself.",
    href: "/games-of-the-week",
    covers: [553850, 2050650, 990080],
  },
  {
    key: "curated",
    title: "Curated Collections",
    desc: "Hand-built lists around themes, moods, and moments.",
    long: "Hand-built lists around a theme, mood, or moment — every pick chosen for a reason, so each collection reads like a recommendation from a friend.",
    href: "/collections",
    covers: [292030, 271590, 1174180],
  },
  {
    key: "browse",
    title: "A–Z Games Directory",
    desc: "Explore the full A–Z library at your own pace.",
    long: "The full library, A–Z, at your own pace — filter and wander until something catches your eye, then dive into prices, deals, and details.",
    href: "/games",
    covers: [413150, 1145360, 1091500, 1245620, 1086940, 990080],
  },
];

/**
 * Animated tool glyph. Each key renders a bespoke SVG whose parts carry
 * `gp-ti-*` classes; when `active` the wrapper gets `gp-ti-on` and the matching
 * keyframes (landing-motion.css) play that icon's own flourish.
 */
function ToolGlyph({ name, active, className = "h-6 w-6" }: { name: ToolKey; active: boolean; className?: string }) {
  const cls = `gp-ti ${className} ${active ? "gp-ti-on" : ""}`;
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "recommend":
      return (
        <svg className={cls} {...common}>
          <circle className="gp-ti-lens" cx="10" cy="10" r="6" />
          <path d="M19.6 19.6l-4.8-4.8" />
          <path className="gp-ti-spark" d="M18 3.2l.72 1.86 1.86.72-1.86.72L18 8.28l-.72-1.86-1.86-.72 1.86-.72z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "gameslike":
      return (
        <svg className={cls} {...common}>
          <path className="gp-ti-link" d="M9.3 9.3l5.4 5.4" />
          <circle className="gp-ti-node-a" cx="7" cy="7" r="3" />
          <circle className="gp-ti-node-b" cx="17" cy="17" r="3" />
        </svg>
      );
    case "gems":
      return (
        <svg className={cls} {...common}>
          <g className="gp-ti-gem">
            <path d="M6 3h12l3 6-9 12L3 9z" />
            <path d="M3 9h18M6 3l6 6 6-6M12 9v12" opacity="0.45" />
          </g>
          <path className="gp-ti-glint" d="M7.6 6.2l2.2 1.1" opacity="0.9" />
        </svg>
      );
    case "week":
      return (
        <svg className={cls} {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
          <rect className="gp-ti-page" x="6.5" y="11.5" width="11" height="6.4" rx="1" opacity="0.65" />
        </svg>
      );
    case "curated":
      return (
        <svg className={cls} {...common}>
          <path className="gp-ti-l1" d="M12 3l9 5-9 5-9-5 9-5z" />
          <path className="gp-ti-l2" d="M3 13l9 5 9-5" />
        </svg>
      );
    case "browse":
      return (
        <svg className={cls} {...common}>
          <rect className="gp-ti-tile gp-ti-t1" x="3" y="3" width="7" height="7" rx="1.6" />
          <rect className="gp-ti-tile gp-ti-t2" x="14" y="3" width="7" height="7" rx="1.6" />
          <rect className="gp-ti-tile gp-ti-t3" x="3" y="14" width="7" height="7" rx="1.6" />
          <rect className="gp-ti-tile gp-ti-t4" x="14" y="14" width="7" height="7" rx="1.6" />
        </svg>
      );
  }
}

/** A single portrait game cover (2:3), with a dark skeleton while it loads. */
function Cover({ id, className = "" }: { id: number; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-800 shadow-lg shadow-black/20 ring-1 ring-black/10 dark:ring-white/10 ${className}`}
      style={{ aspectRatio: "600 / 900" }}
    >
      <Image src={steamPortraitImage(id)} alt="" fill sizes="180px" className="object-cover" />
    </div>
  );
}

/** Tool-flavoured visual reference — real game covers arranged per tool. */
function ToolVisual({ tool }: { tool: Tool }) {
  const chip = "absolute rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm ring-1 ring-white/10";
  const c = tool.covers;
  switch (tool.key) {
    case "recommend":
      return (
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            <ToolGlyph name="recommend" active className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <span className="truncate">“a cozy game to unwind after work”</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {c.map((id, i) => (
              <div key={id} className="relative">
                <Cover id={id} />
                <span className={`${chip} left-1 top-1 !px-1.5 !py-0.5 !text-[10px] text-blue-200`}>{[96, 92, 88][i]}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "gameslike":
      return (
        <div className="flex w-full items-center justify-center gap-3">
          <Cover id={c[0]} className="w-1/3" />
          <div className="flex flex-col items-center text-blue-500 dark:text-blue-300">
            <ToolGlyph name="gameslike" active className="h-6 w-6" />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">like</span>
          </div>
          <Cover id={c[1]} className="w-1/3" />
        </div>
      );
    case "gems":
      return (
        <div className="flex w-full items-end justify-center gap-3">
          <Cover id={c[1]} className="w-1/4 opacity-70" />
          <div className="relative w-1/3">
            <Cover id={c[0]} />
            <span className={`${chip} -top-2 left-1/2 -translate-x-1/2 text-blue-200`}>Hidden gem</span>
          </div>
          <Cover id={c[2]} className="w-1/4 opacity-70" />
        </div>
      );
    case "week":
      return (
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">
            <ToolGlyph name="week" active className="h-4 w-4" /> This week
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {c.map((id) => <Cover key={id} id={id} />)}
          </div>
        </div>
      );
    case "curated":
      return (
        <div className="flex w-full items-center justify-center">
          <div className="relative h-44 w-56">
            <Cover id={c[2]} className="absolute left-0 top-3 w-24 -rotate-6" />
            <Cover id={c[1]} className="absolute left-16 top-1 w-24 rotate-3 opacity-95" />
            <Cover id={c[0]} className="absolute left-32 top-0 w-24 rotate-[8deg]" />
          </div>
        </div>
      );
    case "browse":
      return (
        <div className="grid w-full grid-cols-3 gap-2.5">
          {c.map((id) => <Cover key={id} id={id} />)}
        </div>
      );
  }
}

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3); // cubic-bezier(0.22,1,0.36,1)-ish

// Timeline (fractions of the scroll pass-through).
const HOLD_END = 0.2; // centred title holds until here (reading beat)
const MOVE_END = 0.5; // title has reached its left home by here
const CARDS_START = 0.42; // cards begin appearing here
const CARDS_END = 0.92; // cards fully settled by here
const ROW_DELAY = 0.16; // stagger between card rows
const CARD_WINDOW = 0.6; // how long one row takes to settle
const START_SCALE = 1.26; // title enlargement at the centred start
const ROTATE_MS = 3200; // dwell per tool before advancing

export default function DiscoveryShowcase({
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
  const outer = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const frame = useRef(0);

  const [enabled, setEnabled] = useState(false); // desktop + motion allowed
  const [p, setP] = useState(0); // 0..1 scroll pass-through progress
  const [dx, setDx] = useState(0); // horizontal centre offset for the title
  const [inView, setInView] = useState(false);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  // Enable the scroll-driven animation only on wide screens with motion allowed.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => setEnabled(window.innerWidth >= 1024 && !mq.matches);
    check();
    window.addEventListener("resize", check);
    mq.addEventListener?.("change", check);
    return () => {
      window.removeEventListener("resize", check);
      mq.removeEventListener?.("change", check);
    };
  }, []);

  // Track whether the section is on screen (drives the auto-rotation).
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Measure the title's final (left) centre vs. the container centre, and track
  // scroll progress from the section's position — no pin, so scrolling stays fluid.
  useEffect(() => {
    if (!enabled) {
      setP(0);
      return;
    }

    const measure = () => {
      const box = containerRef.current;
      const t = titleRef.current;
      if (!box || !t) return;
      const fx = t.offsetLeft + t.offsetWidth / 2; // final title centre (untransformed)
      setDx(box.offsetWidth / 2 - fx); // horizontal only — the title stays high
    };

    const compute = () => {
      const el = outer.current;
      if (!el) return;
      const wh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const start = wh * 0.62; // hold centred until the section is well in view
      const end = wh * 0.12; // fully choreographed while still comfortably on screen
      setP(clamp01((start - top) / (start - end)));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(compute);
    };
    const onResize = () => {
      measure();
      compute();
    };

    frame.current = requestAnimationFrame(() => {
      measure();
      compute();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [enabled]);

  // Auto-rotate the selection while the section is on screen (pauses on hover/focus).
  useEffect(() => {
    if (!inView || paused) return;
    const id = window.setInterval(() => {
      setSelected((s) => (s + 1) % TOOLS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [inView, paused]);

  // ── Derived timeline state ──
  const mp = enabled ? clamp01((p - HOLD_END) / (MOVE_END - HOLD_END)) : 1;
  const inv = 1 - easeOut(mp);
  // The whole left block (eyebrow + title + tagline + CTA) glides centre → left
  // together; the title alone also scales down as it travels.
  const blockShift = enabled && mp < 1 ? dx * inv : 0;
  const titleScale = enabled && mp < 1 ? 1 + (START_SCALE - 1) * inv : 1;
  const cardsP = enabled ? clamp01((p - CARDS_START) / (CARDS_END - CARDS_START)) : 1;

  const cardStyle = (i: number) => {
    const row = Math.floor(i / 2);
    const cp = easeOut(clamp01((cardsP - row * ROW_DELAY) / CARD_WINDOW));
    const rest = 1 - cp;
    return {
      opacity: cp,
      transform: cp >= 1 ? undefined : `translate(${-70 * rest}px, ${20 * rest}px) scale(${0.82 + 0.18 * cp})`,
      transformOrigin: "left center",
    } as const;
  };

  const card = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";
  const iconBox =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-400/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 transition-all duration-300 dark:text-blue-300";
  const current = TOOLS[selected];

  return (
    <section ref={outer} id="discovery" className={`scroll-mt-[150px] py-24 sm:py-32 ${className}`}>
      <div ref={containerRef} className="relative mx-auto w-full max-w-6xl px-6">
        <div className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Left column — the whole block glides centre → left as one unit. */}
          <div className="will-change-transform" style={{ transform: blockShift ? `translateX(${blockShift}px)` : undefined }}>
            <p className={`flex w-fit items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>
              <span className="tabular-nums">01</span>
              <span className="h-px w-8 bg-current opacity-40" aria-hidden />
              Discovery
            </p>

            <h2
              ref={titleRef}
              className={`gp-home-display mt-4 w-fit text-[2.6rem] font-semibold uppercase leading-[0.98] will-change-transform sm:text-[4.75rem] ${heading}`}
              style={{ transform: titleScale !== 1 ? `scale(${titleScale})` : undefined, transformOrigin: "center" }}
            >
              Discovery
            </h2>

            <div>
              <p className={`mt-5 max-w-md text-lg leading-relaxed sm:text-xl ${body}`}>
                Every way to find your next game — one place.
              </p>
              <div className="mt-8">
                <Link href="/discover" className={NAVY_CTA_LG}>Open Discovery</Link>
              </div>
            </div>
          </div>

          {/* Right column — cards unfold from the title area, then rotate a selection. */}
          <div className="grid gap-3.5 sm:grid-cols-2" onMouseLeave={() => setPaused(false)}>
            {TOOLS.map((tool, i) => {
              const sel = inView && i === selected;
              return (
                <Link
                  key={tool.key}
                  href={tool.href}
                  aria-current={sel ? "true" : undefined}
                  onMouseEnter={() => { setSelected(i); setPaused(true); }}
                  onFocus={() => { setSelected(i); setPaused(true); }}
                  className={`group flex items-center gap-4 rounded-2xl border p-4 transition-[border-color,box-shadow] duration-300 will-change-transform sm:p-5 ${card} ${
                    sel
                      ? "border-blue-400/70 shadow-[0_0_30px_-6px_rgba(59,130,246,0.5)] ring-1 ring-blue-400/40 dark:border-blue-400/60"
                      : "hover:border-blue-400/45"
                  }`}
                  style={cardStyle(i)}
                >
                  <span className={`${iconBox} ${sel ? "scale-105 from-blue-500/25 to-cyan-400/15 ring-blue-400/40" : "group-hover:scale-105"}`}>
                    <ToolGlyph name={tool.key} active={sel} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[15px] font-semibold tracking-tight ${heading}`}>{tool.title}</span>
                    <span className={`mt-0.5 block text-sm leading-5 ${body}`}>{tool.desc}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Explanation panel — big, with a real visual reference; rotates per tool. */}
        <div className={`mt-12 overflow-hidden rounded-[1.75rem] border p-6 sm:p-9 ${card}`} aria-live="polite">
          <div key={selected} className="gp-hero-rise grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-inset ring-blue-500/20">
                  <ToolGlyph name={current.key} active className="h-4 w-4" />
                </span>
                Now showing · {String(selected + 1).padStart(2, "0")} / {String(TOOLS.length).padStart(2, "0")}
              </p>
              <h3 className={`gp-home-display mt-4 text-2xl font-semibold tracking-tight sm:text-4xl ${heading}`}>{current.title}</h3>
              <p className={`mt-4 max-w-lg text-base leading-7 ${body}`}>{current.long}</p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href={current.href} className={NAVY_CTA_LG}>Open {current.title}</Link>
                {/* Rotation control dots. */}
                <div className="flex items-center gap-2">
                  {TOOLS.map((t, i) => (
                    <button
                      key={t.key}
                      type="button"
                      aria-label={t.title}
                      onClick={() => { setSelected(i); setPaused(true); }}
                      className={`h-2 rounded-full transition-all ${i === selected ? "w-6 bg-blue-600 dark:bg-blue-400" : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/40"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Visual reference — real game covers, flavoured per tool. */}
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <ToolVisual tool={current} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
