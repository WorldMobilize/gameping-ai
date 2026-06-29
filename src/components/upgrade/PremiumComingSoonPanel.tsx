/** Static UI — LIVE Premium discovery features included with a subscription. */

const PREMIUM_FEATURES = [
  {
    title: "Weekly Picks",
    description: "Personal game picks based on your taste, library, and what you'd enjoy next.",
  },
  {
    title: "Deals For You",
    description: "Real discounts on games that fit your taste — ranked by fit, not biggest markdown.",
  },
  {
    title: "Monthly Recap",
    description:
      "A Spotify-style gaming recap with your archetype, most-played games, and taste evolution.",
  },
  {
    title: "Steam Library Sync",
    description: "Sync your Steam library so picks and deals know what you actually play.",
  },
] as const;

export default function PremiumComingSoonPanel() {
  return (
    <div className="mt-6 rounded-2xl border border-amber-300/50 bg-white bg-gradient-to-br p-5 shadow-sm dark:bg-slate-950/40 dark:border-amber-500/20 dark:from-amber-950/20 dark:via-slate-950/40 dark:to-amber-950/10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a14] dark:text-amber-300">
        Included with Premium
      </p>
      <ul className="mt-4 space-y-3">
        {PREMIUM_FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden>
              ✓
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
