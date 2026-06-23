import { APP_CARD, APP_MUTED } from "@/components/app/app-styles";
import DiscoveryCover from "@/components/discovery/DiscoveryCover";
import type { DealCardData } from "@/lib/discovery/premium-demo-data";

const MATCH_BADGE =
  "inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-1 text-xs font-bold tabular-nums text-[color:var(--page-accent-text)]";

// Discount = savings → green (carries the "you save" meaning, not the page accent).
const DISCOUNT_BADGE =
  "inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold tabular-nums text-green-800 ring-1 ring-green-200/80 dark:bg-green-500/15 dark:text-green-200 dark:ring-green-500/25";

/** Premium taste-matched deal card (Deals For You). Presentational only. */
export default function DealForYouPremiumCard({ deal }: { deal: DealCardData }) {
  return (
    <article className={`flex h-full flex-col overflow-hidden ${APP_CARD} p-0`}>
      <div className="relative aspect-[460/215] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <DiscoveryCover src={deal.image} alt={deal.title} className="h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={MATCH_BADGE}>{deal.matchScore}% taste match</span>
          <span className={DISCOUNT_BADGE}>{deal.discount}</span>
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">{deal.title}</h3>

        <p className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-sm text-slate-500 line-through dark:text-slate-400">{deal.oldPrice}</span>
          <span className="text-xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
            {deal.newPrice}
          </span>
        </p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
          Why this deal fits
        </p>
        <ul className="mt-2 space-y-1.5">
          {deal.whyDealFits.map((reason) => (
            <li key={reason} className={`flex gap-2 text-sm leading-6 ${APP_MUTED}`}>
              <span aria-hidden className="font-bold text-[color:var(--page-accent-text)]">
                ✓
              </span>
              {reason}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">Demo price — not a live store lookup.</p>
      </div>
    </article>
  );
}
