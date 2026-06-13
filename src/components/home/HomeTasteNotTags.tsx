export default function HomeTasteNotTags() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#070910]/80 px-6 py-20 md:py-28">
      <span className="gp-home-section-blob gp-section-blob-violet" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
            Taste, not tags
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Ping understands why you like games—not just what box they check.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/55">
            Genre filters miss the motivations that actually keep you playing. Ping
            matches on feel, freedom, progression, and the stories you want to tell.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="rounded-3xl border border-white/[0.08] bg-[#0a0d14]/90 p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Tag-based search
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {["RPG", "Open World", "Fantasy"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/45"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4">
                <p className="text-sm font-medium text-white/70">Suggested match</p>
                <p className="mt-1 text-lg font-semibold text-white/90">The Witcher 3</p>
                <p className="mt-2 text-sm text-white/40">
                  Matches tags. May not match why you loved Fallout.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#0a1018]/90 p-6 md:p-8">
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              aria-hidden
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              Ping taste match
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                <p className="text-sm text-white/55">
                  You liked{" "}
                  <span className="font-medium text-white/85">Fallout</span> because of
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li className="flex gap-2">
                    <span className="text-cyan-300/70">—</span>
                    Freedom to approach problems your way
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-300/70">—</span>
                    Meaningful choices with consequences
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-300/70">—</span>
                    Exploration and emergent stories
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                <p className="text-sm font-medium text-white/75">Better-fit direction</p>
                <p className="mt-1 text-lg font-semibold text-white">Games with agency &amp; discovery</p>
                <p className="mt-2 text-sm text-white/50">
                  Picks ranked on motivations—not a single genre label.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
