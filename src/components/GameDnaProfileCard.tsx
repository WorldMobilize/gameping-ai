"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_CARD, APP_PRIMARY_CTA_SM } from "@/components/app/app-styles";
import {
  isTasteDnaV2,
  type TasteDna,
} from "@/lib/steam-library/taste-dna-types";

const STEAM_SETTINGS_HREF = "/settings/account#steam-library-import";

function formatAnalyzedHours(totalPlaytimeMin: number): string {
  if (!Number.isFinite(totalPlaytimeMin) || totalPlaytimeMin <= 0) return "0";
  return String(Math.round(totalPlaytimeMin / 60));
}

function formatLikeForDisplay(like: string): string {
  if (like === "Simulation") return "Simulation games";
  if (like === "Co-op") return "Co-op games";
  return like;
}

function BuildGameDnaCard() {
  return (
    <div className={`${APP_CARD} p-7`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Taste DNA</p>
      <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white gp-home-display">Build your Game DNA</h2>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
        Connect your Steam library and let GamePing understand your gaming taste.
      </p>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
        Taste-based recommendations are coming next. This preview only analyzes your imported
        Steam playtime.
      </p>
      <div className="mt-8">
        <Link href={STEAM_SETTINGS_HREF} className={APP_PRIMARY_CTA_SM}>
          Connect Steam
        </Link>
      </div>
    </div>
  );
}

function YourGameDnaCard({ tasteDna }: { tasteDna: TasteDna }) {
  const hours = formatAnalyzedHours(tasteDna.stats.totalPlaytimeMin);

  if (isTasteDnaV2(tasteDna)) {
    const motivations = tasteDna.coreMotivations.slice(0, 3);
    const likes = tasteDna.likes.slice(0, 4);
    const signals = tasteDna.favoriteSignals.slice(0, 3);

    return (
      <div className={`${APP_CARD} p-7`}>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Taste DNA</p>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white gp-home-display">Your Game DNA 🧬</h2>
        <p className="mt-3 text-sm font-semibold text-cyan-700">{tasteDna.playerArchetype}</p>

        <p className="mt-5 text-lg leading-8 text-slate-700 dark:text-slate-300">{tasteDna.summary}</p>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500">
          Based on
        </p>
        <p className="mt-2 text-lg text-slate-800 dark:text-slate-200">
          {tasteDna.stats.ownedCount} games · {hours} hours analyzed
        </p>

        {motivations.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Core motivations:</p>
            <ul className="mt-3 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              {motivations.map((motivation) => (
                <li key={motivation.trait}>
                  <span className="font-semibold text-slate-900 dark:text-white">{motivation.trait}</span>
                  <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500"> · {Math.round(motivation.confidence * 100)}%</span>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">{motivation.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {likes.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">You gravitate toward:</p>
            <ul className="mt-3 space-y-2 text-lg leading-8 text-slate-700 dark:text-slate-300">
              {likes.map((like) => (
                <li key={like}>- {formatLikeForDisplay(like)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {signals.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Strongest signals:</p>
            <ul className="mt-3 space-y-2 text-lg leading-8 text-slate-700 dark:text-slate-300">
              {signals.map((title) => (
                <li key={title}>- {title}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-8 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Recommendations do not use Taste DNA yet. Personal recommendations are coming next.
        </p>
      </div>
    );
  }

  const likes = tasteDna.likes.slice(0, 4);
  const signals = tasteDna.favoriteSignals.slice(0, 3);

  return (
    <div className={`${APP_CARD} p-7`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Taste DNA</p>
      <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white gp-home-display">Your Game DNA 🧬</h2>

      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500">
        Based on
      </p>
      <p className="mt-2 text-lg text-slate-800 dark:text-slate-200">
        {tasteDna.stats.ownedCount} games · {hours} hours analyzed
      </p>

      {likes.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">You love:</p>
          <ul className="mt-3 space-y-2 text-lg leading-8 text-slate-700 dark:text-slate-300">
            {likes.map((like) => (
              <li key={like}>- {formatLikeForDisplay(like)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {signals.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Strongest signals:</p>
          <ul className="mt-3 space-y-2 text-lg leading-8 text-slate-700 dark:text-slate-300">
            {signals.map((title) => (
              <li key={title}>- {title}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Recommendations do not use Taste DNA yet. Personal recommendations are coming next.
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      className={`${APP_CARD} p-7 animate-pulse motion-reduce:animate-none`}
      aria-busy="true"
      aria-label="Loading Game DNA"
    >
      <div className="gp-game-skeleton-bar-light h-4 w-28 rounded" />
      <div className="gp-game-skeleton-bar-light mt-6 h-9 w-64 max-w-full rounded" />
      <div className="gp-game-skeleton-bar-light mt-5 h-20 max-w-2xl rounded" />
    </div>
  );
}

export default function GameDnaProfileCard() {
  const [loading, setLoading] = useState(true);
  const [tasteDna, setTasteDna] = useState<TasteDna | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/steam/taste-dna", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setTasteDna(null);
          return;
        }
        const json = (await res.json()) as {
          hasTasteDna?: boolean;
          tasteDna?: TasteDna;
        };
        if (!cancelled) {
          setTasteDna(json.hasTasteDna && json.tasteDna ? json.tasteDna : null);
        }
      } catch {
        if (!cancelled) setTasteDna(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingCard />;
  if (tasteDna) return <YourGameDnaCard tasteDna={tasteDna} />;
  return <BuildGameDnaCard />;
}
