import { HOME_DEAL_POINTS } from "@/components/home/home-demo-data";

export default function HomeDealsSection() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/75">
            Deals &amp; pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Find games you&apos;ll like. Then catch them on sale.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/50">
            Discovery comes first. When a pick looks right, GamePing shows real prices
            where available—and helps you track the ones you care about.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HOME_DEAL_POINTS.map((point) => (
            <div
              key={point.title}
              className="gp-home-deal-card rounded-2xl border border-white/[0.08] bg-[#0a0d14]/70 p-6"
            >
              <h3 className="text-base font-semibold text-white/90">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{point.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-black/25 p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Hades</p>
              <p className="mt-1 text-xs text-white/40">Best verified price on game page</p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-white/35 line-through">$24.99</span>
              <span className="text-2xl font-semibold tabular-nums text-sky-300">$8.24</span>
              <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-300/90 ring-1 ring-emerald-400/20">
                −67%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
