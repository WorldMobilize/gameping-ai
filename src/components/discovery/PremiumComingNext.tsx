import { APP_CARD, APP_MUTED } from "@/components/app/app-styles";

/**
 * "Powered by your taste" — a small section on the live premium pages that
 * explains what fuels the personalization, so Premium reads as a finished Early
 * Access product rather than an unfinished roadmap. Copy/layout only; this makes
 * no future-feature promises.
 */
export default function PremiumComingNext({
  items,
  title = "Powered by your taste",
}: {
  items: { label: string; description: string }[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className={`mt-14 ${APP_CARD} p-6`} aria-labelledby="premium-powered-by">
      <p
        id="premium-powered-by"
        className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--page-accent-text)]"
      >
        {title}
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
