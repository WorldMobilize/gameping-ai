export type RecommendResultsHeaderProps = {
  theme?: "dark" | "light";
};

export default function RecommendResultsHeader({ theme = "dark" }: RecommendResultsHeaderProps) {
  const isLight = theme === "light";

  const kicker = isLight
    ? "text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
    : "text-xs font-semibold uppercase tracking-[0.3em] text-white/70";

  const title = isLight
    ? "mt-3 text-3xl font-black tracking-tight text-slate-900"
    : "mt-3 text-3xl font-black tracking-tight";

  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className={kicker}>Your picks</p>
        <h2 className={title}>Curated for your search</h2>
      </div>
    </div>
  );
}
