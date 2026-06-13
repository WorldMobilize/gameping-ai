import Image from "next/image";
import PingOrb from "@/components/home/PingOrb";
import { HOME_HERO_DASHBOARD } from "@/components/home/home-demo-data";

/** Floating app-preview card — static mock, reference-style layout. */
export default function HomeHeroProductPreview() {
  const { tasteScore, traits, playStyle, picks, whySummary } = HOME_HERO_DASHBOARD;

  return (
    <div className="gp-product-float w-full min-w-0">
      <span className="gp-product-float-glow gp-glow-mint" aria-hidden />
      <span className="gp-product-float-glow gp-glow-violet" aria-hidden />
      <span className="gp-product-float-glow gp-glow-coral" aria-hidden />
      <span className="gp-product-float-glow gp-glow-amber" aria-hidden />

      <div className="gp-product-card" aria-hidden>
        <div className="flex items-start gap-3">
          <PingOrb size={44} variant="compact" bars={3} className="shrink-0" />
          <div className="gp-ping-bubble min-w-0 flex-1 rounded-2xl rounded-tl-md px-4 py-3">
            <p className="text-sm font-medium text-white/88">
              Ping found these for you
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="gp-stat-pill gp-stat-mint rounded-2xl p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">
              Taste match
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-teal-100">{tasteScore}%</p>
          </div>
          <div className="gp-stat-pill rounded-2xl p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">
              Favorite traits
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {traits.map((trait, i) => {
                const tone = ["bg-teal-400/18 text-teal-100", "bg-violet-400/18 text-violet-100", "bg-rose-400/18 text-rose-100"][i % 3];
                return (
                  <span key={trait} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>
                    {trait}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="gp-stat-pill gp-stat-coral rounded-2xl p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">
              Play style
            </p>
            <p className="mt-2 text-sm font-semibold leading-snug text-white/85">{playStyle}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {picks.map((pick) => (
            <article key={pick.title} className="gp-cover-card group relative overflow-hidden rounded-xl">
              <div className="relative aspect-[3/4] w-full bg-[#12182a]">
                <Image
                  src={pick.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="120px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-8">
                  <p className="truncate text-[10px] font-semibold text-white/95">{pick.title}</p>
                  <span className="gp-cover-badge mt-1 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums">
                    {pick.match}% match
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="gp-why-panel mt-4 rounded-2xl p-4">
          <p className="text-xs font-semibold text-white/75">Why you&apos;ll like these</p>
          <p className="mt-2 text-sm leading-relaxed text-white/58">{whySummary}</p>
        </div>
      </div>
    </div>
  );
}
