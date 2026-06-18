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
import DealForYouCard from "@/components/discovery/DealForYouCard";
import PremiumDiscoveryPageGate from "@/components/discovery/PremiumDiscoveryPageGate";
import { DEALS_FOR_YOU_DEMO } from "@/lib/discovery/placeholder-data";

export default function DealsForYouPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <PremiumDiscoveryPageGate>
          <div className="flex flex-wrap items-center gap-3">
            <p className={APP_KICKER}>Premium discovery</p>
            <DiscoveryComingSoonBadge variant="premium" />
          </div>

          <h1 className={APP_PAGE_TITLE}>
            Deals for <span className={APP_ACCENT}>you</span>
          </h1>

          <p className={APP_PAGE_LEAD}>
            Games matching your taste — highlighted when the timing and price feel right.
          </p>

          <section className="mt-12" aria-labelledby="deals-for-you-grid-heading">
            <h2 id="deals-for-you-grid-heading" className={APP_SECTION_TITLE}>
              Taste-matched deals
            </h2>
            <p className={`mt-2 ${APP_MUTED}`}>
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
        </PremiumDiscoveryPageGate>
      </AppSection>
    </AppPageShell>
  );
}
