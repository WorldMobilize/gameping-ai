"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_CARD_LG,
  APP_CARD_TITLE,
  APP_MUTED,
  APP_PRIMARY_CTA_LG,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
  APP_SECTION_TITLE,
  APP_SECTION_TITLE_LG,
} from "@/components/app/app-styles";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import { useToast } from "@/components/ToastProvider";
import { gameDetailPath } from "@/lib/curated/game-links";
import { formatDisplayDate } from "@/lib/format-display-date";
import { EMAIL_NOT_VERIFIED_MESSAGE } from "@/lib/auth-email-verification";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";
import { isPremiumOrAdminPlan } from "@/lib/product-copy";
import { supabase } from "@/lib/supabase";

type Game = {
  title: string;
  match: number;
  reason: string;
  price: string;
};

type SearchProfile = {
  id: string;
  email: string;
  name: string;
  preferences: {
    genres?: string;
    budget?: string;
    platform?: string;
    mood?: string;
  };
  games: Game[];
  created_at: string;
  is_active?: boolean;
};

type TrackedGameRow = {
  id: string;
  title: string;
  rawg_id: number | null;
  is_active: boolean;
  last_known_price: number | null;
  last_checked_at: string | null;
  created_at: string;
};

function formatTrackedPrice(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `Last seen approx. $${value.toFixed(2)}`;
}

type PendingDelete =
  | { kind: "search"; id: string }
  | { kind: "tracked"; id: string };

function DeleteConfirmCard({
  confirmLabel,
  onCancel,
  onConfirm,
  busy,
}: {
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <div
      className="w-full max-w-sm rounded-2xl border border-rose-200/90 bg-rose-50/80 p-4 shadow-sm"
      role="alertdialog"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-desc"
    >
      <p id="delete-confirm-title" className="text-sm font-bold text-rose-950">
        Delete this item?
      </p>
      <p id="delete-confirm-desc" className="mt-1 text-xs leading-relaxed text-rose-800">
        This action can&apos;t be undone.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={`${APP_SECONDARY_CTA} disabled:opacity-50`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-full border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-400 hover:bg-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { showToast } = useToast();
  const [searches, setSearches] = useState<SearchProfile[]>([]);
  const [trackedGames, setTrackedGames] = useState<TrackedGameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedLoading, setTrackedLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [trackedLoadError, setTrackedLoadError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [trackedActionId, setTrackedActionId] = useState<string | null>(null);
  const [savedRunActionId, setSavedRunActionId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadTrackedGames = useCallback(async () => {
    setTrackedLoadError(false);
    setTrackedLoading(true);

    try {
      const { data, error } = await supabase
        .from("tracked_games")
        .select(
          "id, title, rawg_id, is_active, last_known_price, last_checked_at, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setTrackedLoadError(true);
        setTrackedGames([]);
        return;
      }

      setTrackedGames((data ?? []) as TrackedGameRow[]);
    } catch {
      setTrackedLoadError(true);
      setTrackedGames([]);
    } finally {
      setTrackedLoading(false);
    }
  }, []);

  const loadSearches = useCallback(async () => {
    setLoadError(false);
    setLoading(true);
    setTrackedLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserPlan(profile?.plan ?? "free");

      const [searchesRes] = await Promise.all([
        fetch("/api/get-searches", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ user_id: user.id }),
        }),
        loadTrackedGames(),
      ]);

      if (!searchesRes.ok) {
        if (searchesRes.status === 403) {
          const errBody = (await searchesRes.json().catch(() => ({}))) as {
            message?: string;
          };
          showToast({
            variant: "error",
            message: errBody.message || EMAIL_NOT_VERIFIED_MESSAGE,
          });
        }
        setLoadError(true);
        setSearches([]);
        return;
      }

      const data = (await searchesRes.json().catch(() => ({}))) as {
        searches?: SearchProfile[];
      };
      setSearches(Array.isArray(data.searches) ? data.searches : []);
    } catch {
      setLoadError(true);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, [loadTrackedGames, showToast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadSearches();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadSearches]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      showToast({
        variant: "success",
        message:
          "Welcome to Premium. You can save up to 25 searches and unlock full alerts.",
      });
      window.history.replaceState(null, "", "/dashboard");
    }
  }, [showToast]);

  async function deleteSearch(id: string) {
    if (!userId) return;

    setDeleteBusy(true);
    const res = await fetch("/api/delete-search", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        id,
        user_id: userId,
      }),
    });

    if (res.ok) {
      setSearches((prev) => prev.filter((search) => search.id !== id));
      setPendingDelete(null);
    } else {
      showToast({
        variant: "error",
        message: "Couldn’t delete that saved search. Try again.",
      });
    }
    setDeleteBusy(false);
  }

  async function setTrackedGameActive(id: string, isActive: boolean) {
    setTrackedActionId(id);
    try {
      const res = await fetch("/api/set-tracked-game-active", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok || !json.ok) {
        showToast({
          variant: "error",
          message:
            typeof json.message === "string" && json.message.length > 0
              ? json.message
              : isActive
                ? "Couldn’t resume alerts. Try again."
                : "Couldn’t pause alerts. Try again.",
        });
        return;
      }

      setTrackedGames((prev) =>
        prev.map((row) => (row.id === id ? { ...row, is_active: isActive } : row))
      );
      showToast({
        variant: "success",
        message: isActive ? "Price alerts resumed." : "Price alerts paused.",
      });
    } finally {
      setTrackedActionId(null);
    }
  }

  async function setSavedRunActive(id: string, isActive: boolean) {
    setSavedRunActionId(id);
    try {
      const res = await fetch("/api/set-saved-run-active", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok || !json.ok) {
        showToast({
          variant: "error",
          message:
            typeof json.message === "string" && json.message.length > 0
              ? json.message
              : isActive
                ? "Couldn’t activate this saved run. Try again."
                : "Couldn’t pause this saved run. Try again.",
        });
        return;
      }

      setSearches((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, is_active: isActive } : row
        )
      );
      showToast({
        variant: "success",
        message: isActive ? "Saved run activated." : "Saved run paused.",
      });
    } finally {
      setSavedRunActionId(null);
    }
  }

  async function deleteTrackedGame(id: string) {
    setTrackedActionId(id);
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/delete-tracked-game", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };

      if (!res.ok || !json.ok) {
        showToast({
          variant: "error",
          message: "Couldn’t delete tracking. Try again.",
        });
        return;
      }

      setTrackedGames((prev) => prev.filter((row) => row.id !== id));
      setPendingDelete(null);
      showToast({ variant: "success", message: "Tracking removed." });
    } finally {
      setTrackedActionId(null);
      setDeleteBusy(false);
    }
  }

  const isPremiumPlan = isPremiumOrAdminPlan(userPlan);

  const showLegacyPlanNotice =
    userPlan === "free" &&
    (searches.length > PLAN_QUOTAS.freeSavedSearches ||
      trackedGames.length > PLAN_QUOTAS.freeTrackedGames ||
      searches.some((s) => s.is_active === false) ||
      trackedGames.some((g) => !g.is_active));

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-account-bg" />
        <AppSection maxWidth="max-w-6xl">
        <EmailVerificationNotice className="mb-8" theme="light" />

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
              Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
              Your dashboard
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-200">
              Saved recommendation runs are complete searches you can revisit. Tracked games are
              individual titles you&apos;re monitoring for verified price drops.
            </p>

            <p className="mt-4 text-sm text-slate-300">
              {isPremiumPlan ? (
                <>
                  Premium: {PLAN_QUOTAS.premiumRecommendDaily} recommendations/day,{" "}
                  {PLAN_QUOTAS.premiumSavedSearches} saved runs,{" "}
                  {PLAN_QUOTAS.premiumTrackedGames} tracked games.{" "}
                </>
              ) : (
                <>
                  Free: {PLAN_QUOTAS.freeRecommendDaily} recommendations/day,{" "}
                  {PLAN_QUOTAS.freeSavedSearches} saved runs, {PLAN_QUOTAS.freeTrackedGames} tracked
                  games. Premium: {PLAN_QUOTAS.premiumRecommendDaily}/day,{" "}
                  {PLAN_QUOTAS.premiumSavedSearches} saved runs,{" "}
                  {PLAN_QUOTAS.premiumTrackedGames} tracked games.{" "}
                  <Link href="/upgrade" className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-2 hover:underline">
                    Upgrade
                  </Link>
                  {" · "}
                </>
              )}
              <Link href="/settings/account" className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-2 hover:underline">
                Account &amp; deletion
              </Link>
            </p>
          </div>

          <Link href="/recommend" className={`${APP_PRIMARY_CTA_LG} shrink-0`}>
            New recommendation
          </Link>
        </div>

        {showLegacyPlanNotice && (
          <p className="mt-6 max-w-3xl rounded-2xl border border-amber-200/90 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950">
            Some items were paused because your plan changed. Free users can keep{" "}
            {PLAN_QUOTAS.freeSavedSearches} saved runs and {PLAN_QUOTAS.freeTrackedGames}{" "}
            tracked games active. Pause one to activate another, or{" "}
            <Link href="/upgrade" className="font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline">
              upgrade to Premium
            </Link>
            .
          </p>
        )}

          {loading && (
            <div
              className="mt-10 space-y-6"
              aria-busy="true"
              aria-live="polite"
            >
              {[1, 2, 3].map((row) => (
                <div key={row} className={`${APP_CARD_LG} p-6`}>
                  <div className="gp-game-skeleton-bar-light relative mb-5 h-9 max-w-[min(100%,280px)] animate-pulse overflow-hidden rounded-xl bg-slate-100 motion-reduce:animate-none" />
                  <div className="gp-game-skeleton-bar-light relative mb-4 h-4 max-w-md animate-pulse overflow-hidden rounded-lg bg-slate-100 motion-reduce:animate-none" />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="gp-game-skeleton-bar-light relative h-32 animate-pulse overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 motion-reduce:animate-none" />
                    <div className="gp-game-skeleton-bar-light relative h-32 animate-pulse overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && loadError && (
            <div className="mt-10 rounded-3xl border border-rose-200/90 bg-rose-50/80 p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-700">
                Couldn&apos;t load
              </p>
              <h2 className={`mt-3 ${APP_SECTION_TITLE}`}>
                We couldn&apos;t load your saved recommendation runs
              </h2>
              <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
                Check your connection and try again. If this keeps happening, start fresh from
                recommendations—your account is still safe.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => loadSearches()}
                  className={APP_PRIMARY_CTA_SM}
                >
                  Retry
                </button>
                <Link href="/recommend" className={APP_SECONDARY_CTA}>
                  New recommendation
                </Link>
              </div>
            </div>
          )}

          <section
            className={`mt-14 ${APP_CARD_LG} p-6 md:p-8`}
            aria-labelledby="dashboard-saved-runs-heading"
          >
            <div className="mb-6 border-b border-slate-200/90 pb-5">
              <h2
                id="dashboard-saved-runs-heading"
                className={APP_SECTION_TITLE_LG}
              >
                Saved recommendation runs
              </h2>
              <p className={`mt-2 ${APP_MUTED}`}>
                Saved searches you can revisit later.
              </p>
            </div>

          {!loading && !loadError && searches.length === 0 && (
            <div className={`${APP_CARD} p-8 text-center`}>
              <p className={`text-lg font-extrabold text-slate-900 dark:text-white`}>No saved recommendation runs yet</p>
              <p className={`mt-3 ${APP_MUTED}`}>
                Run a recommendation, then save it from the results page.
              </p>
              <Link
                href="/recommend"
                className={`mt-6 ${APP_PRIMARY_CTA_LG} w-full sm:mx-auto sm:inline-flex sm:w-auto`}
              >
                Create your first search
              </Link>
            </div>
          )}

            {!loading && !loadError && searches.length > 0 && (
            <div className="grid gap-6">
              {searches.map((search) => {
                const runActive = search.is_active !== false;
                const runBusy = savedRunActionId === search.id || deleteBusy;

                return (
                <div
                  key={search.id}
                  className={`rounded-3xl border p-6 transition ${
                    runActive
                      ? "border-slate-200/90 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70"
                      : "border-slate-200/60 bg-slate-50/80 opacity-70 saturate-[0.85] dark:border-slate-800/60 dark:bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className={APP_SECTION_TITLE}>{search.name}</h2>
                        {!runActive && (
                          <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {search.preferences?.genres && (
                          <span className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--page-accent-text)]">
                            {search.preferences.genres}
                          </span>
                        )}

                        {search.preferences?.platform && (
                          <span className="rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-xs font-semibold tabular-nums text-[color:var(--page-accent-text)]">
                            {search.preferences.platform}
                          </span>
                        )}

                        {search.preferences?.mood && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {search.preferences.mood}
                          </span>
                        )}

                        {search.preferences?.budget && (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Max €{search.preferences.budget}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <p className={APP_MUTED}>
                        {formatDisplayDate(search.created_at) ?? "—"}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {runActive ? (
                          <button
                            type="button"
                            disabled={runBusy}
                            onClick={() => void setSavedRunActive(search.id, false)}
                            className={`${APP_SECONDARY_CTA} disabled:opacity-50`}
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={runBusy}
                            onClick={() => void setSavedRunActive(search.id, true)}
                            className="rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--page-accent-text)] transition hover:border-[color:var(--page-accent-strong)] disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        {pendingDelete?.kind === "search" &&
                        pendingDelete.id === search.id ? (
                          <DeleteConfirmCard
                            confirmLabel="Delete saved run"
                            busy={deleteBusy}
                            onCancel={() => setPendingDelete(null)}
                            onConfirm={() => void deleteSearch(search.id)}
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={runBusy}
                            onClick={() =>
                              setPendingDelete({ kind: "search", id: search.id })
                            }
                            className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {search.games.map((game, index) => {
                      const detailHref =
                        typeof game.title === "string" &&
                        game.title.trim().length > 0
                          ? gameDetailPath(game.title)
                          : null;

                      return (
                        <div
                          key={`${search.id}-${game.title}`}
                          className={`${APP_CARD} p-4`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-extrabold leading-snug text-slate-900">
                              <span className="text-slate-500">#{index + 1}</span>{" "}
                              {detailHref ? (
                                <Link
                                  href={detailHref}
                                  className="text-slate-900 transition hover:text-[color:var(--page-accent-text)]"
                                >
                                  {game.title}
                                </Link>
                              ) : (
                                game.title
                              )}
                            </h3>

                            <span className="shrink-0 rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-xs font-semibold tabular-nums text-[color:var(--page-accent-text)]">
                              {game.match}% match
                            </span>
                          </div>

                          <p className={`mt-3 text-sm italic ${APP_MUTED}`}>
                            💡 {game.reason}
                          </p>

                          <p className="mt-4 font-semibold text-[color:var(--page-accent-text)]">
                            {game.price}
                          </p>

                          {detailHref ? (
                            <Link
                              href={detailHref}
                              className="mt-3 inline-flex font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline"
                            >
                              View details
                            </Link>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })}
            </div>
          )}
          </section>

          <section
            className="mt-10 rounded-3xl border border-[color:var(--page-accent-border)] bg-white p-6 shadow-sm dark:bg-slate-900/70 md:p-8"
            aria-labelledby="dashboard-tracked-games-heading"
          >
            <div className="mb-6 border-b border-[color:var(--page-accent-border)] pb-5">
              <h2
                id="dashboard-tracked-games-heading"
                className={APP_SECTION_TITLE_LG}
              >
                Tracked games
              </h2>
              <p className={`mt-2 ${APP_MUTED}`}>
                Games you&apos;re monitoring for price drops.
              </p>
            </div>

            {trackedLoading && (
              <div className={`${APP_CARD} p-6`}>
                <div className="gp-game-skeleton-bar-light relative h-8 max-w-xs animate-pulse overflow-hidden rounded-lg bg-slate-100 motion-reduce:animate-none" />
              </div>
            )}

            {!trackedLoading && trackedLoadError && (
              <div className="rounded-2xl border border-rose-200/90 bg-rose-50/80 p-6">
                <p className="text-sm text-rose-900">
                  Couldn&apos;t load tracked games.{" "}
                  <button
                    type="button"
                    onClick={() => void loadTrackedGames()}
                    className="font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline"
                  >
                    Retry
                  </button>
                </p>
              </div>
            )}

            {!trackedLoading && !trackedLoadError && trackedGames.length === 0 && (
              <div className={`${APP_CARD} p-8`}>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">No tracked games yet</p>
                <p className={`mt-3 ${APP_MUTED}`}>
                  Open a game page and use Track price to get email alerts when we detect a
                  verified drop.
                </p>
                <Link href="/games" className={`mt-6 ${APP_SECONDARY_CTA}`}>
                  Browse games
                </Link>
              </div>
            )}

            {!trackedLoading && !trackedLoadError && trackedGames.length > 0 && (
              <div className="grid gap-4">
                {trackedGames.map((row) => {
                  const detailHref = gameDetailPath(row.title);
                  const priceLabel = formatTrackedPrice(
                    row.last_known_price != null
                      ? Number(row.last_known_price)
                      : null
                  );
                  const busy = trackedActionId === row.id || deleteBusy;
                  const confirmingDelete =
                    pendingDelete?.kind === "tracked" && pendingDelete.id === row.id;

                  return (
                    <div
                      key={row.id}
                      className={`flex flex-col gap-4 rounded-2xl border p-5 transition md:flex-row md:items-center md:justify-between ${
                      row.is_active
                        ? "border-slate-200/90 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70"
                        : "border-slate-200/60 bg-slate-50/80 opacity-70 saturate-[0.85] dark:border-slate-800/60 dark:bg-slate-900/40"
                    }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={APP_CARD_TITLE}>
                            <Link
                              href={detailHref}
                              className="transition hover:text-[color:var(--page-accent-text)]"
                            >
                              {row.title}
                            </Link>
                          </h3>
                          {!row.is_active && (
                            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                              Alerts paused
                            </span>
                          )}
                        </div>
                        {priceLabel ? (
                          <p className="mt-1 text-sm font-medium text-[color:var(--page-accent-text)]">{priceLabel}</p>
                        ) : (
                          <p className={`mt-1 text-sm ${APP_MUTED}`}>
                            Baseline set on first price check
                          </p>
                        )}
                        {row.last_checked_at ? (
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Last checked{" "}
                            {formatDisplayDate(row.last_checked_at) ?? "—"}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
                        {confirmingDelete ? (
                          <DeleteConfirmCard
                            confirmLabel="Delete tracking"
                            busy={deleteBusy}
                            onCancel={() => setPendingDelete(null)}
                            onConfirm={() => void deleteTrackedGame(row.id)}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {row.is_active ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void setTrackedGameActive(row.id, false)}
                                className={`${APP_SECONDARY_CTA} disabled:opacity-50`}
                              >
                                Pause alerts
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void setTrackedGameActive(row.id, true)}
                                className="rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--page-accent-text)] transition hover:border-[color:var(--page-accent-strong)] disabled:opacity-50"
                              >
                                Resume alerts
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setPendingDelete({ kind: "tracked", id: row.id })
                              }
                              className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:opacity-50"
                            >
                              Delete tracking
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
