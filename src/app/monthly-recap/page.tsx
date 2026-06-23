import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { APP_CARD, APP_CARD_HEADING, APP_MUTED } from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import WeeklyPickPremiumCard from "@/components/discovery/WeeklyPickPremiumCard";
import { MONTHLY_RECAP_DEMO_DATA } from "@/lib/discovery/premium-demo-data";
import { resolvePremiumPersonalizationStatus } from "@/lib/discovery/premium-personalization";

export default function MonthlyRecapPage() {
  const { personality, month, evolution, predictions } = MONTHLY_RECAP_DEMO_DATA;
  // Future: pass a real PersonalDiscoveryContext (searches, saved/tracked games,
  // Steam library, taste evolution). No context wired yet → empty state.
  const personalizationStatus = resolvePremiumPersonalizationStatus();

  const monthStats = [
    { label: "Searches made", value: month.searches },
    { label: "Games discovered", value: month.discovered },
    { label: "Saved games", value: month.saved },
    { label: "Price alerts", value: month.alerts },
  ];

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-recap-bg" />
        <AppSection maxWidth="max-w-6xl">
          <AdminOnlyPageGate>
            {/* Hero */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
                Monthly recap
              </p>
              <DiscoveryComingSoonBadge variant="premium" />
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
              Your month in <span className="text-[color:var(--page-accent-strong)]">gaming</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              See how your taste evolved and discover what to play next.
            </p>

            {personalizationStatus !== "personalized" ? (
              <PremiumPersonalEmptyState
                eyebrow="Make it personal"
                title="Import your Steam library to make this personal"
                description="Monthly Recap will summarize your month — what you searched, saved, and tracked, what your Steam library suggests, and how your taste evolved. Connect your Steam library to personalize the preview below."
                signals={[
                  "Searches & saved games",
                  "Tracked games & price alerts",
                  "Steam library & playtime",
                  "Taste evolution over time",
                ]}
                demoNote="The stats below are a labeled demo — not real tracking yet."
              />
            ) : null}

            {/* Section 1 — Gaming personality */}
            <section className="mt-14" aria-labelledby="recap-personality-heading">
              <h2 id="recap-personality-heading" className="text-2xl font-extrabold text-white">
                Gaming personality
              </h2>
              <div className={`mt-6 ${APP_CARD} p-6 sm:p-8`}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                  You are
                </p>
                <p className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white gp-home-display">
                  The {personality.name.replace(/^The /i, "")}
                </p>
                <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>{personality.summary}</p>

                <div className="mt-6 space-y-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Taste DNA</p>
                  {personality.dna.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{bar.label}</span>
                        <span className="tabular-nums font-bold text-[color:var(--page-accent-text)]">
                          {bar.value}%
                        </span>
                      </div>
                      <div
                        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10"
                        role="img"
                        aria-label={`${bar.label}: ${bar.value} percent`}
                      >
                        <div
                          className="h-full rounded-full bg-[var(--page-accent-strong)]"
                          style={{ width: `${bar.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400">
                  Demo profile — real Taste DNA will be generated from your activity.
                </p>
              </div>
            </section>

            {/* Section 2 — Your month */}
            <section className="mt-14" aria-labelledby="recap-month-heading">
              <h2 id="recap-month-heading" className="text-2xl font-extrabold text-white">
                Your month
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {monthStats.map((stat) => (
                  <li key={stat.label} className={`${APP_CARD} p-6`}>
                    <p className="text-3xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
                      {stat.value}
                    </p>
                    <p className={`mt-1 text-sm ${APP_MUTED}`}>{stat.label}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-slate-400">Sample stats — not real tracking yet.</p>
            </section>

            {/* Section 3 — Taste evolution */}
            <section className="mt-14" aria-labelledby="recap-evolution-heading">
              <h2 id="recap-evolution-heading" className="text-2xl font-extrabold text-white">
                Taste evolution
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className={`${APP_CARD} p-6`}>
                  <h3 className={APP_CARD_HEADING}>Before</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {evolution.before.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${APP_CARD} p-6`}>
                  <h3 className={APP_CARD_HEADING}>Now</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {evolution.now.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--page-accent-text)]"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 — Next month predictions */}
            <section className="mt-14" aria-labelledby="recap-predictions-heading">
              <h2 id="recap-predictions-heading" className="text-2xl font-extrabold text-white">
                Next month predictions
              </h2>
              <p className="mt-2 text-sm text-slate-300">Games you might love next month.</p>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {predictions.map((pick) => (
                  <li key={pick.id} className="flex">
                    <WeeklyPickPremiumCard pick={pick} />
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-14">
              <DiscoveryFutureCard
                title="Future monthly recap"
                bullets={[
                  "Playtime and library signals",
                  "Genre and tag trends",
                  "Standout games and discovery stats",
                  "Taste evolution over time",
                ]}
              />
            </div>
          </AdminOnlyPageGate>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
