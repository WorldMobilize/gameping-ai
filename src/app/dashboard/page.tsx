"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function Dashboard() {
  const { showToast } = useToast();
  const [searches, setSearches] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadSearches = useCallback(async () => {
    setLoadError(false);
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const res = await fetch("/api/get-searches", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) {
        setLoadError(true);
        setSearches([]);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        searches?: SearchProfile[];
      };
      setSearches(Array.isArray(data.searches) ? data.searches : []);
    } catch {
      setLoadError(true);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

    const confirmDelete = confirm("Delete this saved search?");
    if (!confirmDelete) return;

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
    } else {
      showToast({
        variant: "error",
        message: "Couldn’t delete that saved search. Try again.",
      });
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
                Saved recommendation runs
              </p>

              <h1 className="text-4xl font-black md:text-6xl">
                Your game alerts
              </h1>

              <p className="mt-4 text-white/60">
                Each row is a saved recommendation run — your vibe, filters, and picks in one
                place. Follow a single game&apos;s price from its{" "}
                <Link
                  href="/games"
                  className="font-semibold text-cyan-300 underline-offset-4 hover:underline"
                >
                  game detail
                </Link>{" "}
                page with Track price (that&apos;s separate from saving a full run here).
              </p>

              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Free accounts can save up to 3 searches. Premium unlocks more saved searches and
                stronger alerts.{" "}
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
              New recommendation →
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
                  New recommendation →
                </Link>
              </div>
            </div>
          )}

          {!loading && !loadError && searches.length === 0 && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-black">No saved recommendation runs yet</h2>
              <p className="mt-3 text-white/60">
                Run a recommendation, then save it from the results page to build your dashboard.
              </p>
              <Link
                href="/recommend"
                className="mt-6 inline-block rounded-full bg-cyan-400 px-8 py-4 font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
              >
                Create your first search →
              </Link>
            </div>
          )}

          {!loading && !loadError && searches.length > 0 && (
            <div className="mt-10 grid gap-6">
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
                        {new Date(search.created_at).toLocaleDateString()}
                      </p>

                      <button
                        onClick={() => deleteSearch(search.id)}
                        className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/10"
                      >
                        Delete
                      </button>
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
                              View details →
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
        </div>
      </section>
    </main>
  );
}
