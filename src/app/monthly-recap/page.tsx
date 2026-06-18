import Image from "next/image";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_BODY,
  APP_CARD,
  APP_CARD_HEADING,
  APP_KICKER,
  APP_MUTED,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_SECTION_TITLE,
} from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import PremiumDiscoveryPageGate from "@/components/discovery/PremiumDiscoveryPageGate";
import { MONTHLY_RECAP_DEMO } from "@/lib/discovery/placeholder-data";

export default function MonthlyRecapPage() {
  const { vibe, topGames, favoriteTags, stats, tasteEvolution } = MONTHLY_RECAP_DEMO;

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <PremiumDiscoveryPageGate>
          <div className="flex flex-wrap items-center gap-3">
            <p className={APP_KICKER}>Premium discovery</p>
            <DiscoveryComingSoonBadge variant="premium" />
          </div>

          <h1 className={APP_PAGE_TITLE}>
            Monthly <span className={APP_ACCENT}>recap</span>
          </h1>

          <p className={APP_PAGE_LEAD}>
            Your monthly gaming recap — favorite genres, standout games, and discovery patterns in
            one place.
          </p>

          <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-labelledby="recap-vibe-heading">
            <div className={`${APP_CARD} p-6`}>
              <h2 id="recap-vibe-heading" className={APP_CARD_HEADING}>
                This month&apos;s vibe
              </h2>
              <p className={`mt-3 ${APP_BODY}`}>{vibe}</p>
            </div>

            <div className={`${APP_CARD} p-6`}>
              <h2 className={APP_CARD_HEADING}>Discovery stats</h2>
              <ul className="mt-4 space-y-3 text-slate-700 dark:text-slate-300">
                <li className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className={APP_MUTED}>Games explored</span>
                  <span className="text-xl font-extrabold tabular-nums text-cyan-700 dark:text-cyan-400">
                    {stats.gamesExplored}
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className={APP_MUTED}>Saved picks</span>
                  <span className="text-xl font-extrabold tabular-nums text-cyan-700 dark:text-cyan-400">
                    {stats.savedPicks}
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-4">
                  <span className={APP_MUTED}>Tracked deals</span>
                  <span className="text-xl font-extrabold tabular-nums text-cyan-700 dark:text-cyan-400">
                    {stats.trackedDeals}
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-10" aria-labelledby="recap-top-games-heading">
            <h2 id="recap-top-games-heading" className={APP_SECTION_TITLE}>
              Top 3 games
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {topGames.map((game, index) => (
                <li key={game.title} className={`${APP_CARD} overflow-hidden p-0`}>
                  <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={game.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white">{game.title}</p>
                    <p className={`mt-1 ${APP_MUTED}`}>{game.hours} played</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="recap-tags-heading">
            <h2 id="recap-tags-heading" className={APP_SECTION_TITLE}>
              Favorite tags
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {favoriteTags.map((tag) => (
                <li key={tag}>
                  <span className="inline-flex rounded-full border border-cyan-200/80 bg-cyan-50 px-3.5 py-1.5 text-sm font-semibold text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-200">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="recap-evolution-heading">
            <div className={`${APP_CARD} p-6`}>
              <h2 id="recap-evolution-heading" className={APP_CARD_HEADING}>
                Taste evolution
              </h2>
              <p className={`mt-3 ${APP_BODY}`}>{tasteEvolution}</p>
            </div>
          </section>

          <div className="mt-12">
            <DiscoveryFutureCard
              title="Future monthly recap"
              bullets={[
                "Playtime and library signals",
                "Genre and tag trends",
                "Standout games and discovery stats",
                "Taste evolution over time",
              ]}
            />
          </div>
        </PremiumDiscoveryPageGate>
      </AppSection>
    </AppPageShell>
  );
}
