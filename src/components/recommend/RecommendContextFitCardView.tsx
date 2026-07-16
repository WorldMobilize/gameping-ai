import {
  resolveRecommendFitBody,
  sanitizeRecommendFitCopy,
} from "@/lib/recommend-fit-display";
import { recommendMatchTierLabel } from "@/lib/recommend-match-tier";

export type RecommendContextFitData = {
  reason: string;
  matchNote?: string;
  match?: number;
  matchTier?: "best_match" | "good_alternative" | "partial_match";
  concern?: string;
};

type RecommendContextFitCardViewProps = {
  theme?: "dark" | "light";
  density?: "page" | "demo";
  context: RecommendContextFitData;
  transparencyNote?: string;
};

export default function RecommendContextFitCardView({
  theme = "dark",
  density = "page",
  context,
  transparencyNote = "Based on this search — not your saved Taste DNA yet.",
}: RecommendContextFitCardViewProps) {
  const isLight = theme === "light";
  const isDemo = density === "demo";

  const shell = isLight
    ? `rounded-2xl border border-slate-200/90 bg-white shadow-sm ${isDemo ? "p-4" : "p-7 md:p-8"}`
    : `rounded-2xl border border-white/10 bg-white/[0.04] ${isDemo ? "p-4" : "p-7 md:p-8"}`;

  const kicker = isLight
    ? "text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--page-accent-text)]"
    : "text-xs font-semibold uppercase tracking-[0.25em] text-white/70";

  const title = isLight
    ? `font-extrabold tracking-tight text-slate-900 gp-home-display ${isDemo ? "mt-2 text-lg" : "mt-3 text-2xl md:text-3xl"}`
    : `font-black tracking-tight ${isDemo ? "mt-2 text-lg" : "mt-3 text-2xl md:text-3xl"}`;

  const fitNote = sanitizeRecommendFitCopy(context.matchNote);
  const fitBody = resolveRecommendFitBody(context.reason);
  const tierLabel = recommendMatchTierLabel(context.matchTier);

  const badgeTier = isDemo ? "rounded-full px-2.5 py-0.5 text-xs font-semibold" : "rounded-full px-3 py-1 text-xs font-semibold";
  const tierBest = isLight ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200/80" : "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/25";
  const tierAlt = isLight ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80" : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25";
  const tierPartial = isLight ? "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80" : "bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/25";
  const badgeMatch = isLight
    ? "rounded-full bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[color:var(--page-accent-text)] ring-1 ring-[color:var(--page-accent-border)]"
    : "rounded-full bg-[var(--page-accent-soft)] px-3 py-1 text-sm font-bold tabular-nums text-[color:var(--page-accent-strong)] ring-1 ring-[color:var(--page-accent-border)]";

  const body = isLight ? "text-sm leading-6 text-slate-600" : "text-lg leading-8 text-white/70";
  const muted = isLight ? "text-xs text-slate-600" : "text-xs text-white/65";
  const concernTitle = isLight ? "text-sm font-semibold text-slate-800" : "text-sm font-semibold text-white";

  return (
    <div className={shell}>
      <p className={kicker}>From your search</p>
      <h2 className={title}>Why this fits your vibe</h2>

      {(tierLabel || context.match !== undefined) && (
        <div className={`flex flex-wrap items-center gap-2 ${isDemo ? "mt-3" : "mt-5"}`}>
          {tierLabel ? (
            <span
              className={`${badgeTier} ${
                context.matchTier === "best_match"
                  ? tierBest
                  : context.matchTier === "good_alternative"
                    ? tierAlt
                    : tierPartial
              }`}
            >
              {tierLabel}
            </span>
          ) : null}
          {context.match !== undefined ? (
            <span className={badgeMatch}>{context.match}% match</span>
          ) : null}
        </div>
      )}

      {fitNote ? <p className={`mt-3 ${isLight ? "text-sm text-slate-600" : "text-sm text-white/70"}`}>{fitNote}</p> : null}

      <p className={`mt-4 ${body}`}>{fitBody}</p>

      {context.concern ? (
        <>
          <p className={`mt-4 ${concernTitle}`}>Potential concern</p>
          <p className={`mt-1 ${body}`}>{context.concern}</p>
        </>
      ) : null}

      <p className={`mt-4 ${muted}`}>{transparencyNote}</p>
    </div>
  );
}
