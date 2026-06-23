export default function DiscoveryComingSoonBadge({
  variant = "public",
}: {
  variant?: "public" | "premium";
}) {
  const isPremium = variant === "premium";

  // Follows the current page accent (set via --page-accent-* per route).
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--page-accent-strong)]">
      {isPremium ? "Coming soon for Premium" : "Coming soon"}
    </span>
  );
}
