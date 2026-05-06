"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

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
  const [searches, setSearches] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const res = await fetch("/api/get-searches", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await res.json();
      setSearches(data.searches || []);
      setLoading(false);
    }

    load();
  }, []);

  async function deleteSearch(id: string) {
    if (!userId) return;

    const confirmDelete = confirm("Vuoi eliminare questa ricerca?");
    if (!confirmDelete) return;

    const res = await fetch("/api/delete-search", {
      method: "POST",
      body: JSON.stringify({
        id,
        user_id: userId,
      }),
    });

    if (res.ok) {
      setSearches((prev) => prev.filter((search) => search.id !== id));
    } else {
      alert("Errore durante eliminazione 😢");
    }
  }

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-cyan-300">
            Saved searches
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Your game alerts
          </h1>

          <p className="mt-4 max-w-2xl text-white/60">
            Qui trovi le tue ricerche salvate. In futuro GamePing controllerà
            prezzi e nuove uscite per mandarti alert intelligenti.
          </p>

          {loading && (
            <p className="mt-10 text-white/60">Loading searches...</p>
          )}

          {!loading && searches.length === 0 && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-black">Nessuna ricerca salvata</h2>
              <p className="mt-3 text-white/60">
                Vai nella pagina recommend e salva la tua prima ricerca.
              </p>
            </div>
          )}

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
                  {search.games.map((game, index) => (
                    <div
                      key={`${search.id}-${game.title}`}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black">
                          #{index + 1} {game.title}
                        </h3>

                        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
                          {game.match}% match
                        </span>
                      </div>

                      <p className="mt-3 text-sm italic text-white/60">
                        💡 {game.reason}
                      </p>

                      <p className="mt-4 font-bold text-cyan-300">
                        {game.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}