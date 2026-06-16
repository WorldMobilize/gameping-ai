import { recommendMatchTierLabel } from "@/lib/recommend-match-tier";
import {
  resolveRecommendFitBody,
  sanitizeRecommendFitCopy,
} from "@/lib/recommend-fit-display";
import type { RefObject } from "react";
import {
  recommendResultCardStyles,
  type RecommendCardDensity,
  type RecommendCardTheme,
} from "@/components/recommend/recommend-result-card-styles";

export type RecommendResultCardGame = {
  title: string;
  match: number;
  reason: string;
  image?: string | null;
  matchTier?: "best_match" | "good_alternative" | "partial_match";
  matchNote?: string;
  budgetNote?: string | null;
  imagePosition?: string;
};

type RecommendResultCardViewProps = {
  rank: number;
  game: RecommendResultCardGame;
  budgetLine?: string | null;
  imageSrc?: string | null;
  imageCacheKey?: string;
  density?: RecommendCardDensity;
  theme?: RecommendCardTheme;
  showViewDetails?: boolean;
  fitMetaLine?: string | null;
  viewDetailsRef?: RefObject<HTMLButtonElement | null>;
  highlightDetails?: boolean;
  clickPulse?: boolean;
};

/** Outer shell — matches /recommend result card styling. */
export const RECOMMEND_RESULT_CARD_SHELL =
  "relative flex w-full flex-col overflow-hidden rounded-2xl border bg-[#0a0b14]/50";

export function recommendResultCardShellClass(emphasizeCyanBorder: boolean) {
  return emphasizeCyanBorder
    ? `${RECOMMEND_RESULT_CARD_SHELL} border-cyan-400/25`
    : `${RECOMMEND_RESULT_CARD_SHELL} border-white/10`;
}

export default function RecommendResultCardView({
  rank,
  game,
  budgetLine = null,
  imageSrc,
  imageCacheKey,
  density = "page",
  theme = "dark",
  showViewDetails = false,
  fitMetaLine: fitMetaLineProp,
  viewDetailsRef,
  highlightDetails = false,
  clickPulse = false,
}: RecommendResultCardViewProps) {
  const isExport = density === "export";
  const fitNote = sanitizeRecommendFitCopy(game.matchNote);
  const fitBody = resolveRecommendFitBody(game.reason);
  const resolvedImage = imageSrc ?? game.image ?? null;
  const s = recommendResultCardStyles(theme, density, isExport);
  const shellClass = isExport ? recommendResultCardShellClass(true) : s.shell;

  const tierLabel = recommendMatchTierLabel(game.matchTier);

  const defaultFitMeta =
    "Mood, pacing, and mechanics from this recommendation search — not a saved taste profile yet.";
  const resolvedFitMeta =
    fitMetaLineProp === undefined ? defaultFitMeta : fitMetaLineProp;

  return (
    <div className={shellClass}>
      {resolvedImage ? (
        <div className={s.imageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={imageCacheKey ?? resolvedImage}
            src={resolvedImage}
            alt={game.title}
            crossOrigin={imageSrc ? "anonymous" : undefined}
            decoding={imageSrc ? "sync" : undefined}
            data-export-image={game.image ?? ""}
            className="h-full w-full object-cover"
            style={{ objectPosition: game.imagePosition ?? "center center" }}
          />
        </div>
      ) : (
        <div
          className={`flex w-full items-center justify-center ${s.placeholderBg} ${s.placeholderText} ${s.imagePlaceholder}`}
        >
          No image available
        </div>
      )}

      <div className={s.bodyPad}>
        <div className="mb-3">
          <span className={s.rank}>#{rank}</span>
        </div>

        <h2 className={s.title}>{game.title}</h2>

        {fitNote ? <p className={s.fitNote}>{fitNote}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {game.matchTier === "good_alternative" && (
            <span className={`${s.badgeTier} ${s.tierAlt}`}>Good alternative</span>
          )}
          {game.matchTier === "partial_match" && (
            <span className={`${s.badgeTier} ${s.tierPartial}`}>Partial match</span>
          )}
          {game.matchTier === "best_match" && (
            <span className={`${s.badgeTier} ${s.tierBest}`}>Best match</span>
          )}
          {!game.matchTier && tierLabel ? (
            <span className={`${s.badgeTier} ${s.tierBest}`}>{tierLabel}</span>
          ) : null}
          <span className={s.badgeMatch}>{game.match}% match</span>
        </div>

        {budgetLine ? <p className={s.budget}>{budgetLine}</p> : null}

        <div className="mt-4 flex flex-1 flex-col">
          <p className={s.whyLabel}>Why it fits</p>
          <p className={s.whyBody}>{fitBody}</p>
          {resolvedFitMeta ? <p className={s.whyMeta}>{resolvedFitMeta}</p> : null}
        </div>

        {showViewDetails ? (
          <div className={s.ctaDivider}>
            <button
              ref={viewDetailsRef}
              type="button"
              tabIndex={-1}
              className={`${s.cta} transition ${highlightDetails ? "ring-2 ring-cyan-400/55" : ""} ${clickPulse ? "scale-[0.97] opacity-90" : ""}`}
            >
              View details
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
