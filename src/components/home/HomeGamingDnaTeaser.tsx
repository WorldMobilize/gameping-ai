import Link from "next/link";

export default function HomeGamingDnaTeaser() {
  return (
    <section className="px-6 py-20 md:py-28" aria-labelledby="home-gaming-dna-heading">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b12] lg:grid-cols-2 lg:gap-0">
          <div className="p-8 md:p-12 lg:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
              Gaming DNA
            </p>
            <h2
              id="home-gaming-dna-heading"
              className="mt-3 text-3xl font-bold tracking-tight md:text-4xl"
            >
              Your library, translated into taste
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-white/50">
              Connect Steam and GamePing builds a motivation-level profile—player
              freedom, progression, sandbox systems—not just genre tags.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/55">
              <li className="flex gap-2">
                <span className="text-cyan-400/80" aria-hidden>
                  ·
                </span>
                Personal fit on every game page
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400/80" aria-hidden>
                  ·
                </span>
                Playtime-weighted taste signals
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400/80" aria-hidden>
                  ·
                </span>
                Search recommendations coming next
              </li>
            </ul>
            <Link
              href="/settings/account#steam-library-import"
              className="mt-8 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/45 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
            >
              Connect Steam library
            </Link>
          </div>

          <div className="relative border-t border-white/[0.06] bg-[#06070d] p-8 md:p-10 lg:border-l lg:border-t-0">
            <div className="gp-home-dna-mock space-y-4">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Player archetype
                </p>
                <p className="mt-1 text-lg font-semibold text-white/90">
                  The Sandbox Explorer
                </p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  You prefer games where freedom and long-term progression shape the
                  story you tell.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Player freedom", "Sandbox systems", "Survival loops", "Story choices"].map(
                  (trait) => (
                    <div
                      key={trait}
                      className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5 text-xs font-medium text-white/55"
                    >
                      {trait}
                    </div>
                  )
                )}
              </div>
              <p className="text-center text-[11px] text-white/30">
                Illustrative preview · import your library to generate yours
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
