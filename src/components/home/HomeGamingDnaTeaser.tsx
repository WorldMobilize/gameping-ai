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
    <section className="gp-pastel-section px-5 py-20 md:py-28" aria-labelledby="home-gaming-dna-heading">
      <div className="gp-pastel-shell mx-auto max-w-6xl overflow-hidden lg:grid lg:grid-cols-2">
        <div className="p-8 md:p-12 lg:p-14">
          <p className="gp-pastel-label">Gaming DNA</p>
          <h2 id="home-gaming-dna-heading" className="gp-pastel-section-title mt-3">
            Build your Gaming DNA
          </h2>
          <p className="gp-pastel-section-sub mt-4 max-w-md">
            Connect your Steam library and Ping learns the patterns behind your
            favorite games—motivations and play style, not just genre tags.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/58">
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
          <Link href="/settings/account#steam-library-import" className="gp-pastel-btn-outline mt-8">
            Connect Steam library
          </Link>
        </div>

        <div className="relative border-t border-white/[0.06] p-8 md:p-10 lg:border-l lg:border-t-0">
          <PingOrb size={72} variant="compact" className="absolute right-6 top-6 opacity-90 md:right-8 md:top-8" bars={3} />
          <div className="gp-home-dna-mock relative mx-auto max-w-md space-y-4">
            <div className="gp-pastel-card-muted p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Player archetype
              </p>
              <p className="mt-2 text-xl font-semibold text-white/92">The Sandbox Explorer</p>
              <p className="mt-2 text-sm leading-6 text-white/52">
                You gravitate toward worlds where freedom, systems, and long-term
                progression shape the story you tell.
              </p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Signals
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {DNA_SIGNALS.map((signal, i) => {
                  const tone = ["bg-teal-400/12 text-teal-100", "bg-violet-400/12 text-violet-100", "bg-rose-400/12 text-rose-100", "bg-amber-400/12 text-amber-100"][i];
                  return (
                    <div key={signal} className={`rounded-xl px-3 py-2.5 text-xs font-medium ${tone}`}>
                      {signal}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-[11px] text-white/35">
              Illustrative preview · import your library to generate yours
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
