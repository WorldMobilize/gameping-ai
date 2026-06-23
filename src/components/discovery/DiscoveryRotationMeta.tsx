/**
 * Subtle, admin-only line describing which cached rotation is being shown.
 * Rendered inside AdminOnlyPageGate, so it is never visible to non-admins.
 * Structurally matches `RotationMeta` from rotation-store (server-only), so it
 * can be passed straight through from the page without importing server code.
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

/** ISO timestamp → deterministic "YYYY-MM-DD HH:mm UTC" (no locale; hydration-safe). */
function fmt(iso: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

export default function DiscoveryRotationMeta({
  meta,
}: {
  meta?: DiscoveryRotationMetaData;
}) {
  if (!meta) return null;

  const generated = fmt(meta.generatedAt);
  const parts: string[] = [`Period ${meta.periodKey}`];
  if (generated) parts.push(`generated ${generated}`);
  if (meta.sourceSummary) {
    parts.push(`${meta.sourceSummary.itemCount} picks · ${meta.sourceSummary.source}`);
  }
  if (meta.stale) parts.push("showing latest published (fallback)");

  return (
    <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400/90">
      <span className="text-[color:var(--page-accent-text)]">Admin · cached rotation</span>
      {" — "}
      {parts.join(" · ")}
    </p>
  );
}
