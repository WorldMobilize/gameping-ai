"use client";

import { HOME_TRACKED_DEALS } from "@/components/home/home-demo-data";
import { HomeGameCoverImage } from "@/components/home/HomeGameCoverImage";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { HomeProductPanel, HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

const FEATURES_NOW = [
  {
    id: "track",
    title: "Track games you care about",
    detail: "Save a title when discovery feels right — build a shortlist of games you actually want to play.",
  },
  {
    id: "alerts",
    title: "Price alerts when available",
    detail: "Get notified when a tracked game drops in price on supported stores.",
  },
] as const;

const FUTURE_EXAMPLE =
  "Based on your love for immersive RPGs and player choices, Cyberpunk 2077 might fit your taste — and it's currently on sale.";

export default function HomeDealsSection() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const muted = isDark ? "text-slate-400" : "text-slate-600";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const body = isDark ? "text-slate-300" : "text-slate-600";
  const row = isDark ? "border-slate-700 bg-slate-950/50" : "border-slate-100 bg-white/90";
  const dropBadge = isDark ? "bg-emerald-950/70 text-emerald-300" : "bg-emerald-100 text-emerald-800";
  const statusBadge = isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600";
  const soonBadge = isDark ? "bg-violet-950/80 text-violet-300" : "bg-violet-100 text-violet-700";
  const futureCard = isDark
    ? "border-violet-500/25 bg-violet-950/30"
    : "border-violet-200 bg-violet-50/80";

  return (
    <HomeSectionShell tone="deals" ariaLabelledby="deals-heading">
      <header className="max-w-2xl">
        <h2 id="deals-heading" className={`text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] ${text}`}>
          Find the game first.
          <br />
          Catch the deal later.
        </h2>
        <p className={`mt-4 text-lg leading-relaxed ${body}`}>
          GamePing helps you discover games that fit — then catch the right moment to buy.
          Tracking is about games you care about, not browsing a storefront.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <p className={`text-sm font-bold uppercase tracking-[0.14em] ${muted}`}>Available today</p>
          <ul className="mt-4 space-y-4">
            {FEATURES_NOW.map((feature) => (
              <li key={feature.id}>
                <article
                  className={`gp-home-card rounded-[24px] border p-6 ${
                    isDark ? "gp-home-card-dark" : "gp-home-card-light"
                  }`}
                >
                  <h3 className={`text-lg font-bold ${text}`}>{feature.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${body}`}>{feature.detail}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={`text-sm font-bold uppercase tracking-[0.14em] ${muted}`}>
            Coming soon{" "}
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold normal-case ${soonBadge}`}>
              Roadmap
            </span>
          </p>
          <article className={`gp-home-card mt-4 rounded-[24px] border p-6 ${futureCard}`}>
            <h3 className={`text-lg font-bold ${isDark ? "text-violet-200" : "text-violet-900"}`}>
              Taste-based discovery alerts
            </h3>
            <p className={`mt-3 text-sm italic leading-relaxed ${isDark ? "text-violet-200/90" : "text-violet-800"}`}>
              &ldquo;{FUTURE_EXAMPLE}&rdquo;
            </p>
            <p className={`mt-3 text-xs ${muted}`}>
              Illustrative preview — automatic taste alerts are not live yet.
            </p>
          </article>
        </div>
      </div>

      <HomeProductPanel kicker="Tracked games" className="mt-8" float={false}>
        <ul className="space-y-3">
          {HOME_TRACKED_DEALS.map((game) => (
            <li key={game.title}>
              <article
                className={`gp-home-card flex gap-4 rounded-2xl border p-4 sm:items-center sm:gap-5 sm:p-5 ${row}`}
              >
                <HomeGameCoverImage
                  src={game.image}
                  alt={`${game.title} cover art`}
                  size="showcase"
                  fallbackClassName={game.fallback}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-bold sm:text-lg ${text}`}>{game.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge}`}>
                      {game.status}
                    </span>
                  </div>
                  <p className={`text-xs ${muted}`}>
                    Was {game.wasPrice} · now {game.nowPrice}
                  </p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${dropBadge}`}>
                    {game.drop}
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <p className={`mt-4 text-center text-xs ${muted}`}>
          Track games from any game page · price alerts when store data is available
        </p>
      </HomeProductPanel>
    </HomeSectionShell>
  );
}
