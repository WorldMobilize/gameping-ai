"use client";

import { useEffect, useState } from "react";
import BuildGameDnaCard from "@/components/BuildGameDnaCard";
import type { PersonalGameFit, PersonalGameFitTier } from "@/lib/personal-game-fit/types";

type PersonalGameFitCardProps = {
  gameSlug: string;
  rawgId?: number | null;
};

function fitTierLabel(tier: PersonalGameFitTier): string {
  if (tier === "great_fit") return "Great fit";
  if (tier === "good_fit") return "Good fit";
  if (tier === "partial_fit") return "Partial fit";
  if (tier === "different_but_worth_trying") return "Worth trying";
  if (tier === "owned") return "In your library";
  return "Weak fit";
}

function fitTierClassName(tier: PersonalGameFitTier): string {
  if (tier === "great_fit" || tier === "owned") {
    return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80";
  }
  if (tier === "good_fit" || tier === "different_but_worth_trying") {
    return "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80";
  }
  if (tier === "partial_fit") {
    return "rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80";
  }
  return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80";
}

function FitBulletList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "pro" | "con";
}) {
  if (items.length === 0) return null;

  const dotClass = variant === "pro" ? "bg-cyan-500" : "bg-slate-400";

  return (
    <div className="mt-7">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-3">
        {items.map((line) => (
          <li key={line} className="flex gap-3 text-[15px] leading-6 text-slate-600">
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PersonalGameFitContent({ fit }: { fit: PersonalGameFit }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
        Your Personal Fit
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 gp-home-display md:text-3xl">
        Is this game right for you?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Based on your Gaming DNA and this game&apos;s design.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={fitTierClassName(fit.fitTier)}>{fitTierLabel(fit.fitTier)}</span>
        {fit.fitTier !== "owned" ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50 px-3 py-1.5">
            <span className="text-xs font-medium text-slate-500">Fit score</span>
            <span className="text-sm font-bold tabular-nums text-cyan-800">{fit.fitScore}%</span>
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-lg leading-8 text-slate-800">{fit.headline}</p>

      <FitBulletList title="Why you may like it" items={fit.whyYouMayLike} variant="pro" />
      <FitBulletList title="Potential concerns" items={fit.potentialConcerns} variant="con" />

      <p className="mt-8 border-t border-slate-100 pt-5 text-xs leading-relaxed text-slate-400">
        From your imported Steam library. Search recommendations do not use Gaming DNA yet.
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      className="rounded-2xl border border-slate-200/90 bg-white p-7 animate-pulse motion-reduce:animate-none md:p-8"
      aria-busy="true"
      aria-label="Loading personal game fit"
    >
      <div className="gp-game-skeleton-bar-light h-3 w-32 rounded" />
      <div className="gp-game-skeleton-bar-light mt-6 h-8 w-72 max-w-full rounded" />
      <div className="gp-game-skeleton-bar-light mt-3 h-4 w-56 max-w-full rounded" />
      <div className="gp-game-skeleton-bar-light mt-8 h-24 max-w-2xl rounded" />
    </div>
  );
}

export default function PersonalGameFitCard({
  gameSlug,
  rawgId,
}: PersonalGameFitCardProps) {
  const [loading, setLoading] = useState(true);
  const [fit, setFit] = useState<PersonalGameFit | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const params = new URLSearchParams({ slug: gameSlug });
        if (rawgId) params.set("rawgId", String(rawgId));

        const res = await fetch(`/api/game/personal-fit?${params.toString()}`, {
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setFit(null);
          return;
        }

        const json = (await res.json()) as {
          hasPersonalFit?: boolean;
          fit?: PersonalGameFit;
          reason?: string;
        };

        if (!cancelled) {
          setFit(json.hasPersonalFit && json.fit ? json.fit : null);
        }
      } catch {
        if (!cancelled) setFit(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [gameSlug, rawgId]);

  if (loading) return <LoadingCard />;
  if (fit) return <PersonalGameFitContent fit={fit} />;
  return <BuildGameDnaCard />;
}
