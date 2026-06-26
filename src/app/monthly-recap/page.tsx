import { notFound } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { APP_CARD, APP_CARD_HEADING, APP_MUTED } from "@/components/app/app-styles";
import PremiumAutoGenerate from "@/components/discovery/PremiumAutoGenerate";
import PremiumComingNext from "@/components/discovery/PremiumComingNext";
import PremiumDiscoveryUpsell from "@/components/discovery/PremiumDiscoveryUpsell";
import PremiumPersonalEmptyState from "@/components/discovery/PremiumPersonalEmptyState";
import PremiumRefreshButton from "@/components/discovery/PremiumRefreshButton";
import PremiumRotationAdminLine from "@/components/discovery/PremiumRotationAdminLine";
import PremiumUpdateStatus from "@/components/discovery/PremiumUpdateStatus";
import WeeklyPickPremiumCard from "@/components/discovery/WeeklyPickPremiumCard";
import {
  MONTHLY_RECAP_DEMO_DATA,
  type WeeklyPickCardData,
} from "@/lib/discovery/premium-demo-data";
import { resolvePremiumPageAccess } from "@/lib/discovery/premium-page-access";
import { buildUserTasteProfile } from "@/lib/discovery/user-taste-profile";
import {
  resolveUserRotation,
  type MonthlyRecapCore,
  type PremiumRotationMeta,
} from "@/lib/discovery/user-rotation-store";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Premium/personalized page — personalized & private, so keep it out of the index.
export const metadata: Metadata = buildNoIndexMetadata("Your monthly recap | GamePing AI");

// Cache-first: read the cached recap fast; generation happens off-render.
export const dynamic = "force-dynamic";

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
  let hasSignal = false;
  if (access.canViewPersonalized && access.userId) {
    const resolved = await resolveUserRotation(access.userId, "monthly_recap");
    const core = resolved.rotation?.featuredItem as MonthlyRecapCore | null;
    if (resolved.rotation && core && core.personality) {
      generatedCore = core;
      generatedPredictions = (resolved.rotation.items as WeeklyPickCardData[]) ?? [];
      aiSummary = resolved.rotation.aiSummary;
      meta = resolved.meta;
      console.info("[premium:monthly-recap] cacheHit", { userId: access.userId });
    } else {
      const profile = await buildUserTasteProfile(access.userId);
      hasSignal = profile.complete;
      console.info("[premium:monthly-recap] cacheMiss", {
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
      : generatedCore
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
          : override === "generated" && generatedCore
            ? "generated"
            : baseState;

  const isGenerated = state === "generated";
  const isGenerating = state === "generating";
  const core = isGenerated && generatedCore ? generatedCore : null;
  const personality = core ? core.personality : MONTHLY_RECAP_DEMO_DATA.personality;
  const month = core ? core.month : MONTHLY_RECAP_DEMO_DATA.month;
  const evolution = core ? core.evolution : MONTHLY_RECAP_DEMO_DATA.evolution;
  const predictions = isGenerated ? generatedPredictions : MONTHLY_RECAP_DEMO_DATA.predictions;
  const returnsTo = core?.returnsTo?.length ? core.returnsTo : MONTHLY_RECAP_DEMO_DATA.returnsTo;
  const topPlayed = core?.topPlayed?.length ? core.topPlayed : isGenerated ? [] : MONTHLY_RECAP_DEMO_DATA.topPlayed;
  const dominantGenres = core?.dominantGenres?.length ? core.dominantGenres : MONTHLY_RECAP_DEMO_DATA.dominantGenres;
  const favoriteMechanics = core?.favoriteMechanics?.length
    ? core.favoriteMechanics
    : MONTHLY_RECAP_DEMO_DATA.favoriteMechanics;
  const playtimeAllTime = core ? core.playtimeScope !== "this-month" : true;

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

          {isGenerated && access.viewer === "admin" ? (
            <div className="mt-6">
              <PremiumRefreshButton type="monthly_recap" label="Refresh recap" />
            </div>
          ) : null}
          {isGenerated && access.viewer === "premium" ? (
            <PremiumUpdateStatus type="monthly_recap" />
          ) : null}

          {state === "locked" ? (
            <PremiumDiscoveryUpsell showLogin={access.viewer === "anon"} />
          ) : null}

          {state === "empty" ? (
            <PremiumPersonalEmptyState
              eyebrow="Make it personal"
              title="Not enough activity yet for a recap"
              description="Monthly Recap summarizes your month — what you searched, saved, and tracked, what your Steam library suggests, and how your taste evolved. Import your Steam library, save a search, or track a game to build your first recap."
              signals={[
                "Searches & saved games",
                "Tracked games & price alerts",
                "Steam library & playtime",
              ]}
              demoNote="The recap below is a labeled sample — yours is built from real activity."
            />
          ) : null}

          {isGenerating ? (
            <PremiumAutoGenerate type="monthly_recap" noun="recap" />
          ) : (
            <>
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
                      Labeled sample — your Taste DNA is built from your real activity.
                    </p>
                  ) : null}
                </div>
              </section>

              {/* Section 1b — You kept returning to (Wrapped-style identity) */}
              {returnsTo.length > 0 ? (
                <section className="mt-10" aria-labelledby="recap-returns-heading">
                  <div className={`${APP_CARD} p-6 sm:p-8`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                      You kept returning to
                    </p>
                    <ul id="recap-returns-heading" className="mt-4 space-y-2.5">
                      {returnsTo.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
                          <span aria-hidden className="text-[color:var(--page-accent-text)]">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              {/* Section 1c — Top played + taste identity */}
              {topPlayed.length > 0 || dominantGenres.length > 0 || favoriteMechanics.length > 0 ? (
                <section className="mt-10 grid gap-6 lg:grid-cols-2" aria-label="Top played and taste identity">
                  {topPlayed.length > 0 ? (
                    <div className={`${APP_CARD} p-6`}>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                          Most played
                        </h2>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                          {playtimeAllTime ? "All-time" : "This month"}
                        </span>
                      </div>
                      <ol className="mt-4 space-y-2.5">
                        {topPlayed.map((g, i) => (
                          <li key={g.title} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <span className="tabular-nums text-[color:var(--page-accent-text)]">{i + 1}</span>
                              {g.title}
                            </span>
                            <span className={`shrink-0 text-sm tabular-nums ${APP_MUTED}`}>{g.hours}h</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  <div className={`${APP_CARD} p-6`}>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                      Your taste
                    </h2>
                    {dominantGenres.length > 0 ? (
                      <>
                        <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.15em] ${APP_MUTED}`}>
                          Dominant genres
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {dominantGenres.map((g) => (
                            <li
                              key={g}
                              className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--page-accent-text)]"
                            >
                              {g}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {favoriteMechanics.length > 0 ? (
                      <>
                        <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.15em] ${APP_MUTED}`}>
                          Favorite mechanics
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {favoriteMechanics.map((m) => (
                            <li
                              key={m}
                              className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                            >
                              {m}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

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
                  <p className="mt-3 text-[11px] text-slate-400">Labeled sample — yours uses your real counts.</p>
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
            </>
          )}

          <PremiumComingNext
            title="Built from your activity"
            items={[
              { label: "Steam library", description: "Your played games and playtime shape this recap." },
              { label: "GamePing DNA", description: "Your taste profile evolves as you discover, save, and track games." },
            ]}
          />
        </AppSection>
      </div>
    </AppPageShell>
  );
}
