import { HOME_DEAL_POINTS } from "@/components/home/home-demo-data";
import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";

const DEAL_TONES = ["mint", "violet", "coral"] as const;

export default function HomeDealsSection() {
  return (
    <section className="gp-landing-section" aria-labelledby="home-deals-heading">
      <HomePageAtmosphere variant="section" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-shell">
          <div className="max-w-2xl">
            <p className="gp-landing-kicker">Deals &amp; pricing</p>
            <h2 id="home-deals-heading" className="gp-landing-h2 mt-3">
              Find games you&apos;ll like. Then catch them on sale.
            </h2>
            <p className="gp-landing-body mt-4">
              Discovery comes first. When a pick looks right, Ping shows real prices
              where available—and helps you track the ones you care about.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {HOME_DEAL_POINTS.map((point, i) => {
              const tone = DEAL_TONES[i % 3];
              return (
                <div key={point.title} className={`gp-landing-deal gp-landing-deal-${tone}`}>
                  <h3 className="text-base font-semibold text-white/92">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/52">{point.text}</p>
                </div>
              );
            })}
          </div>

          <div className="gp-landing-panel mt-6 p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/82">Hades</p>
                <p className="mt-1 text-xs text-white/42">Best verified price on game page</p>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-white/36 line-through">$24.99</span>
                <span className="text-2xl font-bold tabular-nums text-teal-200">$8.24</span>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  −67%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
