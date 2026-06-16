import AppPageShell from "@/components/app/AppPageShell";

export default function GamePageLoading() {
  return (
    <AppPageShell>
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-cyan-50/40 via-white to-white pb-10">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center gap-2" aria-hidden>
            <div className="gp-game-skeleton-bar-light h-3.5 w-14 rounded-md" />
            <div className="gp-game-skeleton-bar-light h-3.5 w-3 rounded-md opacity-40" />
            <div className="gp-game-skeleton-bar-light h-3.5 w-24 rounded-md" />
          </div>

          <div className="grid gap-10 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="gp-game-skeleton-bar-light h-3 w-28 rounded-md" />
              <div className="gp-game-skeleton-bar-light h-12 w-full max-w-2xl rounded-2xl md:h-16" />
              <div className="space-y-3">
                <div className="gp-game-skeleton-bar-light h-4 w-full max-w-2xl rounded-md" />
                <div className="gp-game-skeleton-bar-light h-4 w-full max-w-xl rounded-md" />
                <div className="gp-game-skeleton-bar-light h-4 w-2/3 max-w-lg rounded-md" />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="gp-game-skeleton-bar-light h-9 w-24 rounded-full" />
                <div className="gp-game-skeleton-bar-light h-9 w-28 rounded-full" />
                <div className="gp-game-skeleton-bar-light h-9 w-20 rounded-full" />
              </div>
              <div className="gp-game-skeleton-bar-light mt-4 h-12 w-44 rounded-full" />
            </div>

            <div className="gp-game-skeleton-bar-light min-h-[18rem] rounded-3xl border border-slate-200/90 lg:min-h-[22rem]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16" aria-hidden>
        <div className="gp-game-skeleton-bar-light mb-6 h-8 w-48 rounded-lg" />
        <div className="space-y-3">
          <div className="gp-game-skeleton-bar-light h-4 w-full rounded-md" />
          <div className="gp-game-skeleton-bar-light h-4 w-full rounded-md" />
          <div className="gp-game-skeleton-bar-light h-4 w-5/6 rounded-md" />
        </div>
      </section>
    </AppPageShell>
  );
}
