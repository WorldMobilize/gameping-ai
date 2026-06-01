import { recommendMatchTierLabel } from "@/lib/recommend-match-tier"
import {
  resolveRecommendFitBody,
  sanitizeRecommendFitCopy,
} from "@/lib/recommend-fit-display"

export type RecommendResultCardGame = {
  title: string
  match: number
  reason: string
  image?: string | null
  matchTier?: "best_match" | "good_alternative" | "partial_match"
  matchNote?: string
  budgetNote?: string | null
}

type RecommendResultCardViewProps = {
  rank: number
  game: RecommendResultCardGame
  /** Resolved budget/price line (same logic as /recommend). */
  budgetLine?: string | null
  /** When set (social export), use proxied URL instead of game.image. */
  imageSrc?: string | null
  imageCacheKey?: string
  /** Slightly larger type/spacing for 1080px export while keeping the same layout. */
  density?: "page" | "export"
  showViewDetails?: boolean
  /** Override muted line under “why” (export uses shorter social copy). */
  fitMetaLine?: string | null
}

/** Outer shell — matches /recommend result card (cyan accent border for export fidelity). */
export const RECOMMEND_RESULT_CARD_SHELL =
  "relative flex w-full flex-col overflow-hidden rounded-3xl border bg-white/[0.04] shadow-[0_0_30px_rgba(168,85,247,0.12)]"

export function recommendResultCardShellClass(emphasizeCyanBorder: boolean) {
  return emphasizeCyanBorder
    ? `${RECOMMEND_RESULT_CARD_SHELL} border-cyan-400/40`
    : `${RECOMMEND_RESULT_CARD_SHELL} border-white/10`
}

export default function RecommendResultCardView({
  rank,
  game,
  budgetLine = null,
  imageSrc,
  imageCacheKey,
  density = "page",
  showViewDetails = false,
  fitMetaLine: fitMetaLineProp,
}: RecommendResultCardViewProps) {
  const isExport = density === "export"
  const fitNote = sanitizeRecommendFitCopy(game.matchNote)
  const fitBody = resolveRecommendFitBody(game.reason)
  const resolvedImage = imageSrc ?? game.image ?? null
  const shellClass = recommendResultCardShellClass(isExport)

  const imageWrapClass = isExport
    ? "h-[300px] w-full overflow-hidden bg-black/40"
    : "h-48 w-full overflow-hidden bg-black/40"

  const bodyPadClass = isExport ? "flex flex-1 flex-col p-8" : "flex flex-1 flex-col p-6"

  const rankClass = isExport
    ? "rounded-full bg-cyan-400 px-4 py-1.5 text-sm font-black text-black"
    : "rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black"

  const titleClass = isExport ? "text-4xl font-black leading-tight" : "text-2xl font-black"

  const fitNoteClass = isExport
    ? "mt-3 text-base leading-6 text-white/50"
    : "mt-2 text-xs leading-5 text-white/50"

  const badgeTierClass = isExport
    ? "rounded-full px-4 py-1.5 text-sm font-bold"
    : "rounded-full px-3 py-1 text-xs font-bold"

  const badgeMatchClass = isExport
    ? "rounded-full bg-purple-500/20 px-4 py-1.5 text-base font-bold text-purple-300"
    : "rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300"

  const budgetClass = isExport ? "mt-4 text-sm text-white/45" : "mt-3 text-xs text-white/45"

  const whyLabelClass = isExport
    ? "text-sm font-bold uppercase tracking-[0.2em] text-white/40"
    : "text-xs font-bold uppercase tracking-[0.2em] text-white/40"

  const whyBodyClass = isExport
    ? "mt-3 text-lg leading-8 text-white/70"
    : "mt-2 text-sm leading-6 text-white/70"

  const whyMetaClass = isExport ? "mt-3 text-sm text-white/40" : "mt-2 text-xs text-white/40"

  const ctaClass = isExport
    ? "inline-flex rounded-full bg-cyan-400/90 px-6 py-3.5 text-base font-bold text-black"
    : "inline-flex rounded-full bg-cyan-400/90 px-5 py-3 text-sm font-bold text-black"

  const tierLabel = recommendMatchTierLabel(game.matchTier)

  const defaultFitMeta =
    "Mood, pacing, and mechanics from this recommendation search — not a saved taste profile yet."
  const resolvedFitMeta =
    fitMetaLineProp === undefined ? defaultFitMeta : fitMetaLineProp

  return (
    <div className={shellClass}>
      {resolvedImage ? (
        <div className={imageWrapClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={imageCacheKey ?? resolvedImage}
            src={resolvedImage}
            alt={game.title}
            crossOrigin={imageSrc ? "anonymous" : undefined}
            decoding={imageSrc ? "sync" : undefined}
            data-export-image={game.image ?? ""}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`flex w-full items-center justify-center bg-black/40 text-white/40 ${
            isExport ? "h-[300px] text-lg" : "h-48"
          }`}
        >
          No image available
        </div>
      )}

      <div className={bodyPadClass}>
        <div className="mb-3">
          <span className={rankClass}>#{rank}</span>
        </div>

        <h2 className={titleClass}>{game.title}</h2>

        {fitNote ? <p className={fitNoteClass}>{fitNote}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {game.matchTier === "good_alternative" && (
            <span className={`${badgeTierClass} bg-amber-500/25 text-amber-200`}>
              Good alternative
            </span>
          )}
          {game.matchTier === "partial_match" && (
            <span className={`${badgeTierClass} bg-orange-500/25 text-orange-200`}>
              Partial match
            </span>
          )}
          {game.matchTier === "best_match" && (
            <span className={`${badgeTierClass} bg-emerald-500/20 text-emerald-200`}>
              Best match
            </span>
          )}
          {!game.matchTier && tierLabel ? (
            <span className={`${badgeTierClass} bg-emerald-500/20 text-emerald-200`}>
              {tierLabel}
            </span>
          ) : null}
          <span className={badgeMatchClass}>{game.match}% match</span>
        </div>

        {budgetLine ? <p className={budgetClass}>{budgetLine}</p> : null}

        <div className="mt-4 flex flex-1 flex-col">
          <p className={whyLabelClass}>Why it fits your search</p>
          <p className={whyBodyClass}>{fitBody}</p>
          {resolvedFitMeta ? (
            <p className={whyMetaClass}>{resolvedFitMeta}</p>
          ) : null}
        </div>

        {showViewDetails ? (
          <div className="mt-auto border-t border-white/10 pt-5">
            <span className={ctaClass}>View details</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
