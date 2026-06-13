import { HOME_DEAL_POINTS } from "@/components/home/home-demo-data";

const DEAL_TONES = ["mint", "violet", "coral"] as const;

export default function HomeDealsSection() {
  return (
    <section className="gp-pastel-section px-5 py-20 md:py-28">
      <div className="gp-pastel-shell mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="gp-pastel-label">Deals &amp; pricing</p>
          <h2 className="gp-pastel-section-title mt-3">
            Find games you&apos;ll like. Then catch them on sale.
          </h2>
          <p className="gp-pastel-section-sub mt-4">
            Discovery comes first. When a pick looks right, Ping shows real prices
            where available—and helps you track the ones you care about.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HOME_DEAL_POINTS.map((point, i) => {
            const tone = DEAL_TONES[i % 3];
            return (
              <div key={point.title} className={`gp-deal-card gp-deal-${tone}`}>
                <h3 className="text-base font-semibold text-white/92">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{point.text}</p>
              </div>
            );
          })}
        </div>

        <div className="gp-pastel-card-muted mt-8 p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/82">Hades</p>
              <p className="mt-1 text-xs text-white/45">Best verified price on game page</p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-white/38 line-through">$24.99</span>
              <span className="text-2xl font-bold tabular-nums text-teal-200">$8.24</span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                −67%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
