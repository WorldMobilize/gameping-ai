/**
 * Subtle public line describing how fresh the cached rotation is — e.g.
 * "Updated weekly · Last refreshed 2026-06-22". Shows no admin/internal details.
 * Rendered only when a real Supabase rotation is present (null on static
 * fallback). Structurally matches `RotationMeta` from rotation-store (server-
 * only), so it can be passed straight through from the page.
 */
export type DiscoveryRotationMetaData = {
  periodKey: string;
  status: "draft" | "published" | "failed";
  generatedAt: string | null;
  publishedAt: string | null;
  sourceSummary: {
    source: string;
    generator?: string;
    featuredCount?: number;
    itemCount: number;
    note?: string;
  } | null;
  stale: boolean;
};

/** ISO timestamp → "YYYY-MM-DD" (no locale; hydration-safe). */
function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export default function DiscoveryRotationMeta({
  meta,
}: {
  meta?: DiscoveryRotationMetaData;
}) {
  if (!meta) return null;

  // Weekly rotations use an ISO-week period key (e.g. "2026-W26"); monthly ones
  // use "2026-06". Adapt the cadence label accordingly.
  const cadence = /\d-?w\d/i.test(meta.periodKey) ? "Updated weekly" : "Updated monthly";
  const refreshed = fmtDate(meta.publishedAt ?? meta.generatedAt);

  const parts: string[] = [cadence];
  if (refreshed) parts.push(`Last refreshed ${refreshed}`);

  return (
    <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400/90">
      {parts.join(" · ")}
    </p>
  );
}
