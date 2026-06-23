import AppPageShell from "@/components/app/AppPageShell";

export default function GamePageLoading() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative">
        {/* Fixed cinematic Games background — matches the loaded page. */}
        <div aria-hidden className="gp-games-bg" />
        <div className="relative z-10">
          <section className="relative overflow-hidden pb-10">
            <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[var(--page-accent-soft)] blur-3xl" />

            <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
              <div className="flex flex-wrap items-center gap-2" aria-hidden>
                <div className="h-3.5 w-14 rounded-md bg-white/10" />
                <div className="h-3.5 w-3 rounded-md bg-white/10 opacity-40" />
                <div className="h-3.5 w-24 rounded-md bg-white/10" />
              </div>

              <div className="grid gap-10 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                  <div className="h-3 w-28 rounded-md bg-white/10" />
                  <div className="h-12 w-full max-w-2xl rounded-2xl bg-white/10 md:h-16" />
                  <div className="space-y-3">
                    <div className="h-4 w-full max-w-2xl rounded-md bg-white/10" />
                    <div className="h-4 w-full max-w-xl rounded-md bg-white/10" />
                    <div className="h-4 w-2/3 max-w-lg rounded-md bg-white/10" />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="h-9 w-24 rounded-full bg-white/10" />
                    <div className="h-9 w-28 rounded-full bg-white/10" />
                    <div className="h-9 w-20 rounded-full bg-white/10" />
                  </div>
                  <div className="mt-4 h-12 w-44 rounded-full bg-white/10" />
                </div>

                <div className="min-h-[18rem] rounded-3xl border border-white/10 bg-white/[0.04] lg:min-h-[22rem]" />
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-16" aria-hidden>
            <div className="mb-6 h-8 w-48 rounded-lg bg-white/10" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-md bg-white/10" />
              <div className="h-4 w-full rounded-md bg-white/10" />
              <div className="h-4 w-5/6 rounded-md bg-white/10" />
            </div>
          </section>
        </div>
      </div>
    </AppPageShell>
  );
}
