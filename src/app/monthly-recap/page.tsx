import { notFound } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { APP_CARD, APP_CARD_HEADING, APP_MUTED } from "@/components/app/app-styles";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import PremiumDiscoveryUpsell from "@/components/discovery/PremiumDiscoveryUpsell";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import PremiumRefreshButton from "@/components/discovery/PremiumRefreshButton";
import PremiumRotationAdminLine from "@/components/discovery/PremiumRotationAdminLine";
import WeeklyPickPremiumCard from "@/components/discovery/WeeklyPickPremiumCard";
import {
  MONTHLY_RECAP_DEMO_DATA,
  type WeeklyPickCardData,
} from "@/lib/discovery/premium-demo-data";
import { resolvePremiumPageAccess } from "@/lib/discovery/premium-page-access";
import { ensureUserPremiumRotation } from "@/lib/discovery/ensure-premium-rotation";
import {
  type MonthlyRecapCore,
  type PremiumRotationMeta,
} from "@/lib/discovery/user-rotation-store";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Premium/personalized page — personalized & private, so keep it out of the index.
export const metadata: Metadata = buildNoIndexMetadata("Your monthly recap | GamePing AI");

export const dynamic = "force-dynamic";
// Allow the first-visit lazy generation (activity stats + optional OpenAI) to run.
export const maxDuration = 60;

export default async function MonthlyRecapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const access = await resolvePremiumPageAccess();
  if (!access.reachable) notFound();

  let generatedCore: MonthlyRecapCore | null = null;
  let generatedPredictions: WeeklyPickCardData[] = [];
  let aiSummary: { headline: string; summary: string } | null = null;
  let meta: PremiumRotationMeta | null = null;
  if (access.canViewPersonalized && access.userId) {
    // Read cache, generating once on this visit if missing/stale (cooldown-guarded).
    const resolved = await ensureUserPremiumRotation(access.userId, "monthly_recap");
    const core = resolved.rotation?.featuredItem as MonthlyRecapCore | null;
    if (resolved.rotation && core && core.personality) {
      generatedCore = core;
      generatedPredictions = (resolved.rotation.items as WeeklyPickCardData[]) ?? [];
      aiSummary = resolved.rotation.aiSummary;
      meta = resolved.meta;
    }
  }

  const sp = await searchParams;
  const stateParam = Array.isArray(sp?.state) ? sp.state[0] : sp?.state;
  const override = access.viewer === "admin" ? stateParam : undefined;
  const state: "generated" | "empty" | "locked" =
    override === "locked"
      ? "locked"
      : override === "empty"
        ? "empty"
        : override === "generated" && generatedCore
          ? "generated"
          : access.canViewPersonalized
            ? generatedCore
              ? "generated"
              : "empty"
            : "locked";

  const isGenerated = state === "generated";
  const personality = isGenerated && generatedCore ? generatedCore.personality : MONTHLY_RECAP_DEMO_DATA.personality;
  const month = isGenerated && generatedCore ? generatedCore.month : MONTHLY_RECAP_DEMO_DATA.month;
  const evolution = isGenerated && generatedCore ? generatedCore.evolution : MONTHLY_RECAP_DEMO_DATA.evolution;
  const predictions = isGenerated ? generatedPredictions : MONTHLY_RECAP_DEMO_DATA.predictions;

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
          {/* Hero */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
              Monthly recap
            </p>
            {state === "locked" ? (
              <span className="inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--page-accent-strong)]">
                Premium
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            Your month in <span className="text-[color:var(--page-accent-strong)]">gaming</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {isGenerated && aiSummary?.summary
              ? aiSummary.summary
              : "See how your taste evolved and discover what to play next."}
          </p>
          <PremiumRotationAdminLine viewer={access.viewer} meta={meta} aiUsed={meta?.sourceSummary?.aiUsed} />

          {access.canViewPersonalized && isGenerated ? (
            <div className="mt-6">
              <PremiumRefreshButton type="monthly_recap" label="Refresh recap" />
            </div>
          ) : null}

          {state === "locked" ? (
            <PremiumDiscoveryUpsell showLogin={access.viewer === "anon"} />
          ) : null}

          {state === "empty" ? (
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
              {!isGenerated ? (
                <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400">
                  Demo profile — real Taste DNA will be generated from your activity.
                </p>
              ) : null}
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
            {!isGenerated ? (
              <p className="mt-3 text-[11px] text-slate-400">Sample stats — not real tracking yet.</p>
            ) : null}
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
                  {evolution.before.length > 0 ? (
                    evolution.before.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                      >
                        {tag}
                      </li>
                    ))
                  ) : (
                    <li className={`text-sm ${APP_MUTED}`}>Not enough history yet.</li>
                  )}
                </ul>
              </div>
              <div className={`${APP_CARD} p-6`}>
                <h3 className={APP_CARD_HEADING}>Now</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {evolution.now.length > 0 ? (
                    evolution.now.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--page-accent-text)]"
                      >
                        {tag}
                      </li>
                    ))
                  ) : (
                    <li className={`text-sm ${APP_MUTED}`}>Keep using GamePing to build this.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 — Next month predictions */}
          {predictions.length > 0 ? (
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
          ) : null}

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
        </AppSection>
      </div>
    </AppPageShell>
  );
}
