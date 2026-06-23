import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_CARD_HEADING,
  APP_MUTED,
} from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import WeeklyPickPremiumCard from "@/components/discovery/WeeklyPickPremiumCard";
import { WEEKLY_PICKS_DEMO_DATA } from "@/lib/discovery/premium-demo-data";
import { resolvePremiumPersonalizationStatus } from "@/lib/discovery/premium-personalization";

export default function WeeklyPicksPage() {
  const { picks, moods, tasteEvolution } = WEEKLY_PICKS_DEMO_DATA;
  // Future: pass a real PersonalDiscoveryContext (Steam taste DNA, saved/tracked
  // games, AI analysis). No context wired yet → "needs-steam-import" empty state.
  const personalizationStatus = resolvePremiumPersonalizationStatus();

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-weekly-bg" />
        <AppSection maxWidth="max-w-6xl">
          <AdminOnlyPageGate>
            {/* Hero */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
                Personal picks
              </p>
              <DiscoveryComingSoonBadge variant="premium" />
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
              Your weekly <span className="text-[color:var(--page-accent-strong)]">picks</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Fresh recommendations based on your taste, library, and what you might enjoy next.
            </p>

            {personalizationStatus !== "personalized" ? (
              <PremiumPersonalEmptyState
                eyebrow="Make it personal"
                title="Import your Steam library to make this personal"
                description="Weekly Picks will analyze the games you own and play, plus your taste signals, to suggest games you may like next. Connect your Steam library to turn the preview below into picks chosen for you."
                signals={[
                  "Owned & played games (Steam library)",
                  "Your taste profile",
                  "Saved & tracked games",
                  "Recommendation history",
                ]}
                demoNote="The picks below are a labeled preview — not personalized yet."
              />
            ) : null}

            {/* Section 1 — Your games this week */}
            <section className="mt-14" aria-labelledby="weekly-games-heading">
              <h2 id="weekly-games-heading" className="text-2xl font-extrabold text-white">
                Your games this week
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Sample picks — personalization isn&apos;t live yet.
              </p>
              <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {picks.map((pick) => (
                  <li key={pick.id} className="flex">
                    <WeeklyPickPremiumCard pick={pick} />
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 2 — Pick your current mood */}
            <section className="mt-14" aria-labelledby="weekly-mood-heading">
              <h2 id="weekly-mood-heading" className="text-2xl font-extrabold text-white">
                Pick your current mood
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Future AI will re-tune your weekly picks around the mood you&apos;re in.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {moods.map((mood) => (
                  <li key={mood.id} className={APP_CARD}>
                    <p className="font-bold text-slate-900 dark:text-white">{mood.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>{mood.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 3 — Taste evolution preview */}
            <section className="mt-14" aria-labelledby="weekly-evolution-heading">
              <h2 id="weekly-evolution-heading" className="text-2xl font-extrabold text-white">
                Taste evolution preview
              </h2>
              <div className={`mt-6 ${APP_CARD} p-6`}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                    GamePing noticed
                  </p>
                  <DiscoveryComingSoonBadge variant="premium" />
                </div>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Leaning into</p>
                    <ul className="mt-3 space-y-1.5">
                      {tasteEvolution.more.map((item) => (
                        <li key={item} className={`flex gap-2 text-sm leading-6 ${APP_MUTED}`}>
                          <span aria-hidden className="font-bold text-[color:var(--page-accent-text)]">
                            +
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Cooling on</p>
                    <ul className="mt-3 space-y-1.5">
                      {tasteEvolution.less.map((item) => (
                        <li key={item} className={`flex gap-2 text-sm leading-6 ${APP_MUTED}`}>
                          <span aria-hidden className="text-slate-400 dark:text-slate-500">
                            –
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400">
                  Demo insight — real taste tracking is coming with Steam import and saved-game history.
                </p>
              </div>
            </section>

            <div className="mt-14">
              <DiscoveryFutureCard
                title="How it will personalize"
                bullets={[
                  "Previous searches",
                  "Saved games",
                  "Steam library (future)",
                  "Playtime patterns (future)",
                ]}
              />
            </div>
          </AdminOnlyPageGate>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
