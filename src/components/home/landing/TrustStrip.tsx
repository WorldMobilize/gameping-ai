/**
 * Thin credibility bar under the hero — the real data sources that power
 * GamePing (same list the footer already discloses). Presentation only.
 */
const SOURCES = ["RAWG", "IsThereAnyDeal", "Steam", "CheapShark", "OpenAI"];

export default function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <section className={`py-8 sm:py-10 ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-center sm:gap-10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
          Real prices &amp; data from
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-8">
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-6 sm:gap-8">
              {i > 0 ? <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" /> : null}
              <span className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                {s}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
