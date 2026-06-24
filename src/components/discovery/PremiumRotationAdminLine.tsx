import type { PremiumRotationMeta } from "@/lib/discovery/user-rotation-store";

/**
 * Subtle admin-only metadata line for the personalized premium pages — mirrors
 * the meta line on /hidden-gems and /games-of-the-week. Shows which cached
 * rotation is being rendered (period, status, source, AI usage, staleness) so an
 * admin can verify generation before the feature is public. Renders nothing for
 * non-admins.
 */
export default function PremiumRotationAdminLine({
  viewer,
  meta,
  aiUsed,
}: {
  viewer: "admin" | "premium" | "free" | "anon";
  meta: PremiumRotationMeta | null;
  aiUsed?: boolean;
}) {
  if (viewer !== "admin" || !meta) return null;

  const parts = [
    `period ${meta.periodKey}`,
    meta.status,
    meta.stale ? "stale fallback" : "current",
    aiUsed ? "ai" : "deterministic",
  ];
  if (meta.sourceSummary?.sources?.length) {
    parts.push(meta.sourceSummary.sources.join("+"));
  }

  return (
    <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      Admin · {parts.join(" · ")}
    </p>
  );
}
