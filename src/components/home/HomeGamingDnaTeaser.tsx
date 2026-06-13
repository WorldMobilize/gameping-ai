import Link from "next/link";
import PingOrb from "@/components/home/PingOrb";

const DNA_SIGNALS = [
  "Player freedom",
  "Emergent systems",
  "Survival progression",
  "Immersive worlds",
];

export default function HomeGamingDnaTeaser() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28" aria-labelledby="home-gaming-dna-heading">
      <span className="gp-home-section-blob gp-section-blob-coral" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0a0d14] lg:grid-cols-2">
          <div className="p-8 md:p-12 lg:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              Gaming DNA
            </p>
            <h2
              id="home-gaming-dna-heading"
              className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Build your Gaming DNA
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-white/55">
              Connect your Steam library and Ping learns the patterns behind your
              favorite games—motivations and play style, not just genre tags.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/55">
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/80" aria-hidden />
                Personal fit on game pages
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/80" aria-hidden />
                Playtime-weighted taste signals
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/80" aria-hidden />
                Search recommendations coming next
              </li>
            </ul>
            <Link
              href="/settings/account#steam-library-import"
              className="mt-8 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/45 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
            >
              Connect Steam library
            </Link>
          </div>

          <div className="relative overflow-hidden border-t border-white/[0.06] bg-[#06080f] p-8 md:p-10 lg:border-l lg:border-t-0">
            <PingOrb size={96} className="absolute right-6 top-6 opacity-80 md:right-8 md:top-8" />
            <div className="gp-home-dna-mock relative mx-auto max-w-md space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Player archetype
                </p>
                <p className="mt-2 text-xl font-semibold text-white/92">
                  The Sandbox Explorer
                </p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  You gravitate toward worlds where freedom, systems, and long-term
                  progression shape the story you tell.
                </p>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Signals
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {DNA_SIGNALS.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2.5 text-xs font-medium text-white/60"
                    >
                      {signal}
                    </div>
                  ))}
                </div>
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
