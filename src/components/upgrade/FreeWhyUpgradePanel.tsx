import { APP_MUTED } from "@/components/app/app-styles";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";

/** Static left-column teaser — balances Free card height vs Premium. */
export default function FreeWhyUpgradePanel() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white bg-gradient-to-br p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800/80 dark:from-slate-950/50 dark:via-slate-900/70 dark:to-amber-950/15">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
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
        <li>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Monthly recap
          </p>
          <p className={`mt-0.5 text-xs leading-relaxed ${APP_MUTED}`}>
            A Spotify-style recap of your top games, tags, and discovery stats.
          </p>
        </li>
      </ul>
    </div>
  );
}
