"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/format-display-date";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { gameDetailPath } from "@/lib/curated/game-links";

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
      className="w-full max-w-sm rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4"
      role="alertdialog"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-desc"
    >
      <p id="delete-confirm-title" className="text-sm font-bold text-white">
        Delete this item?
      </p>
      <p id="delete-confirm-desc" className="mt-1 text-xs leading-relaxed text-white/55">
        This action can&apos;t be undone.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/75 transition hover:border-white/30 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-full border border-red-400/50 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50"
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

      const [searchesRes] = await Promise.all([
        fetch("/api/get-searches", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ user_id: user.id }),
        }),
        loadTrackedGames(),
      ]);

      if (!searchesRes.ok) {
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
  }, [loadTrackedGames]);

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
      const { error } = await supabase
        .from("tracked_games")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) {
        showToast({
          variant: "error",
          message: isActive
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

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm uppercase tracking-[0.4em] text-cyan-300">
                Dashboard
              </p>

              <h1 className="text-4xl font-black md:text-6xl">Your dashboard</h1>

              <p className="mt-4 text-white/60">
                Saved recommendation runs are complete searches you can revisit. Tracked games are
                individual titles you&apos;re monitoring for verified price drops.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Free: 5 recommendations/day, 3 saved runs, 5 tracked games. Premium: 50/day, 25 saved
                runs, 50 tracked games.{" "}
                <Link
                  href="/upgrade"
                  className="font-semibold text-cyan-300 underline-offset-4 hover:underline"
                >
                  Upgrade
                </Link>
                {" · "}
                <Link
                  href="/settings/account"
                  className="font-semibold text-cyan-300 underline-offset-4 hover:underline"
                >
                  Account &amp; deletion
                </Link>
              </p>
            </div>

            <Link
              href="/recommend"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-cyan-400 px-8 py-4 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
            >
              New recommendation
            </Link>
          </div>

          {loading && (
            <div
              className="mt-10 space-y-6"
              aria-busy="true"
              aria-live="polite"
            >
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="gp-recommend-skeleton-bar relative mb-5 h-9 max-w-[min(100%,280px)] animate-pulse overflow-hidden rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
                  <div className="gp-recommend-skeleton-bar relative mb-4 h-4 max-w-md animate-pulse overflow-hidden rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="gp-recommend-skeleton-bar relative h-32 animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-black/25 motion-reduce:animate-none" />
                    <div className="gp-recommend-skeleton-bar relative h-32 animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-black/25 motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && loadError && (
            <div className="mt-10 rounded-3xl border border-rose-400/25 bg-rose-500/[0.08] p-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-200/90">
                Couldn&apos;t load
              </p>
              <h2 className="mt-3 text-2xl font-black">
                We couldn&apos;t load your saved recommendation runs
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                Check your connection and try again. If this keeps happening, start fresh from
                recommendations—your account is still safe.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => loadSearches()}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
                >
                  Retry
                </button>
                <Link
                  href="/recommend"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
                >
                  New recommendation
                </Link>
              </div>
            </div>
          )}

          <section
            className="mt-14 rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8"
            aria-labelledby="dashboard-saved-runs-heading"
          >
            <div className="mb-6 border-b border-white/10 pb-5">
              <h2
                id="dashboard-saved-runs-heading"
                className="text-2xl font-black md:text-3xl"
              >
                Saved recommendation runs
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Saved searches you can revisit later.
              </p>
            </div>

          {!loading && !loadError && searches.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-lg font-black">No saved recommendation runs yet</p>
              <p className="mt-3 text-white/60">
                Run a recommendation, then save it from the results page.
              </p>
              <Link
                href="/recommend"
                className="mt-6 inline-block rounded-full bg-cyan-400 px-8 py-4 font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
              >
                Create your first search
              </Link>
            </div>
          )}

            {!loading && !loadError && searches.length > 0 && (
            <div className="grid gap-6">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h2 className="text-2xl font-black">{search.name}</h2>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {search.preferences?.genres && (
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                            {search.preferences.genres}
                          </span>
                        )}

                        {search.preferences?.platform && (
                          <span className="rounded-full bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-300">
                            {search.preferences.platform}
                          </span>
                        )}

                        {search.preferences?.mood && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                            {search.preferences.mood}
                          </span>
                        )}

                        {search.preferences?.budget && (
                          <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs font-bold text-green-300">
                            Max €{search.preferences.budget}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <p className="text-sm text-white/40">
                        {formatDisplayDate(search.created_at) ?? "—"}
                      </p>

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
                          onClick={() =>
                            setPendingDelete({ kind: "search", id: search.id })
                          }
                          className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/10"
                        >
                          Delete
                        </button>
                      )}
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
                          className="rounded-2xl border border-white/10 bg-black/30 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-black leading-snug">
                              <span className="text-white/45">#{index + 1}</span>{" "}
                              {detailHref ? (
                                <Link
                                  href={detailHref}
                                  className="text-white transition hover:text-cyan-300"
                                >
                                  {game.title}
                                </Link>
                              ) : (
                                game.title
                              )}
                            </h3>

                            <span className="shrink-0 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
                              {game.match}% match
                            </span>
                          </div>

                          <p className="mt-3 text-sm italic text-white/60">
                            💡 {game.reason}
                          </p>

                          <p className="mt-4 font-bold text-cyan-300">
                            {game.price}
                          </p>

                          {detailHref ? (
                            <Link
                              href={detailHref}
                              className="mt-3 inline-flex text-sm font-bold text-cyan-300 underline-offset-4 transition hover:underline"
                            >
                              View details
                            </Link>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </section>

          <section
            className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6 md:p-8"
            aria-labelledby="dashboard-tracked-games-heading"
          >
            <div className="mb-6 border-b border-white/10 pb-5">
              <h2
                id="dashboard-tracked-games-heading"
                className="text-2xl font-black md:text-3xl"
              >
                Tracked games
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Games you&apos;re monitoring for price drops.
              </p>
            </div>

            {trackedLoading && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="gp-recommend-skeleton-bar relative h-8 max-w-xs animate-pulse overflow-hidden rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
              </div>
            )}

            {!trackedLoading && trackedLoadError && (
              <div className="rounded-3xl border border-rose-400/25 bg-rose-500/[0.08] p-6">
                <p className="text-sm text-white/70">
                  Couldn&apos;t load tracked games.{" "}
                  <button
                    type="button"
                    onClick={() => void loadTrackedGames()}
                    className="font-bold text-cyan-300 underline-offset-2 hover:underline"
                  >
                    Retry
                  </button>
                </p>
              </div>
            )}

            {!trackedLoading && !trackedLoadError && trackedGames.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <p className="text-lg font-black">No tracked games yet</p>
                <p className="mt-3 text-sm text-white/60">
                  Open a game page and use Track price to get email alerts when we detect a
                  verified drop.
                </p>
                <Link
                  href="/games"
                  className="mt-6 inline-block rounded-full border border-cyan-400/40 px-6 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/10"
                >
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
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">
                            <Link
                              href={detailHref}
                              className="text-white transition hover:text-cyan-300"
                            >
                              {row.title}
                            </Link>
                          </h3>
                          {!row.is_active && (
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/55">
                              Alerts paused
                            </span>
                          )}
                        </div>
                        {priceLabel ? (
                          <p className="mt-1 text-sm text-cyan-300/90">{priceLabel}</p>
                        ) : (
                          <p className="mt-1 text-sm text-white/45">
                            Baseline set on first price check
                          </p>
                        )}
                        {row.last_checked_at ? (
                          <p className="mt-1 text-xs text-white/35">
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
                                className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/75 transition hover:border-white/30 disabled:opacity-50"
                              >
                                Pause alerts
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void setTrackedGameActive(row.id, true)}
                                className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-50"
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
                              className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
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
        </div>
      </section>
    </main>
  );
}
