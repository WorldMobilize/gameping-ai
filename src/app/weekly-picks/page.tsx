import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_KICKER,
  APP_MUTED,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_SECTION_TITLE,
} from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import PremiumDiscoveryPageGate from "@/components/discovery/PremiumDiscoveryPageGate";
import TasteProfileMock from "@/components/discovery/TasteProfileMock";
import WeeklyPickCard from "@/components/discovery/WeeklyPickCard";
import {
  WEEKLY_PICKS_DEMO,
  WEEKLY_PICKS_TASTE_MOCK,
} from "@/lib/discovery/placeholder-data";

export default function WeeklyPicksPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <PremiumDiscoveryPageGate>
          <div className="flex flex-wrap items-center gap-3">
            <p className={APP_KICKER}>Premium discovery</p>
            <DiscoveryComingSoonBadge variant="premium" />
          </div>

          <h1 className={APP_PAGE_TITLE}>
            Your weekly <span className={APP_ACCENT}>picks</span>
          </h1>

          <p className={APP_PAGE_LEAD}>
            Your personal game discovery drop based on your taste.
          </p>

          <div className="mt-10">
            <TasteProfileMock signals={WEEKLY_PICKS_TASTE_MOCK} />
          </div>

          <section className="mt-12" aria-labelledby="weekly-picks-grid-heading">
            <h2 id="weekly-picks-grid-heading" className={APP_SECTION_TITLE}>
              Your picks this week
            </h2>
            <p className={`mt-2 ${APP_MUTED}`}>Static demo cards — personalization not live yet.</p>

            <ul className="mt-8 grid gap-6 md:grid-cols-2">
              {WEEKLY_PICKS_DEMO.map((pick) => (
                <li key={pick.title} className="flex">
                  <WeeklyPickCard pick={pick} />
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12">
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
        </PremiumDiscoveryPageGate>
      </AppSection>
    </AppPageShell>
  );
}
