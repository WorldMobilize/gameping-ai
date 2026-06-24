import Link from "next/link";
import {
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";

/**
 * Premium "make it personal" empty state. Shown when a premium/admin user has no
 * usable taste data yet. The feature is LIVE — this just asks the user to add a
 * signal (Steam import / saved search / tracked game). It never shows fake personal
 * data; any sample content below it on the page stays clearly labeled as a sample.
 */
export default function PremiumPersonalEmptyState({
  eyebrow,
  title,
  description,
  signals,
  demoNote,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** The signals this page will eventually personalize from. */
  signals: string[];
  demoNote: string;
}) {
  return (
    <section className={`mt-10 ${APP_CARD_LG}`} aria-labelledby="premium-personal-empty-heading">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
          {eyebrow}
        </p>
      </div>
      <h2
        id="premium-personal-empty-heading"
        className="mt-3 text-xl font-bold text-slate-900 dark:text-white"
      >
        {title}
      </h2>
      <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>{description}</p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {signals.map((signal) => (
          <li key={signal} className={`flex gap-2 text-sm leading-6 ${APP_MUTED}`}>
            <span
              aria-hidden
              className="mt-[0.6em] h-px w-3.5 shrink-0 bg-[var(--page-accent-strong)]"
            />
            {signal}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/settings/account" className={APP_PRIMARY_CTA_ACCENT_SM}>
          Import your Steam library
        </Link>
        <Link href="/recommend" className={APP_SECONDARY_CTA}>
          Try AI recommendations
        </Link>
      </div>

      <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">{demoNote}</p>
    </section>
  );
}
