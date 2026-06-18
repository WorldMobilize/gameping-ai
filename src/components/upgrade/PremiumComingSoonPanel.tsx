/** Static UI — upcoming Premium discovery features (no routes or data). */

export const COMING_SOON_BADGE =
  "inline-flex shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200";

const UPCOMING_FEATURES = [
  {
    title: "Weekly picks",
    description: "Personal game discovery drops based on your taste.",
  },
  {
    title: "Deals for you",
    description: "Deal-focused recommendations for games that fit your taste.",
  },
  {
    title: "Monthly recap",
    description:
      "A Spotify-style gaming recap with top games, favorite tags, and discovery stats.",
  },
  {
    title: "Steam taste import",
    description: "Import your Steam library signal to improve future recommendations.",
  },
] as const;

export default function PremiumComingSoonPanel() {
  return (
    <div className="mt-6 rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 via-white to-slate-50/60 p-5 shadow-sm shadow-cyan-100/25 dark:border-cyan-500/25 dark:from-cyan-950/35 dark:via-slate-950/40 dark:to-slate-950/20 dark:shadow-cyan-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-800 dark:text-cyan-300">
          Coming soon for Premium
        </p>
        <span className={COMING_SOON_BADGE}>Coming soon</span>
      </div>
      <ul className="mt-4 space-y-3">
        {UPCOMING_FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <span
              className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
              aria-hidden
            >
              ◦
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {feature.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
