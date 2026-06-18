export default function DiscoveryComingSoonBadge({
  variant = "public",
}: {
  variant?: "public" | "premium";
}) {
  const isPremium = variant === "premium";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
        isPremium
          ? "border-amber-200/90 bg-amber-50 text-amber-800"
          : "border-violet-200/90 bg-violet-50 text-violet-700"
      }`}
    >
      {isPremium ? "Coming soon for Premium" : "Coming soon"}
    </span>
  );
}
