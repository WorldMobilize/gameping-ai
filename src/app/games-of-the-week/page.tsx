import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_INLINE_LINK,
  APP_KICKER,
  APP_MUTED,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  APP_SECTION_TITLE,
} from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import GamesOfWeekCard from "@/components/discovery/GamesOfWeekCard";
import { GAMES_OF_WEEK_DEMO } from "@/lib/discovery/placeholder-data";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Games of the week | GamePing AI",
  description:
    "A weekly selection of games worth discovering — from major releases to hidden surprises. Preview of GamePing's editorial discovery feed.",
  path: "/games-of-the-week",
});

export default function GamesOfTheWeekPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className={APP_KICKER}>Weekly discovery</p>
          <DiscoveryComingSoonBadge />
        </div>

        <h1 className={APP_PAGE_TITLE}>
          Games of the <span className={APP_ACCENT}>week</span>
        </h1>

        <p className={APP_PAGE_LEAD}>
          A weekly selection of games worth discovering — from major releases to hidden
          surprises.
        </p>

        <section className="mt-12" aria-labelledby="games-of-week-grid-heading">
          <h2 id="games-of-week-grid-heading" className={APP_SECTION_TITLE}>
            This week&apos;s picks
          </h2>
          <p className={`mt-2 ${APP_MUTED}`}>Static demo selection — refreshes coming later.</p>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES_OF_WEEK_DEMO.map((pick) => (
              <li key={pick.title} className="flex">
                <GamesOfWeekCard pick={pick} />
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <DiscoveryFutureCard
            title="Why these picks"
            bullets={[
              "Game signals",
              "Pricing data",
              "Discovery trends",
            ]}
          />
        </div>

        <div className="mt-10 rounded-3xl border border-cyan-200/80 bg-cyan-50/60 p-6 dark:border-cyan-900/50 dark:bg-cyan-950/30">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Looking for deeper cuts?
          </p>
          <Link href="/hidden-gems" className={`mt-3 inline-flex ${APP_PRIMARY_CTA_SM}`}>
            Browse hidden gems
          </Link>
          {" · "}
          <Link href="/recommend" className={APP_INLINE_LINK}>
            AI recommendations
          </Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
