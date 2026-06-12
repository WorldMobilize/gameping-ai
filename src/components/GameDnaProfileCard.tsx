"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
      <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Taste DNA</p>
      <h2 className="mt-4 text-3xl font-black">Build your Game DNA</h2>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
        Connect your Steam library and let GamePing understand your gaming taste.
      </p>
      <p className="mt-4 text-sm text-white/40">
        Taste-based recommendations are coming next. This preview only analyzes your imported
        Steam playtime.
      </p>
      <div className="mt-8">
        <Link
          href={STEAM_SETTINGS_HREF}
          className="inline-flex rounded-full bg-white px-8 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(255,255,255,0.1)] transition hover:bg-cyan-100"
        >
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
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
        <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Taste DNA</p>
        <h2 className="mt-4 text-3xl font-black">Your Game DNA 🧬</h2>
        <p className="mt-3 text-sm font-bold text-cyan-200/90">{tasteDna.playerArchetype}</p>

        <p className="mt-5 text-lg leading-8 text-white/70">{tasteDna.summary}</p>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-white/45">
          Based on
        </p>
        <p className="mt-2 text-lg text-white/75">
          {tasteDna.stats.ownedCount} games · {hours} hours analyzed
        </p>

        {motivations.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-bold text-white/80">Core motivations:</p>
            <ul className="mt-3 space-y-4 text-base leading-7 text-white/70">
              {motivations.map((motivation) => (
                <li key={motivation.trait}>
                  <span className="font-bold text-white/85">{motivation.trait}</span>
                  <span className="text-white/45"> · {Math.round(motivation.confidence * 100)}%</span>
                  <p className="mt-1 text-sm leading-6 text-white/55">{motivation.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {likes.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-bold text-white/80">You gravitate toward:</p>
            <ul className="mt-3 space-y-2 text-lg leading-8 text-white/70">
              {likes.map((like) => (
                <li key={like}>- {formatLikeForDisplay(like)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {signals.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-bold text-white/80">Strongest signals:</p>
            <ul className="mt-3 space-y-2 text-lg leading-8 text-white/70">
              {signals.map((title) => (
                <li key={title}>- {title}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-8 text-xs leading-relaxed text-white/35">
          Recommendations do not use Taste DNA yet. Personal recommendations are coming next.
        </p>
      </div>
    );
  }

  const likes = tasteDna.likes.slice(0, 4);
  const signals = tasteDna.favoriteSignals.slice(0, 3);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
      <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Taste DNA</p>
      <h2 className="mt-4 text-3xl font-black">Your Game DNA 🧬</h2>

      <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-white/45">
        Based on
      </p>
      <p className="mt-2 text-lg text-white/75">
        {tasteDna.stats.ownedCount} games · {hours} hours analyzed
      </p>

      {likes.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-bold text-white/80">You love:</p>
          <ul className="mt-3 space-y-2 text-lg leading-8 text-white/70">
            {likes.map((like) => (
              <li key={like}>- {formatLikeForDisplay(like)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {signals.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-bold text-white/80">Strongest signals:</p>
          <ul className="mt-3 space-y-2 text-lg leading-8 text-white/70">
            {signals.map((title) => (
              <li key={title}>- {title}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-white/35">
        Recommendations do not use Taste DNA yet. Personal recommendations are coming next.
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 animate-pulse motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Loading Game DNA"
    >
      <div className="h-4 w-28 rounded bg-white/10" />
      <div className="mt-6 h-9 w-64 max-w-full rounded bg-white/10" />
      <div className="mt-5 h-20 max-w-2xl rounded bg-white/[0.06]" />
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
