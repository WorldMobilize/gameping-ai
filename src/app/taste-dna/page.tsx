"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import { gameDetailPath } from "@/lib/curated/game-links";
import { formatDisplayDate } from "@/lib/format-display-date";
import {
  isTasteDna,
  isTasteDnaV2,
  type TasteDna,
  type TasteDnaV2,
} from "@/lib/steam-library/taste-dna-types";
import { supabase } from "@/lib/supabase";

const STEAM_SETTINGS_HREF = "/settings/account#steam-library-import";

type SavedRun = {
  id: string;
  name: string;
  games?: { title: string }[];
  created_at: string;
  is_active?: boolean;
};

type SavedPick = {
  id: string;
  title: string;
  created_at: string;
};

type SteamStatus = {
  connected: boolean;
  gameCount: number | null;
  dna: TasteDna | null;
};

type Tier = "loading" | "anon" | "free" | "premium";

function formatPlaytime(totalMin: number): string {
  const hours = Math.round(totalMin / 60);
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k hrs`;
  return `${hours.toLocaleString()} hrs`;
}

export default function TasteDnaPage() {
  const [tier, setTier] = useState<Tier>("loading");
  const [steam, setSteam] = useState<SteamStatus>({
    connected: false,
    gameCount: null,
    dna: null,
  });
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [savedPicks, setSavedPicks] = useState<SavedPick[]>([]);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();
    const plan = profile?.plan ?? "free";
    const isPremium = plan === "premium" || plan === "admin";

    if (!isPremium) {
      setTier("free");
      return;
    }

    // Premium/admin — read the caller's own rows only (no writes, no generation).
    const [steamRes, runsRes, picksRes] = await Promise.all([
      supabase
        .from("user_steam_connections")
        .select("steam_id, game_count, taste_dna")
        .eq("user_id", user.id)
        .maybeSingle(),
      fetch("/api/get-searches", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ user_id: user.id }),
      })
        .then((r) => (r.ok ? r.json() : { searches: [] }))
        .catch(() => ({ searches: [] })),
      supabase
        .from("tracked_games")
        .select("id, title, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const steamRow = steamRes.data as
      | { steam_id?: string | null; game_count?: number | null; taste_dna?: unknown }
      | null;
    const dna = isTasteDna(steamRow?.taste_dna) ? steamRow!.taste_dna : null;

    setSteam({
      connected: Boolean(steamRow?.steam_id),
      gameCount: typeof steamRow?.game_count === "number" ? steamRow.game_count : null,
      dna,
    });

    const runs = (runsRes as { searches?: SavedRun[] }).searches;
    setSavedRuns(Array.isArray(runs) ? runs : []);
    setSavedPicks((picksRes.data ?? []) as SavedPick[]);

    setTier("premium");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dnaV2: TasteDnaV2 | null =
    steam.dna && isTasteDnaV2(steam.dna) ? steam.dna : null;
  const hasDna = steam.dna != null;

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-account-bg" />
        <AppSection maxWidth="max-w-5xl">
          <EmailVerificationNotice className="mb-8" theme="light" />

          {/* Hero */}
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
            Taste DNA
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            Your <span className="text-[color:var(--page-accent-strong)]">Taste DNA</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Your play-style fingerprint — built from your Steam library and sharpened by your saved
            recommendation runs and tracked games. It powers Weekly Picks, Deals For You, Monthly
            Recap, and personal fit on every game page.
          </p>

          {/* Loading */}
          {tier === "loading" ? (
            <div className="mt-12 space-y-6" aria-busy="true" aria-live="polite">
              {[1, 2].map((row) => (
                <div key={row} className={`${APP_CARD_LG} p-6`}>
                  <div className="gp-game-skeleton-bar-light relative mb-5 h-9 max-w-[280px] animate-pulse overflow-hidden rounded-xl bg-slate-100 motion-reduce:animate-none" />
                  <div className="gp-game-skeleton-bar-light relative h-24 animate-pulse overflow-hidden rounded-2xl bg-slate-50 motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          ) : null}

          {/* Free / non-premium gate */}
          {tier === "free" ? (
            <div className={`mt-12 ${APP_CARD_LG}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                Premium
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white gp-home-display">
                Taste DNA is a Premium feature
              </h2>
              <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
                Upgrade to connect your Steam library and build a personal Taste DNA that explains
                why a game fits you — not just its genre tags.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/upgrade" className={APP_PRIMARY_CTA_ACCENT_SM}>
                  See Premium
                </Link>
                <Link href="/how-it-works/taste-memory" className={APP_SECONDARY_CTA}>
                  How it works
                </Link>
              </div>
            </div>
          ) : null}

          {/* Premium — the built DNA + its sources */}
          {tier === "premium" ? (
            <>
              {/* 1 — The DNA explanation */}
              <section className="mt-12" aria-labelledby="taste-dna-explained">
                <h2 id="taste-dna-explained" className="text-2xl font-extrabold text-white">
                  What your DNA says
                </h2>

                {hasDna ? (
                  <div className={`mt-6 ${APP_CARD} p-6 sm:p-8`}>
                    {dnaV2 ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                          You play like
                        </p>
                        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white gp-home-display">
                          {dnaV2.playerArchetype}
                        </p>
                        <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>{dnaV2.summary}</p>

                        {dnaV2.coreMotivations.length > 0 ? (
                          <div className="mt-6 space-y-4">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              What drives you
                            </p>
                            {dnaV2.coreMotivations.map((m) => {
                              const pct = Math.round(
                                Math.max(0, Math.min(1, m.confidence)) * 100
                              );
                              return (
                                <div key={m.trait}>
                                  <div className="flex items-baseline justify-between text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                      {m.trait}
                                    </span>
                                    <span className="tabular-nums font-bold text-[color:var(--page-accent-text)]">
                                      {pct}%
                                    </span>
                                  </div>
                                  <div
                                    className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10"
                                    role="img"
                                    aria-label={`${m.trait}: ${pct} percent`}
                                  >
                                    <div
                                      className="h-full rounded-full bg-[var(--page-accent-strong)]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  {m.reason ? (
                                    <p className={`mt-1.5 text-xs leading-5 ${APP_MUTED}`}>
                                      {m.reason}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="mt-8 grid gap-6 sm:grid-cols-2">
                          {dnaV2.likes.length > 0 ? (
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${APP_MUTED}`}>
                                You gravitate to
                              </p>
                              <ul className="mt-2 flex flex-wrap gap-2">
                                {dnaV2.likes.map((tag) => (
                                  <li
                                    key={tag}
                                    className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--page-accent-text)]"
                                  >
                                    {tag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {dnaV2.avoidLikely.length > 0 ? (
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${APP_MUTED}`}>
                                You tend to avoid
                              </p>
                              <ul className="mt-2 flex flex-wrap gap-2">
                                {dnaV2.avoidLikely.map((tag) => (
                                  <li
                                    key={tag}
                                    className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                                  >
                                    {tag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      // V1 DNA — likes + stats only (no archetype/summary yet).
                      <>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                          Your taste signals
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {steam.dna!.likes.map((tag) => (
                            <li
                              key={tag}
                              className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--page-accent-text)]"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {/* Stats footer — from the real library snapshot. */}
                    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-6 dark:border-white/10 sm:grid-cols-3">
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
                          {steam.dna!.stats.ownedCount.toLocaleString()}
                        </p>
                        <p className={`mt-1 text-sm ${APP_MUTED}`}>Games owned</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
                          {steam.dna!.stats.playedCount.toLocaleString()}
                        </p>
                        <p className={`mt-1 text-sm ${APP_MUTED}`}>Games played</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">
                          {formatPlaytime(steam.dna!.stats.totalPlaytimeMin)}
                        </p>
                        <p className={`mt-1 text-sm ${APP_MUTED}`}>Total playtime</p>
                      </div>
                    </div>
                    <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400">
                      Built {formatDisplayDate(steam.dna!.computedAt) ?? "recently"}
                      {dnaV2?.enrichedByAi ? " · refined with AI" : ""}. Updates when you re-sync
                      your Steam library.
                    </p>
                  </div>
                ) : (
                  // Premium but no DNA built yet.
                  <div className={`mt-6 ${APP_CARD} p-6 sm:p-8`}>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {steam.connected
                        ? "Your Taste DNA is being built"
                        : "Connect Steam to build your Taste DNA"}
                    </p>
                    <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
                      {steam.connected
                        ? "Your Steam library is connected. Your DNA is generated from your owned games and playtime — re-sync from settings if it hasn't appeared yet."
                        : "Import your Steam library and GamePing reads your owned games and playtime to build a personal play-style fingerprint."}
                    </p>
                    <div className="mt-6">
                      <Link href={STEAM_SETTINGS_HREF} className={APP_PRIMARY_CTA_ACCENT_SM}>
                        {steam.connected ? "Manage Steam library" : "Connect Steam"}
                      </Link>
                    </div>
                  </div>
                )}
              </section>

              {/* 2 — The sources that build the DNA */}
              <section className="mt-14" aria-labelledby="taste-dna-sources">
                <h2 id="taste-dna-sources" className="text-2xl font-extrabold text-white">
                  What builds your DNA
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Your Steam library builds the core; your saved runs and tracked games sharpen it.
                  The more you use GamePing, the sharper it gets.
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  {/* Steam library */}
                  <div className={`${APP_CARD} p-6`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--page-accent-text)]">
                      Steam library
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {steam.connected && steam.gameCount != null ? steam.gameCount : "—"}
                    </p>
                    <p className={`mt-1 text-sm ${APP_MUTED}`}>
                      {steam.connected ? "Games imported" : "Not connected"}
                    </p>
                    <Link
                      href={STEAM_SETTINGS_HREF}
                      className="mt-4 inline-flex text-sm font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline"
                    >
                      {steam.connected ? "Manage" : "Connect Steam"}
                    </Link>
                  </div>

                  {/* Saved runs */}
                  <div className={`${APP_CARD} p-6`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--page-accent-text)]">
                      Saved runs
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {savedRuns.length}
                    </p>
                    <p className={`mt-1 text-sm ${APP_MUTED}`}>Recommendation runs</p>
                    {savedRuns.length > 0 ? (
                      <ul className="mt-4 space-y-1.5">
                        {savedRuns.slice(0, 3).map((run) => (
                          <li
                            key={run.id}
                            className="truncate text-sm font-medium text-slate-700 dark:text-slate-200"
                          >
                            {run.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Link
                      href="/dashboard"
                      className="mt-4 inline-flex text-sm font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline"
                    >
                      {savedRuns.length > 0 ? "View all" : "Run a recommendation"}
                    </Link>
                  </div>

                  {/* Tracked games */}
                  <div className={`${APP_CARD} p-6`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--page-accent-text)]">
                      Tracked games
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {savedPicks.length}
                    </p>
                    <p className={`mt-1 text-sm ${APP_MUTED}`}>Games you track</p>
                    {savedPicks.length > 0 ? (
                      <ul className="mt-4 space-y-1.5">
                        {savedPicks.slice(0, 3).map((pick) => (
                          <li key={pick.id} className="truncate text-sm font-medium">
                            <Link
                              href={gameDetailPath(pick.title)}
                              className="text-slate-700 transition hover:text-[color:var(--page-accent-text)] dark:text-slate-200"
                            >
                              {pick.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Link
                      href="/games"
                      className="mt-4 inline-flex text-sm font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline"
                    >
                      {savedPicks.length > 0 ? "Browse games" : "Track a game"}
                    </Link>
                  </div>
                </div>

                <p className="mt-6 text-sm text-slate-300">
                  Want to know how it works?{" "}
                  <Link
                    href="/how-it-works/taste-memory"
                    className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
                  >
                    Read about Taste DNA
                  </Link>
                  .
                </p>
              </section>
            </>
          ) : null}

          {tier !== "loading" ? (
            <p className="mt-14 text-sm text-slate-300">
              <Link
                href="/dashboard"
                className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
              >
                Back to dashboard
              </Link>
            </p>
          ) : null}
        </AppSection>
      </div>
    </AppPageShell>
  );
}
