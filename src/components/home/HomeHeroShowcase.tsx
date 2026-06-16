import Image from "next/image";
import { HOME_HERO_DASHBOARD } from "@/components/home/home-demo-data";

/** Floating discovery card — games-first, no dashboard panels. */
export default function HomeHeroShowcase() {
  const { picks, whySummary, traits } = HOME_HERO_DASHBOARD;

  return (
    <div className="gp-discovery-scene" aria-hidden>
      <span className="gp-discovery-blob gp-discovery-blob-mint" />
      <span className="gp-discovery-blob gp-discovery-blob-violet" />
      <span className="gp-discovery-blob gp-discovery-blob-coral" />
      <span className="gp-discovery-blob gp-discovery-blob-amber" />

      <span className="gp-discovery-spark gp-discovery-spark-a" />
      <span className="gp-discovery-spark gp-discovery-spark-b" />

      <div className="gp-discovery-float">
        <div className="gp-discovery-card">
          <header className="gp-discovery-header">
            <p className="text-lg font-semibold tracking-tight text-white/92">
              Ping found these for you
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {traits.map((trait, i) => {
                const tone = [
                  "bg-teal-400/20 text-teal-100",
                  "bg-violet-400/18 text-violet-100",
                  "bg-rose-400/18 text-rose-100",
                ][i % 3];
                return (
                  <span key={trait} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone}`}>
                    {trait}
                  </span>
                );
              })}
            </div>
          </header>

          <div className="gp-discovery-covers mt-6">
            {picks.map((pick, i) => (
              <article
                key={pick.title}
                className="gp-discovery-cover group"
                style={{ ["--cover-i" as string]: i }}
              >
                <div className="relative aspect-[3/4] w-[132px] shrink-0 sm:w-[148px]">
                  <Image
                    src={pick.image}
                    alt=""
                    fill
                    sizes="148px"
                    className="rounded-[1.125rem] object-cover shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] transition duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1"
                    priority={i < 2}
                  />
                  <span className="gp-discovery-match">{pick.match}% match</span>
                </div>
                <p className="mt-2 max-w-[132px] truncate text-center text-xs font-medium text-white/78 sm:max-w-[148px]">
                  {pick.title}
                </p>
              </article>
            ))}
          </div>

          <p className="gp-discovery-why mt-7 text-sm leading-relaxed text-white/52">
            <span className="font-medium text-white/72">Why we recommend this — </span>
            {whySummary}
          </p>
        </div>
      </div>
    </div>
  );
}
