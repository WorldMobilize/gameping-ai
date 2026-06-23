import { APP_CARD, APP_MUTED } from "@/components/app/app-styles";
import DiscoveryCover from "@/components/discovery/DiscoveryCover";
import type { WeeklyPickCardData } from "@/lib/discovery/premium-demo-data";

const MATCH_BADGE =
  "inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-1 text-xs font-bold tabular-nums text-[color:var(--page-accent-text)]";

const CATEGORY_BADGE =
  "inline-flex items-center rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200";

/**
 * Premium recommendation card (Weekly Picks + Monthly Recap predictions).
 * Match score + accents follow the current page accent. Presentational only.
 */
export default function WeeklyPickPremiumCard({ pick }: { pick: WeeklyPickCardData }) {
  const hasConcerns = pick.possibleConcerns.length > 0;
  return (
    <article className={`flex h-full flex-col overflow-hidden ${APP_CARD} p-0`}>
      <div className="relative aspect-[460/215] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <DiscoveryCover src={pick.image} alt={pick.title} className="h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={MATCH_BADGE}>{pick.matchScore}% match</span>
          <span className={CATEGORY_BADGE}>{pick.category}</span>
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">{pick.title}</h3>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
          Why we picked it
        </p>
        <ul className="mt-2 space-y-1.5">
          {pick.whyPicked.map((reason) => (
            <li key={reason} className={`flex gap-2 text-sm leading-6 ${APP_MUTED}`}>
              <span aria-hidden className="font-bold text-[color:var(--page-accent-text)]">
                ✓
              </span>
              {reason}
            </li>
          ))}
        </ul>

        {hasConcerns ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
              Possible concerns
            </p>
            <ul className="mt-2 space-y-1.5">
              {pick.possibleConcerns.map((concern) => (
                <li key={concern} className={`flex gap-2 text-sm leading-6 ${APP_MUTED}`}>
                  <span aria-hidden className="text-slate-400 dark:text-slate-500">
                    –
                  </span>
                  {concern}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </article>
  );
}
