import type { PremiumRotationType } from "@/lib/discovery/user-rotation-store";

/**
 * Clean, user-facing "this is a curated, scheduled feature" caption for premium
 * (non-admin) users — shown instead of a Refresh button and the technical admin
 * metadata line. GamePing updates these on a schedule; users don't regenerate.
 */
export default function PremiumUpdateStatus({ type }: { type: PremiumRotationType }) {
  const cadence = type === "monthly_recap" ? "monthly" : "weekly";
  return (
    <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--page-accent-strong)]" />
      Updated {cadence}
    </p>
  );
}
