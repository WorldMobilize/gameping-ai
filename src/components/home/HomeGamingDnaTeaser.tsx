import Link from "next/link";
import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";
import PingOrb from "@/components/home/PingOrb";

const DNA_SIGNALS = [
  "Player freedom",
  "Emergent systems",
  "Survival progression",
  "Immersive worlds",
];

export default function HomeGamingDnaTeaser() {
  return (
    <section className="gp-landing-section" aria-labelledby="home-gaming-dna-heading">
      <HomePageAtmosphere variant="section" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-shell overflow-hidden lg:grid lg:grid-cols-2 lg:gap-0">
          <div className="p-1 md:p-2 lg:pr-10">
            <p className="gp-landing-kicker">Gaming DNA</p>
            <h2 id="home-gaming-dna-heading" className="gp-landing-h2 mt-3">
              Build your Gaming DNA
            </h2>
            <p className="gp-landing-body mt-4 max-w-md">
              Connect your Steam library and Ping learns the patterns behind your
              favorite games—motivations and play style, not just genre tags.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/75">
              {[
                { text: "Personal fit on game pages", dot: "bg-teal-400" },
                { text: "Playtime-weighted taste signals", dot: "bg-violet-400" },
                { text: "Search recommendations coming next", dot: "bg-amber-400" },
              ].map((item) => (
                <li key={item.text} className="flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot} opacity-70`} aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
            <Link
              href="/settings/account#steam-library-import"
              className="gp-landing-btn-ghost mt-8 inline-flex"
            >
              Connect Steam library
            </Link>
          </div>

          <div className="relative mt-10 border-t border-white/[0.06] pt-10 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-2">
            <PingOrb size={64} variant="compact" className="absolute right-0 top-0 opacity-90" bars={3} />
            <div className="relative mx-auto max-w-md space-y-4">
              <div className="gp-landing-panel">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  Player archetype
                </p>
                <p className="mt-2 text-xl font-semibold text-white/92">The Sandbox Explorer</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  You gravitate toward worlds where freedom, systems, and long-term
                  progression shape the story you tell.
                </p>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  Signals
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {DNA_SIGNALS.map((signal, i) => {
                    const tone = [
                      "bg-teal-400/12 text-teal-100",
                      "bg-violet-400/12 text-violet-100",
                      "bg-rose-400/12 text-rose-100",
                      "bg-amber-400/12 text-amber-100",
                    ][i];
                    return (
                      <div key={signal} className={`rounded-xl px-3 py-2.5 text-xs font-medium ${tone}`}>
                        {signal}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-center text-[11px] text-white/65">
                Illustrative preview · import your library to generate yours
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
