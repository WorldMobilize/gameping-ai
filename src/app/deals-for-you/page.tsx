import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_MUTED,
} from "@/components/app/app-styles";
import DealForYouPremiumCard from "@/components/discovery/DealForYouPremiumCard";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import { DEALS_FOR_YOU_DEMO_DATA } from "@/lib/discovery/premium-demo-data";
import { resolvePremiumPersonalizationStatus } from "@/lib/discovery/premium-personalization";

export default function DealsForYouPage() {
  const { deals, categories, radar } = DEALS_FOR_YOU_DEMO_DATA;
  // Future: pass a real PersonalDiscoveryContext (taste + owned/tracked games +
  // pricing). No context wired yet → "needs-steam-import" empty state.
  const personalizationStatus = resolvePremiumPersonalizationStatus();

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-deals-bg" />
        <AppSection maxWidth="max-w-6xl">
          <AdminOnlyPageGate>
            {/* Hero */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
                Personal deal radar
              </p>
              <DiscoveryComingSoonBadge variant="premium" />
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
              Deals picked for <span className="text-[color:var(--page-accent-strong)]">you</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Find discounts on games you are actually likely to enjoy.
            </p>

            {personalizationStatus !== "personalized" ? (
              <PremiumPersonalEmptyState
                eyebrow="Make it personal"
                title="Import your Steam library to make this personal"
                description="Deals For You will combine your taste and owned/tracked games with live pricing to surface discounts on games you're likely to enjoy. Connect your Steam library to personalize the preview below."
                signals={[
                  "Owned & tracked games",
                  "Your taste profile",
                  "Store pricing signals (ITAD / Steam / CheapShark)",
                  "Wishlist & price-alert history",
                ]}
                demoNote="The prices below are a labeled demo — not live or personalized yet."
              />
            ) : null}

            {/* Section 1 — Best matches on sale */}
            <section className="mt-14" aria-labelledby="deals-best-heading">
              <h2 id="deals-best-heading" className="text-2xl font-extrabold text-white">
                Best matches on sale
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Demo prices only — no live store or ITAD lookups on this page yet.
              </p>
              <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {deals.map((deal) => (
                  <li key={deal.id} className="flex">
                    <DealForYouPremiumCard deal={deal} />
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 2 — Deal categories */}
            <section className="mt-14" aria-labelledby="deals-categories-heading">
              <h2 id="deals-categories-heading" className="text-2xl font-extrabold text-white">
                Deal categories
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Future filters to slice your deal radar the way you shop.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat) => (
                  <li key={cat.id} className={APP_CARD}>
                    <p className="font-bold text-slate-900 dark:text-white">{cat.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>{cat.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 3 — Price radar preview */}
            <section className="mt-14" aria-labelledby="deals-radar-heading">
              <h2 id="deals-radar-heading" className="text-2xl font-extrabold text-white">
                Price radar preview
              </h2>
              <div className={`mt-6 ${APP_CARD} p-6`}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                    GamePing is watching
                  </p>
                  <DiscoveryComingSoonBadge variant="premium" />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-3xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
                      {radar.watching}
                    </p>
                    <p className={`mt-1 text-sm ${APP_MUTED}`}>games matching your taste</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-3xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
                      {radar.dealsFound}
                    </p>
                    <p className={`mt-1 text-sm ${APP_MUTED}`}>interesting deals found</p>
                  </div>
                </div>
                <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400">
                  Sample numbers — live price scanning isn&apos;t running yet.
                </p>
              </div>
            </section>

            <div className="mt-14">
              <DiscoveryFutureCard
                title="How deals will personalize"
                bullets={[
                  "Tracked games and watchlists",
                  "Store pricing signals (ITAD / Steam / CheapShark)",
                  "Taste memory matching",
                ]}
              />
            </div>
          </AdminOnlyPageGate>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
