import { notFound } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { APP_MUTED } from "@/components/app/app-styles";
import PremiumAutoGenerate from "@/components/discovery/PremiumAutoGenerate";
import PremiumComingNext from "@/components/discovery/PremiumComingNext";
import PremiumDiscoveryUpsell from "@/components/discovery/PremiumDiscoveryUpsell";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import PremiumRefreshButton from "@/components/discovery/PremiumRefreshButton";
import PremiumRotationAdminLine from "@/components/discovery/PremiumRotationAdminLine";
import PremiumUpdateStatus from "@/components/discovery/PremiumUpdateStatus";
import WeeklyPickPremiumCard from "@/components/discovery/WeeklyPickPremiumCard";
import {
  WEEKLY_PICKS_DEMO_DATA,
  type WeeklyPickCardData,
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
export const metadata: Metadata = buildNoIndexMetadata("Your weekly picks | GamePing AI");

// Cache-first: read the cached rotation fast and NEVER block render on generation
// (that happens off-render via /api/premium/generate-mine).
export const dynamic = "force-dynamic";

export default async function WeeklyPicksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const access = await resolvePremiumPageAccess();
  if (!access.reachable) notFound();

  // Fast path: read the cached, published rotation only — no inline generation.
  let generatedPicks: WeeklyPickCardData[] | null = null;
  let aiSummary: { headline: string; summary: string } | null = null;
  let meta: PremiumRotationMeta | null = null;
  let hasSignal = false;
  if (access.canViewPersonalized && access.userId) {
    const resolved = await resolveUserRotation(access.userId, "weekly_picks");
    if (resolved.rotation && resolved.rotation.items.length > 0) {
      generatedPicks = resolved.rotation.items as WeeklyPickCardData[];
      aiSummary = resolved.rotation.aiSummary;
      meta = resolved.meta;
      console.info("[premium:weekly-picks] cacheHit", { userId: access.userId });
    } else {
      // No cached content — build the taste profile (fast Supabase reads; this is
      // also where Steam import is detected) to decide generate vs empty.
      const profile = await buildUserTasteProfile(access.userId);
      hasSignal = profile.complete;
      console.info("[premium:weekly-picks] cacheMiss", {
        userId: access.userId,
        hasSignal,
        steamConnected: profile.sourceSummary.hasSteam,
        ownedTitleSetSize: profile.ownedTitleNorms.length,
      });
    }
  }

  // Admin-only state override for testing: ?state=empty|locked|generated|generating
  const sp = await searchParams;
  const stateParam = Array.isArray(sp?.state) ? sp.state[0] : sp?.state;
  const override = access.viewer === "admin" ? stateParam : undefined;

  const baseState: "generated" | "generating" | "empty" | "locked" =
    !access.canViewPersonalized
      ? "locked"
      : generatedPicks
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
          : override === "generated" && generatedPicks
            ? "generated"
            : baseState;

  const isGenerated = state === "generated";
  const isGenerating = state === "generating";
  const picks = isGenerated && generatedPicks ? generatedPicks : WEEKLY_PICKS_DEMO_DATA.picks;

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-weekly-bg" />
        <AppSection maxWidth="max-w-6xl">
          {/* Hero */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
              Personal picks
            </p>
            {state === "locked" ? (
              <span className="inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--page-accent-strong)]">
                Premium
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            Your weekly <span className="text-[color:var(--page-accent-strong)]">picks</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {isGenerated && aiSummary?.summary
              ? aiSummary.summary
              : "Fresh recommendations based on your taste, library, and what you might enjoy next."}
          </p>
          <PremiumRotationAdminLine viewer={access.viewer} meta={meta} aiUsed={meta?.sourceSummary?.aiUsed} />

          {/* Admin-only manual refresh (debug). Premium users see a clean
           * "updated weekly" caption — content is curated/scheduled, not on-demand. */}
          {isGenerated && access.viewer === "admin" ? (
            <div className="mt-6">
              <PremiumRefreshButton type="weekly_picks" />
            </div>
          ) : null}
          {isGenerated && access.viewer === "premium" ? (
            <PremiumUpdateStatus type="weekly_picks" />
          ) : null}

          {state === "locked" ? (
            <PremiumDiscoveryUpsell showLogin={access.viewer === "anon"} />
          ) : null}

          {state === "empty" ? (
            <PremiumPersonalEmptyState
              eyebrow="Make it personal"
              title="Import your Steam library to make this personal"
              description="Weekly Picks analyzes the games you own and play, plus your taste signals, to suggest games you may like next. Connect your Steam library, save a search, or track a game to get picks chosen for you."
              signals={[
                "Owned & played games (Steam library)",
                "Your taste profile",
                "Saved & tracked games",
              ]}
              demoNote="The picks below are a labeled sample — yours appear once you add a signal."
            />
          ) : null}

          {/* Content — real picks, the generating island, or the labeled sample. */}
          {isGenerating ? (
            <PremiumAutoGenerate type="weekly_picks" noun="weekly picks" />
          ) : (
            <section className="mt-14" aria-labelledby="weekly-games-heading">
              <h2 id="weekly-games-heading" className="text-2xl font-extrabold text-white">
                {isGenerated ? "Your games this week" : "Sample picks"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {isGenerated
                  ? aiSummary?.headline ?? "Picked for your taste."
                  : "A labeled sample of the format — yours are personalized."}
              </p>
              <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {picks.map((pick) => (
                  <li key={pick.id} className="flex">
                    <WeeklyPickPremiumCard pick={pick} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Honest, small "what's next" — never implies the current picks are fake. */}
          <PremiumComingNext
            items={[
              { label: "Mood tuning", description: "Re-tune your picks around the mood you're in." },
              { label: "Taste evolution", description: "Track how your taste shifts over time." },
            ]}
          />
          <p className={`mt-10 text-xs ${APP_MUTED}`}>
            Personalized from your Steam library, playtime, saved searches, and tracked games.
          </p>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
