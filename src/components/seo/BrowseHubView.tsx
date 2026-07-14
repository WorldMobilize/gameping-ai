import Link from "next/link";
import { collectionPath, curatedCollectionKind } from "@/lib/curated/collection-kinds";
import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import {
  HUB_KIND_META,
  hubHref,
  hubsByKind,
  type HubKind,
} from "@/lib/seo/discovery-hubs";

/**
 * /collections — curated collections: best-of, genre and mood. Everything that
 * answers "games like X" lives on /games-like instead, so the two pages never
 * compete for the same query.
 */

const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-400";
const CARD = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";

const KIND_ORDER: HubKind[] = ["best", "genre", "mood"];

/**
 * One card shape for the whole page, whether the entry comes from a SEO hub or a
 * curated collection — the reader shouldn't be able to tell (or care) which
 * table it was stored in.
 */
type BrowseCard = {
  key: string;
  href: string;
  title: string;
  /** "12 picks · Hades, Dead Cells…" */
  picks: string;
  cta: string;
};

function summarize(games: { title: string }[]): string {
  const head = games[0]?.title ?? "";
  const rest = games.length > 1 ? `, ${games[1]?.title}…` : "";
  return `${games.length} picks · ${head}${rest}`;
}

/** Hubs + themed collections for one section, merged into a single card list. */
function cardsForKind(kind: HubKind): BrowseCard[] {
  const hubs: BrowseCard[] = hubsByKind(kind).map((hub) => ({
    key: `hub-${hub.slug}`,
    href: hubHref(hub),
    title: hub.h1,
    picks: summarize(hub.games),
    cta: "Explore",
  }));

  const collections: BrowseCard[] = CURATED_COLLECTIONS.filter(
    (c) => curatedCollectionKind(c.slug) === kind
  ).map((c) => ({
    key: `col-${c.slug}`,
    href: collectionPath(c.slug),
    title: c.h1,
    picks: summarize(c.games),
    cta: "Read",
  }));

  return [...hubs, ...collections];
}

export default function BrowseHubView() {
  return (
    <section className="relative z-10 px-6 py-14 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[620px] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-[110px]" />

      <div className="relative mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs ${BODY}`}>
          <Link href="/discover" className="transition hover:text-blue-600 dark:hover:text-blue-300">Discovery</Link>
          <span aria-hidden>/</span>
          <span className={`font-medium ${HEADING}`}>Collections</span>
        </nav>

        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">
          Curated collections
        </p>
        <h1 className={`gp-home-display mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl ${HEADING}`}>
          Find games by best-of, genre, or mood
        </h1>
        <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${BODY}`}>
          Curated evergreen collections to explore GamePing without a prompt. Each list explains
          why every game earns its spot — and every path leads back to a recommendation tuned to you.
          Starting from a game you already love?{" "}
          <Link
            href="/games-like"
            className="font-semibold text-blue-700 underline-offset-4 transition hover:underline dark:text-blue-300"
          >
            Games like…
          </Link>{" "}
          has you covered.
        </p>

        <div className="mt-12 flex flex-col gap-12">
          {KIND_ORDER.map((kind) => {
            const cards = cardsForKind(kind);
            if (cards.length === 0) return null;
            const meta = HUB_KIND_META[kind];
            return (
              <div key={kind}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className={`text-xl font-semibold tracking-tight ${HEADING}`}>{meta.label}</h2>
                    <p className={`mt-1 text-sm ${BODY}`}>{meta.blurb}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map((card) => (
                    <Link
                      key={card.key}
                      href={card.href}
                      className={`group flex flex-col rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15 ${CARD}`}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300/80">
                        {meta.eyebrow}
                      </span>
                      <span className={`mt-1.5 text-base font-semibold ${HEADING}`}>{card.title}</span>
                      <span className={`mt-2 flex-1 text-sm leading-6 ${BODY}`}>{card.picks}</span>
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 transition group-hover:opacity-80 dark:text-blue-300">
                        {card.cta}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-14">
          <Link href="/discover" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
            ← Back to Discovery
          </Link>
        </p>
      </div>
    </section>
  );
}
