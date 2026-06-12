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
    return "rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200";
  }
  if (tier === "good_fit" || tier === "different_but_worth_trying") {
    return "rounded-full bg-amber-500/25 px-3 py-1 text-xs font-bold text-amber-200";
  }
  if (tier === "partial_fit") {
    return "rounded-full bg-orange-500/25 px-3 py-1 text-xs font-bold text-orange-200";
  }
  return "rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/55";
}

function PersonalGameFitContent({ fit }: { fit: PersonalGameFit }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
      <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Personal fit</p>
      <h2 className="mt-4 text-3xl font-black">Is this game right for you?</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={fitTierClassName(fit.fitTier)}>{fitTierLabel(fit.fitTier)}</span>
        {fit.fitTier !== "owned" ? (
          <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
            {fit.fitScore}% match
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-lg leading-8 text-white/75">{fit.headline}</p>

      {fit.whyYouMayLike.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-bold text-white/80">Why you may like it:</p>
          <ul className="mt-3 space-y-2 text-base leading-7 text-white/70">
            {fit.whyYouMayLike.map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {fit.potentialConcerns.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm font-bold text-white/80">Potential concerns:</p>
          <ul className="mt-3 space-y-2 text-base leading-7 text-white/65">
            {fit.potentialConcerns.map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-white/35">
        Based on your imported Steam Taste DNA. Recommendations do not use Taste DNA yet.
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 animate-pulse motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Loading personal game fit"
    >
      <div className="h-4 w-28 rounded bg-white/10" />
      <div className="mt-6 h-9 w-72 max-w-full rounded bg-white/10" />
      <div className="mt-5 h-24 max-w-2xl rounded bg-white/[0.06]" />
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
