import Link from "next/link";
import {
  HUB_KIND_META,
  hubGameHref,
  hubHref,
  relatedHubs,
  type DiscoveryHub,
} from "@/lib/seo/discovery-hubs";

/**
 * Shared renderer for every discovery hub item page (Best / Genre / Mood /
 * Games-Like). Server component, indexable, calm-premium. All content comes
 * from the DiscoveryHub data object, so the four route families share one
 * layout — new pages need zero new UI.
 */

const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-400";
const CARD = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";

export default function HubPageView({ hub }: { hub: DiscoveryHub }) {
  const kind = HUB_KIND_META[hub.kind];
  const related = relatedHubs(hub);

  return (
    <section className="relative z-10 px-6 py-14 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-[110px]" />

      <div className="relative mx-auto max-w-4xl">
        {/* Breadcrumb — semantic hierarchy + internal links */}
        <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-xs ${BODY}`}>
          <Link href="/discover" className="transition hover:text-blue-600 dark:hover:text-blue-300">Discovery</Link>
          <span aria-hidden>/</span>
          <Link href="/collections" className="transition hover:text-blue-600 dark:hover:text-blue-300">Browse</Link>
          <span aria-hidden>/</span>
          <span className={`font-medium ${HEADING}`}>{hub.h1}</span>
        </nav>

        {/* Header */}
        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">
          {kind.eyebrow}
        </p>
        <h1 className={`gp-home-display mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl ${HEADING}`}>
          {hub.h1}
        </h1>
        <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${BODY}`}>{hub.intro}</p>

        {/* Games */}
        <ol className="mt-10 flex flex-col gap-3">
          {hub.games.map((game, i) => (
            <li key={game.title}>
              <Link
                href={hubGameHref(game)}
                className={`group flex items-start gap-4 rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15 ${CARD}`}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold tabular-nums text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-base font-semibold ${HEADING}`}>
                    {game.title}
                  </span>
                  <span className={`mt-1 block text-sm leading-6 ${BODY}`}>{game.note}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {/* Personalize CTA */}
        <div className={`mt-10 flex flex-col gap-3 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between ${CARD}`}>
          <div>
            <p className={`text-sm font-semibold ${HEADING}`}>Want picks tuned to your taste?</p>
            <p className={`mt-1 text-sm ${BODY}`}>Describe what you feel like playing and get a personal shortlist.</p>
          </div>
          <Link
            href="/recommend"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Get my picks
          </Link>
        </div>

        {/* Related — internal linking */}
        {related.length > 0 ? (
          <div className="mt-12">
            <h2 className={`text-sm font-semibold uppercase tracking-[0.14em] ${BODY}`}>Related lists</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={hubHref(r)}
                  className={`group flex items-center justify-between gap-3 rounded-xl border p-4 transition hover:border-slate-300 dark:hover:border-white/15 ${CARD}`}
                >
                  <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300/80">
                      {HUB_KIND_META[r.kind].eyebrow}
                    </span>
                    <span className={`mt-0.5 block text-sm font-semibold ${HEADING}`}>{r.h1}</span>
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-10">
          <Link href="/collections" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
            ← Browse all discovery collections
          </Link>
        </p>
      </div>
    </section>
  );
}
