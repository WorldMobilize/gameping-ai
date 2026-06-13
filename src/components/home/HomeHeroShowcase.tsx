import Image from "next/image";
import PingOrb from "@/components/home/PingOrb";
import { HOME_HERO_DASHBOARD } from "@/components/home/home-demo-data";

/** Floating product showcase — static mock, no API. */
export default function HomeHeroShowcase() {
  const { tasteScore, traits, playStyle, picks, whySummary } = HOME_HERO_DASHBOARD;

  return (
    <div className="gp-landing-showcase w-full min-w-0">
      <span className="gp-landing-showcase-glow gp-landing-showcase-glow-mint" />
      <span className="gp-landing-showcase-glow gp-landing-showcase-glow-violet" />
      <span className="gp-landing-showcase-glow gp-landing-showcase-glow-coral" />

      <div className="gp-landing-card gp-landing-showcase-card" aria-hidden>
        <div className="flex items-start gap-3">
          <PingOrb size={48} variant="compact" bars={3} className="shrink-0" />
          <div className="gp-landing-speech min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/90">Ping found these for you</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Based on exploration, atmosphere, and meaningful progression.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="gp-landing-stat gp-landing-stat-mint text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/42">
              Taste match
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-teal-100">{tasteScore}%</p>
          </div>
          <div className="gp-landing-stat">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/42">
              Favorite traits
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {traits.map((trait, i) => {
                const tone = [
                  "bg-teal-400/18 text-teal-100",
                  "bg-violet-400/18 text-violet-100",
                  "bg-rose-400/18 text-rose-100",
                ][i % 3];
                return (
                  <span key={trait} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>
                    {trait}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="gp-landing-stat">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/42">
              Play style
            </p>
            <p className="mt-2 text-sm font-semibold leading-snug text-white/85">{playStyle}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {picks.map((pick) => (
            <article key={pick.title} className="gp-landing-cover group">
              <div className="relative aspect-[3/4] w-full bg-[#12182a]">
                <Image
                  src={pick.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="120px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 via-black/45 to-transparent p-2 pt-10">
                  <p className="truncate text-[10px] font-semibold text-white/95">{pick.title}</p>
                  <span className="gp-landing-match-badge mt-1">{pick.match}% match</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="gp-landing-why mt-4">
          <p className="text-xs font-semibold text-white/72">Why you&apos;ll like these</p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{whySummary}</p>
        </div>
      </div>
    </div>
  );
}
