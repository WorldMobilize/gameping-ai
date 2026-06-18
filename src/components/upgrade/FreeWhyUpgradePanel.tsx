import { APP_MUTED } from "@/components/app/app-styles";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";
import { COMING_SOON_BADGE } from "@/components/upgrade/PremiumComingSoonPanel";

/** Static left-column teaser — balances Free card height vs Premium. */
export default function FreeWhyUpgradePanel() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-white to-cyan-50/25 p-5 shadow-sm dark:border-slate-800/80 dark:from-slate-950/50 dark:via-slate-900/70 dark:to-cyan-950/15">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        Why upgrade later?
      </p>
      <ul className="mt-4 space-y-3.5">
        <li>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            More saved runs
          </p>
          <p className={`mt-0.5 text-xs leading-relaxed ${APP_MUTED}`}>
            {PLAN_QUOTAS.premiumSavedSearches} saved recommendation runs vs{" "}
            {PLAN_QUOTAS.freeSavedSearches} on Free.
          </p>
        </li>
        <li>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            More tracked games
          </p>
          <p className={`mt-0.5 text-xs leading-relaxed ${APP_MUTED}`}>
            {PLAN_QUOTAS.premiumTrackedGames} tracked games with deal alerts vs{" "}
            {PLAN_QUOTAS.freeTrackedGames} on Free.
          </p>
        </li>
        <li>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Premium discovery drops
          </p>
          <p className={`mt-0.5 text-xs leading-relaxed ${APP_MUTED}`}>
            Weekly picks and Deals for you—personalized drops based on your taste.
          </p>
        </li>
        <li className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Monthly recap
            </p>
            <p className={`mt-0.5 text-xs leading-relaxed ${APP_MUTED}`}>
              A Spotify-style recap of your top games, tags, and discovery stats.
            </p>
          </div>
          <span className={COMING_SOON_BADGE}>Coming soon</span>
        </li>
      </ul>
    </div>
  );
}
