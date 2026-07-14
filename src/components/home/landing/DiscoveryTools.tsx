"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { steamHeaderImage } from "@/lib/curated/game-links";
import HomeProductDemo from "@/components/home/HomeProductDemo";

/**
 * Discovery showcase. Horizontal feature tabs on top; below, a rich presentation
 * of what the active feature does (a bespoke mock per feature). Auto-advances
 * slowly, pauses on hover, and lets the user pick any feature. The active tab is
 * lifted to the parent so the section tagline stays in sync. Theme-aware; blue
 * accents match the CTA. Presentation only.
 */

const ROTATE_MS = 7000;

function I({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const cover = (id: number) => steamHeaderImage(id);

/** A single Steam cover tile (the title is baked into the artwork). */
function Cover({ id, className = "" }: { id: number; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 ${className}`} style={{ aspectRatio: "460 / 215" }}>
      <Image src={cover(id)} alt="" fill sizes="260px" className="object-cover" />
    </div>
  );
}

const blueBadge = "inline-flex items-center gap-1 rounded-full bg-blue-600/15 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
const panel = "rounded-2xl border border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]";

/* ─────────── per-feature presentations ─────────── */

// Games Like — a game you love + description, then similar games scroll up.
function GamesLikeDemo() {
  const similar = [504230, 1158310, 899770, 306130, 1240440, 949230];
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Cover id={413150} className="w-40 shrink-0" />
        <div className="min-w-0">
          <p className={blueBadge}>You love</p>
          <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">Cozy, open-ended, no pressure</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">We read how a game <em>feels</em> to play — pace, tone, freedom — not just its tags.</p>
        </div>
      </div>
      <div className={`relative h-36 overflow-hidden ${panel}`}>
        <div className="gp-marquee absolute inset-x-0 top-0 space-y-2 p-2" style={{ animation: "gp-marquee-up 16s linear infinite" }}>
          {[...similar, ...similar].map((id, i) => (
            <div key={i} className="flex items-center gap-3">
              <Cover id={id} className="w-24 shrink-0" />
              <div className="flex-1">
                <div className="h-2 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="mt-1.5 h-2 w-2/5 rounded-full bg-slate-200 dark:bg-white/10" />
              </div>
              <span className={blueBadge}>{90 - ((i * 3) % 12)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hidden Gems — cards of underrated games, each with a reason it's here.
function HiddenGemsDemo() {
  const gems = [
    { id: 1240440, why: "96% positive — and barely anyone's played it." },
    { id: 813780, why: "A tiny team's masterpiece, lost in the noise." },
    { id: 552520, why: "Overlooked at launch, adored by everyone who tried it." },
  ];
  return (
    <div className="space-y-3">
      {gems.map((g) => (
        <div key={g.id} className={`flex items-center gap-3 p-2.5 ${panel}`}>
          <Cover id={g.id} className="w-28 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Why it&rsquo;s a gem</p>
            <p className="mt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-200">{g.why}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklyDemo() {
  const ids = [367520, 1145360, 588650];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={blueBadge}>This week</span>
        <span className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((d) => <span key={d} className={`h-2 w-2 rounded-full ${d === 2 ? "bg-blue-600 dark:bg-blue-400" : "bg-slate-300 dark:bg-white/20"}`} />)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">{ids.map((id) => <Cover key={id} id={id} />)}</div>
      <p className="text-sm text-slate-600 dark:text-slate-300">A fresh, hand-checked rotation — new standouts drop every Monday.</p>
    </div>
  );
}

function CuratedDemo() {
  const lists = [
    { id: 413150, name: "Cozy autumn nights" },
    { id: 632470, name: "Story-rich, no filler" },
    { id: 1145360, name: "One-more-run roguelikes" },
  ];
  return (
    <div className="space-y-3">
      {lists.map((l) => (
        <div key={l.id} className={`flex items-center gap-3 p-2.5 ${panel}`}>
          <Cover id={l.id} className="w-24 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{l.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hand-built · a reason for every pick</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BrowseDemo() {
  const ids = [391540, 646570, 268910, 1794680, 504230, 588650, 899770, 1240440];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{ids.map((id) => <Cover key={id} id={id} />)}</div>
  );
}

function DealsDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Cover id={367520} className="w-40 shrink-0" />
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-slate-500 line-through">$29.99</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">$14.99</span>
          </div>
          <span className={`mt-2 ${blueBadge}`}><I><path d="M12 5v14M6 13l6 6 6-6" /></I> 50% off</span>
        </div>
      </div>
      <div className={`flex items-center gap-2 p-3 text-sm text-slate-600 dark:text-slate-300 ${panel}`}>
        <span className="relative flex h-2 w-2"><span className="gp-ping absolute inline-flex h-full w-full rounded-full bg-blue-500" /><span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" /></span>
        We ping you the moment a tracked game hits your price.
      </div>
    </div>
  );
}

/* ─────────── feature definitions ─────────── */

type Tool = { key: string; title: string; tagline: string; desc: string; href: string; icon: ReactNode; demo: ReactNode };

const TOOLS: Tool[] = [
  {
    key: "recommend", title: "Recommend", tagline: "From a feeling to the right game.", href: "/recommend",
    desc: "Describe the mood, the moment, or the kind of night you want — and get a short, personal list of games that fit, each with a reason it made the cut. Not quite right? Nudge it in your own words and watch the shortlist sharpen.",
    icon: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 14.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" /></>,
    demo: <HomeProductDemo variant="section" />,
  },
  {
    key: "games-like", title: "Games Like…", tagline: "Loved that one? Here's your next.", href: "/games-like",
    desc: "Start from a game you already adore and we'll find its kindred spirits — matched on how they actually feel to play, not just shared tags. Scroll through a ranked run of alternatives, each scored on how close the match really is.",
    icon: <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M10 10l4 4" /></>,
    demo: <GamesLikeDemo />,
  },
  {
    key: "hidden-gems", title: "Hidden Gems", tagline: "The best games you've never heard of.", href: "/hidden-gems",
    desc: "Brilliant, under-played games — the ones drowned out by the blockbusters. We surface them before everyone else does, and tell you exactly why each one is worth your time.",
    icon: <><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18M9 3l3 6 3-6M12 21L9 9M12 21l3-12" /></>,
    demo: <HiddenGemsDemo />,
  },
  {
    key: "gotw", title: "Games of the Week", tagline: "A fresh set of standouts, every week.", href: "/games-of-the-week",
    desc: "A hand-checked rotation of games worth your attention right now — a new lineup every Monday, so there's always something great to jump into without the endless scrolling.",
    icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    demo: <WeeklyDemo />,
  },
  {
    key: "curated", title: "Curated Collections", tagline: "Hand-picked lists, a reason for every pick.", href: "/collections",
    desc: "Themed lists built around a mood, a moment, or an idea — cozy autumn nights, story-rich RPGs, best couch co-op. Every collection is hand-assembled, and every game earns its place.",
    icon: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
    demo: <CuratedDemo />,
  },
  {
    key: "browse", title: "A–Z Games Directory", tagline: "The whole library, at your own pace.", href: "/games",
    desc: "Sometimes you just want to wander. Explore the full A–Z catalogue on your own terms, dip into any game's page, and follow your curiosity wherever it leads.",
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    demo: <BrowseDemo />,
  },
  {
    key: "deals", title: "Deal Tracking", tagline: "Never overpay for a game again.", href: "/deals-for-you",
    desc: "Live prices from across the stores in one place, plus a ping the instant a game you're watching drops to the price you set. Buy at the bottom, every time.",
    icon: <><path d="M20.5 12.5l-8 8-9-9V3h8.5z" /><circle cx="7.5" cy="7.5" r="1.1" /></>,
    demo: <DealsDemo />,
  },
];

export const DISCOVERY_TAGLINES = TOOLS.map((t) => t.tagline);

export default function DiscoveryTools({
  active,
  setActive,
}: {
  active: number;
  setActive: (i: number) => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((active + 1) % TOOLS.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, setActive]);

  return (
    <div>
      {/* feature tabs — horizontal across the top */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Discovery features">
        {TOOLS.map((tool, i) => {
          const on = active === i;
          return (
            <button
              key={tool.key} type="button" role="tab" aria-selected={on} onClick={() => setActive(i)}
              className={`group relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                on
                  ? "bg-blue-600 text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.7)]"
                  : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-white"
              }`}
            >
              <span className={on ? "text-white" : "text-blue-600 dark:text-blue-400"}><I>{tool.icon}</I></span>
              {tool.title}
            </button>
          );
        })}
      </div>

      {/* presentation — what the active feature does */}
      <div className="relative mt-8 min-h-[440px] overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none md:p-9 lg:min-h-[400px]">
        {TOOLS.map((tool, i) => (
          <div
            key={tool.key}
            role="tabpanel"
            aria-hidden={active !== i}
            className={`transition-opacity duration-500 ${active === i ? "relative opacity-100" : "pointer-events-none absolute inset-0 p-6 opacity-0 md:p-9"}`}
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              {/* left — what it is */}
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/15 to-blue-500/[0.06] text-blue-700 ring-1 ring-inset ring-blue-600/25 dark:from-blue-500/25 dark:to-blue-500/[0.06] dark:text-blue-300 dark:ring-blue-400/25"><I>{tool.icon}</I></span>
                <h3 className="gp-home-display mt-5 text-[1.75rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{tool.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">{tool.desc}</p>
                <Link href={tool.href} className="mt-7 inline-flex items-center text-sm font-semibold text-blue-700 transition hover:opacity-80 dark:text-blue-400">
                  Open {tool.title}
                </Link>
              </div>
              {/* right — the mock */}
              <div>{tool.demo}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
