import Navbar from "@/components/Navbar";

export default function GamePageLoading() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#05060f]/80 to-[#05060f]" />
        <div className="absolute left-10 top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center gap-2" aria-hidden>
            <div className="gp-game-skeleton-bar h-3.5 w-14 rounded-md" />
            <div className="gp-game-skeleton-bar h-3.5 w-3 rounded-md opacity-40" />
            <div className="gp-game-skeleton-bar h-3.5 w-24 rounded-md" />
          </div>

          <div className="grid gap-10 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="gp-game-skeleton-bar h-3 w-28 rounded-md" />
              <div className="gp-game-skeleton-bar h-12 w-full max-w-2xl rounded-2xl md:h-16" />
              <div className="space-y-3">
                <div className="gp-game-skeleton-bar h-4 w-full max-w-2xl rounded-md" />
                <div className="gp-game-skeleton-bar h-4 w-full max-w-xl rounded-md" />
                <div className="gp-game-skeleton-bar h-4 w-2/3 max-w-lg rounded-md" />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="gp-game-skeleton-bar h-9 w-24 rounded-full" />
                <div className="gp-game-skeleton-bar h-9 w-28 rounded-full" />
                <div className="gp-game-skeleton-bar h-9 w-20 rounded-full" />
              </div>
              <div className="gp-game-skeleton-bar mt-4 h-12 w-44 rounded-full" />
            </div>

            <div className="gp-game-skeleton-bar min-h-[18rem] rounded-3xl border border-white/10 lg:min-h-[22rem]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16" aria-hidden>
        <div className="gp-game-skeleton-bar mb-6 h-8 w-48 rounded-lg" />
        <div className="space-y-3">
          <div className="gp-game-skeleton-bar h-4 w-full rounded-md" />
          <div className="gp-game-skeleton-bar h-4 w-full rounded-md" />
          <div className="gp-game-skeleton-bar h-4 w-5/6 rounded-md" />
        </div>
      </section>
    </main>
  );
}
