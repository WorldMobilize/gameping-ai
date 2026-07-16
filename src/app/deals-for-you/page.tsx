import { notFound } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { APP_MUTED } from "@/components/app/app-styles";
import DealForYouPremiumCard from "@/components/discovery/DealForYouPremiumCard";
import PremiumAutoGenerate from "@/components/discovery/PremiumAutoGenerate";
import PremiumComingNext from "@/components/discovery/PremiumComingNext";
import PremiumDiscoveryUpsell from "@/components/discovery/PremiumDiscoveryUpsell";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import PremiumRefreshButton from "@/components/discovery/PremiumRefreshButton";
import PremiumSignalRefresh from "@/components/discovery/PremiumSignalRefresh";
import PremiumUpdateStatus from "@/components/discovery/PremiumUpdateStatus";
import {
  DEALS_FOR_YOU_DEMO_DATA,
  type DealCardData,
} from "@/lib/discovery/premium-demo-data";
import { resolvePremiumPageAccess } from "@/lib/discovery/premium-page-access";
import { buildUserTasteProfile } from "@/lib/discovery/user-taste-profile";
import {
  resolveUserRotation,
  type PremiumRotationMeta,
} from "@/lib/discovery/user-rotation-store";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Premium/personalized page — personalized & private, so keep it out of the index.
export const metadata: Metadata = buildNoIndexMetadata("Deals for you | GamePing AI");

// Cache-first: read the cached rotation fast; generation happens off-render.
export const dynamic = "force-dynamic";

export default async function DealsForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const access = await resolvePremiumPageAccess();
  if (!access.reachable) notFound();

  let generatedDeals: DealCardData[] | null = null;
  let aiSummary: { headline: string; summary: string } | null = null;
  let meta: PremiumRotationMeta | null = null;
  let hasSignal = false;
  if (access.canViewPersonalized && access.userId) {
    const resolved = await resolveUserRotation(access.userId, "deals_for_you");
    if (resolved.rotation && resolved.rotation.items.length > 0) {
      generatedDeals = resolved.rotation.items as DealCardData[];
      aiSummary = resolved.rotation.aiSummary;
      meta = resolved.meta;
      console.info("[premium:deals-for-you] cacheHit", { userId: access.userId });
    } else {
      const profile = await buildUserTasteProfile(access.userId);
      hasSignal = profile.complete;
      console.info("[premium:deals-for-you] cacheMiss", {
        userId: access.userId,
        hasSignal,
        steamConnected: profile.sourceSummary.hasSteam,
      });
    }
  }

  const sp = await searchParams;
  const stateParam = Array.isArray(sp?.state) ? sp.state[0] : sp?.state;
  const override = access.viewer === "admin" ? stateParam : undefined;

  const baseState: "generated" | "generating" | "empty" | "locked" =
    !access.canViewPersonalized
      ? "locked"
      : generatedDeals
        ? "generated"
        : hasSignal
          ? "generating"
          : "empty";
  const state =
    override === "locked"
      ? "locked"
      : override === "empty"
        ? "empty"
        : override === "generating"
          ? "generating"
          : override === "generated" && generatedDeals
            ? "generated"
            : baseState;

  const isGenerated = state === "generated";
  const isGenerating = state === "generating";
  const deals = isGenerated && generatedDeals ? generatedDeals : DEALS_FOR_YOU_DEMO_DATA.deals;

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-deals-bg" />
        <AppSection maxWidth="max-w-6xl">
          {/* Hero */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
              Personal deal radar
            </p>
            {state === "locked" ? (
              <span className="inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--page-accent-strong)]">
                Demo
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            Deals picked for <span className="text-[color:var(--page-accent-strong)]">you</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {isGenerated && aiSummary?.summary
              ? aiSummary.summary
              : "Taste-matched games with prices worth checking — not random sales."}
          </p>

          {isGenerated && access.viewer === "admin" ? (
            <div className="mt-6">
              <PremiumRefreshButton type="deals_for_you" label="Refresh deals" />
            </div>
          ) : null}
          {isGenerated && access.viewer === "premium" ? (
            <PremiumUpdateStatus type="deals_for_you" />
          ) : null}
          {/* Signals moved since these deals were built → regenerate in background. */}
          {isGenerated && meta?.signalsChanged ? (
            <PremiumSignalRefresh type="deals_for_you" noun="deals" />
          ) : null}

          {state === "locked" ? (
            <PremiumDiscoveryUpsell showLogin={access.viewer === "anon"} />
          ) : null}

          {state === "empty" ? (
            <PremiumPersonalEmptyState
              eyebrow="Make it personal"
              title="Add a taste signal to build your deal radar"
              description="Deals For You finds games that fit your taste, then surfaces the best prices for them — never games you already own. Import your Steam library, save a search, or track a game to begin."
              signals={[
                "Steam library & playtime",
                "Saved searches & tracked games",
                "Live store pricing (ITAD / Steam / CheapShark)",
              ]}
              demoNote="The cards below are a labeled sample — yours use live prices once you add a signal."
            />
          ) : null}

          {/* Content — real deals, the generating island, or the labeled sample. */}
          {isGenerating ? (
            <PremiumAutoGenerate
              type="deals_for_you"
              noun="deals"
              insufficientTitle="Add a taste signal to build your deal radar"
              insufficientBody="We couldn't find taste-matched games to price yet. Import your Steam library, save a search, or track a game, and we'll surface taste matches with the best prices we can find."
            />
          ) : (
            <section className="mt-14" aria-labelledby="deals-best-heading">
              <h2 id="deals-best-heading" className="text-2xl font-extrabold text-white">
                {isGenerated ? "Worth checking at today's prices" : "Sample deals"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {isGenerated
                  ? aiSummary?.headline ?? "Games that fit your taste and are worth checking at today's prices."
                  : "A labeled sample of the format — yours use live prices."}
              </p>
              <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {deals.map((deal) => (
                  <li key={deal.id} className="flex">
                    <DealForYouPremiumCard deal={deal} isSample={!isGenerated} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <PremiumComingNext
            items={[
              { label: "Taste match first", description: "GamePing finds games that match your preferences before looking at prices." },
              { label: "Smart tracking", description: "Follow games you care about and track price changes over time." },
            ]}
          />
          <p className={`mt-10 text-xs ${APP_MUTED}`}>
            Live prices via ITAD / Steam / CheapShark, ranked by taste fit. Games you already own are excluded.
          </p>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
