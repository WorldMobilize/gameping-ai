import Link from "next/link";
import type { ReactNode } from "react";
import DiscoverPersonalSection from "@/components/discover/DiscoverPersonalSection";

/**
 * Discovery hub — product overview (Notion / Linear / Raycast style). Presents
 * Discovery as a suite of tools rather than a single recommendation page.
 *
 * Two sections:
 *   - Explore  — public, taste-agnostic tools (this file, server-rendered/indexable).
 *                Data-driven: add an entry to EXPLORE_TOOLS (with an href).
 *   - Personal — premium, taste-driven tools. Rendered by the client
 *                <DiscoverPersonalSection>, which reacts to the current user.
 *
 * Calm-premium language matching the landing: hairline cards, one accent,
 * semibold type, subtle hover motion.
 */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const ICONS = {
  recommend: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.4-3.4" /></>,
  curated: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
  gems: <path d="M6 3h12l3 6-9 12L3 9z" />,
  week: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  browse: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  collections: <><path d="M4 7h16M4 12h16M4 17h10" /></>,
  deals: <><path d="M20.5 12.5l-8 8-9-9V3h8.5z" /><circle cx="7.5" cy="7.5" r="1.1" /></>,
  steam: <><circle cx="12" cy="12" r="9" /><circle cx="15" cy="9" r="2.4" /><path d="M6.5 14.5l4-1.6" /></>,
  radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12l6-6" /></>,
  recap: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  picks: <><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" /></>,
  community: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5M17.5 20a5.5 5.5 0 0 0-3-4.9" /></>,
  aicollections: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M8 18v2M16 18v2" /></>,
} as const;

type Tool = {
  key: keyof typeof ICONS;
  title: string;
  desc: string;
  href: string;
};

/** Explore — public, taste-agnostic tools. Exact order is intentional. */
const EXPLORE_TOOLS: Tool[] = [
  { key: "recommend", title: "AI Recommendations", desc: "Describe a vibe and get games that fit — each with a clear reason.", href: "/recommend" },
  { key: "curated", title: "Games Like…", desc: "Loved one game? Start there and find your next favourite.", href: "/games-like" },
  { key: "gems", title: "Hidden Gems", desc: "Underrated games worth your time, refreshed regularly.", href: "/hidden-gems" },
  { key: "week", title: "Games of the Week", desc: "A fresh rotation of standout games every week.", href: "/games-of-the-week" },
  { key: "browse", title: "A–Z Games Directory", desc: "Explore the full A–Z library at your own pace.", href: "/games" },
  { key: "collections", title: "Curated Collections", desc: "Best-of lists, genres and moods — hand-built, every pick explained.", href: "/collections" },
];

const CARD = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";
const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-400";

export default function DiscoverHubView() {
  return (
    <section className="relative z-10 px-6 py-16 sm:py-20">
      {/* soft accent glow */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-[110px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Hero */}
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">
            Discovery
          </p>
          <h1 className={`gp-home-display mt-3 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl ${HEADING}`}>
            Everything you need to discover your next favorite game
          </h1>
          <p className={`mt-5 text-lg leading-relaxed ${BODY}`}>
            Discovery is a growing suite of AI-powered tools that help you find games in different
            ways — from a quick prompt to curated lists, hidden gems, and deals matched to your taste.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/recommend"
              className="inline-flex items-center justify-center rounded-full bg-blue-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Get recommendations
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/12 dark:text-white/85 dark:hover:border-white/25 dark:hover:bg-white/[0.04]"
            >
              Browse the library
            </Link>
          </div>
        </div>

        {/* Explore — public tools */}
        <div className="mt-14">
          <h2 className={`text-sm font-semibold uppercase tracking-[0.14em] ${BODY}`}>Explore</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORE_TOOLS.map((tool) => (
              <Link
                key={tool.key}
                href={tool.href}
                className={`group relative flex flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15 ${CARD}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300">
                    <Icon>{ICONS[tool.key]}</Icon>
                  </span>
                </div>
                <h3 className={`mt-5 text-lg font-semibold tracking-tight ${HEADING}`}>{tool.title}</h3>
                <p className={`mt-2 flex-1 text-sm leading-6 ${BODY}`}>{tool.desc}</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600 transition group-hover:opacity-80 dark:text-blue-300">
                  Open
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Personal — premium, taste-driven tools (reactive to the user) */}
        <DiscoverPersonalSection />
      </div>
    </section>
  );
}
