import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  homeCyanAccentText,
} from "@/components/app/app-styles";
import AdminOnlyNotice from "@/components/discovery/AdminOnlyNotice";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import TasteProfileMock from "@/components/discovery/TasteProfileMock";
import WeeklyPickCard from "@/components/discovery/WeeklyPickCard";
import {
  WEEKLY_PICKS_DEMO,
  WEEKLY_PICKS_TASTE_MOCK,
} from "@/lib/discovery/placeholder-data";

export default function WeeklyPicksPage() {
  const accent = homeCyanAccentText(false);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <AdminOnlyPageGate>
          <div className="flex flex-wrap items-center gap-3">
            <p className={APP_KICKER}>Personal discovery</p>
            <DiscoveryComingSoonBadge />
          </div>

          <h1 className={APP_PAGE_TITLE}>
            Your weekly <span className={accent}>picks</span>
          </h1>

          <p className={APP_PAGE_LEAD}>
            Your personal game discovery drop based on your taste.
          </p>

          <AdminOnlyNotice />

          <div className="mt-10">
            <TasteProfileMock signals={WEEKLY_PICKS_TASTE_MOCK} />
          </div>

          <section className="mt-12" aria-labelledby="weekly-picks-grid-heading">
            <h2 id="weekly-picks-grid-heading" className="text-2xl font-extrabold text-slate-900">
              Your picks this week
            </h2>
            <p className="mt-2 text-sm text-slate-500">Static demo cards — personalization not live yet.</p>

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
        </AdminOnlyPageGate>
      </AppSection>
    </AppPageShell>
  );
}
