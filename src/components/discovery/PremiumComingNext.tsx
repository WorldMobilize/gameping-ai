import { APP_CARD, APP_MUTED } from "@/components/app/app-styles";

/**
 * Small, honest "Coming next" footnote for the live premium pages. Replaces the
 * old full-size "future feature" teaser sections so the page never looks
 * unfinished — these are clearly labeled as upcoming additions, NOT a hint that
 * the current personalization is fake.
 */
export default function PremiumComingNext({
  items,
}: {
  items: { label: string; description: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className={`mt-14 ${APP_CARD} p-6`} aria-labelledby="premium-coming-next">
      <p
        id="premium-coming-next"
        className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--page-accent-text)]"
      >
        Coming next
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex gap-3">
            <span aria-hidden className="mt-[0.55em] h-px w-3.5 shrink-0 bg-[var(--page-accent-strong)]" />
            <span className="text-sm leading-6">
              <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
              <span className={APP_MUTED}> — {item.description}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
