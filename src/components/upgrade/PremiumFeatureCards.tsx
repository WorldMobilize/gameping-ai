"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Premium feature cards for /upgrade. Premium personalization is LIVE, so these
 * present Steam sync + the GamePing DNA profile as active sources — no
 * "coming soon". When the viewer has connected Steam / built a taste profile we
 * show their REAL signals; otherwise we show the value proposition and named
 * archetype examples (never faked as the user's own).
 */

const PREMIUM_CARD =
  "flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-7";
const CHIP =
  "inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-200";
const CHIP_MUTED =
  "inline-flex rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300";
const ACTIVE_PILL =
  "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300";

type LibrarySummary = {
  connected?: boolean;
  gameCount?: number;
  totalPlaytimeMin?: number;
  topGames?: { title: string; playtimeForever: number }[];
};

type TasteDna = {
  playerArchetype?: string;
  likes?: string[];
  avoidLikely?: string[];
  recommendationHints?: string[];
};

const ARCHETYPE_EXAMPLES = ["The Explorer", "The Strategist", "The Story Hunter", "The Challenge Seeker"];

function formatHours(min: number): string {
  const h = Math.round(min / 60);
  return h > 0 ? `${h}h` : `${min}m`;
}

function uniqTop(values: (string[] | undefined)[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const arr of values) {
    for (const v of arr ?? []) {
      const t = v.trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function PersonalizationStatus() {
  return (
    <div className="mt-5 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Personalization status
      </p>
      {["Weekly Picks", "Smart Deals", "Monthly Recap"].map((f) => (
        <div key={f} className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{f}</span>
          <span className={ACTIVE_PILL}>
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PremiumFeatureCards() {
  const [library, setLibrary] = useState<LibrarySummary | null>(null);
  const [dna, setDna] = useState<TasteDna | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/steam/library", { credentials: "include" });
        if (res.ok && !cancelled) {
          const json = (await res.json()) as LibrarySummary;
          if (json.connected) setLibrary(json);
        }
      } catch {
        /* best-effort */
      }
      try {
        const res = await fetch("/api/steam/taste-dna", { credentials: "include" });
        if (res.ok && !cancelled) {
          const json = (await res.json()) as { hasTasteDna?: boolean; tasteDna?: TasteDna };
          if (json.hasTasteDna && json.tasteDna) setDna(json.tasteDna);
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = library?.connected === true;
  const loves = uniqTop([dna?.likes, dna?.recommendationHints], 6);
  const dislikes = uniqTop([dna?.avoidLikely], 4);

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-2" aria-label="Premium personalization sources">
      {/* Card 1 — Steam Library Sync */}
      <article className={PREMIUM_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
            Personalization source
          </p>
          {connected ? (
            <span className={ACTIVE_PILL}>
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Steam Library Sync</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Connect your Steam library so GamePing understands what you actually play — not just what you search.
        </p>

        {connected ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-2xl font-extrabold tabular-nums text-cyan-700 dark:text-cyan-300">
                {library?.gameCount ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">games synced</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-2xl font-extrabold tabular-nums text-cyan-700 dark:text-cyan-300">
                {formatHours(library?.totalPlaytimeMin ?? 0)}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">total playtime</p>
            </div>
          </div>
        ) : null}

        {connected && library?.topGames?.length ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Playtime patterns
            </p>
            <ul className="mt-2 space-y-1.5">
              {library.topGames.slice(0, 3).map((g) => (
                <li key={g.title} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{g.title}</span>
                  <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                    {formatHours(g.playtimeForever)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {connected && loves.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Taste signals
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {loves.slice(0, 4).map((s) => (
                <li key={s} className={CHIP}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Used for
          </p>
          <ul className="mt-2 space-y-1.5">
            {["Weekly Picks", "Deals For You", "Monthly Recap"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <span aria-hidden className="text-cyan-600 dark:text-cyan-400">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-6">
          <Link
            href="/settings/account#steam-library-import"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
          >
            {connected ? "Manage Steam sync" : "Connect your Steam library"}
          </Link>
        </div>
      </article>

      {/* Card 2 — GamePing DNA */}
      <article className={PREMIUM_CARD}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
          Your gaming identity
        </p>
        <h3 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">GamePing DNA</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Your personal gaming profile evolves from your library, searches, and saved games.
        </p>

        {dna?.playerArchetype ? (
          <div className="mt-5 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              You are
            </p>
            <p className="mt-1 text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {dna.playerArchetype}
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Gaming archetypes
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {ARCHETYPE_EXAMPLES.map((a) => (
                <li key={a} className={CHIP_MUTED}>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {loves.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              You love
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {loves.map((s) => (
                <li key={s} className={CHIP}>
                  + {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {dislikes.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Less interested in
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {dislikes.map((s) => (
                <li key={s} className={CHIP_MUTED}>
                  – {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto pt-2">
          <PersonalizationStatus />
        </div>
      </article>
    </section>
  );
}
