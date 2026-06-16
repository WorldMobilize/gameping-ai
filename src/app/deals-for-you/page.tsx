import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  homeCyanAccentText,
} from "@/components/app/app-styles";
import AdminOnlyNotice from "@/components/discovery/AdminOnlyNotice";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import DealForYouCard from "@/components/discovery/DealForYouCard";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import { DEALS_FOR_YOU_DEMO } from "@/lib/discovery/placeholder-data";

export default function DealsForYouPage() {
  const accent = homeCyanAccentText(false);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <AdminOnlyPageGate>
          <div className="flex flex-wrap items-center gap-3">
            <p className={APP_KICKER}>Personal deals</p>
            <DiscoveryComingSoonBadge />
          </div>

          <h1 className={APP_PAGE_TITLE}>
            Deals for <span className={accent}>you</span>
          </h1>

          <p className={APP_PAGE_LEAD}>
            Games matching your taste — highlighted when the timing and price feel right.
          </p>

          <AdminOnlyNotice />

          <section className="mt-12" aria-labelledby="deals-for-you-grid-heading">
            <h2 id="deals-for-you-grid-heading" className="text-2xl font-extrabold text-slate-900">
              Taste-matched deals
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Demo prices only — no live store or ITAD lookups on this page.
            </p>

            <ul className="mt-8 grid gap-6 md:grid-cols-2">
              {DEALS_FOR_YOU_DEMO.map((pick) => (
                <li key={pick.title} className="flex">
                  <DealForYouCard pick={pick} />
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12">
            <DiscoveryFutureCard
              title="How deals will personalize"
              bullets={[
                "Tracked games and watchlists",
                "Store pricing signals",
                "Taste memory matching",
              ]}
            />
          </div>
        </AdminOnlyPageGate>
      </AppSection>
    </AppPageShell>
  );
}
