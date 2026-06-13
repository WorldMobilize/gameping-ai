export default function HomePersonalFit() {
  return (
    <section className="gp-pastel-section px-5 py-20 md:py-28">
      <div className="gp-pastel-shell mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="gp-pastel-label">Personal fit</p>
          <h2 className="gp-pastel-section-title mt-3">Is this game right for you?</h2>
          <p className="gp-pastel-section-sub mt-4 max-w-md">
            On every game page, Ping can answer whether a title fits your taste—with
            reasons you may like it and honest concerns before you buy.
          </p>
        </div>

        <div className="gp-home-fit-mock gp-pastel-card-muted p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Your personal fit
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">Cyberpunk 2077</h3>
            </div>
            <div className="rounded-2xl bg-teal-400/12 px-3 py-2 text-right">
              <p className="text-xs font-medium text-teal-100">Good fit</p>
              <p className="text-2xl font-bold tabular-nums text-white">75%</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                Why you may like it
              </p>
              <ul className="mt-2.5 space-y-2 text-sm text-white/68">
                {[
                  "Open city exploration at your own pace",
                  "Long-term progression through builds and gear",
                  "Strong atmosphere and world density",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="text-teal-300">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                Potential concerns
              </p>
              <ul className="mt-2.5 space-y-2 text-sm text-white/58">
                <li className="flex gap-2.5">
                  <span className="text-amber-300">✦</span>
                  Less systemic sandbox freedom than Fallout
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 border-t border-white/[0.06] pt-4 text-[11px] text-white/35">
            Sample preview · connect Steam for your real Gaming DNA
          </p>
        </div>
      </div>
    </section>
  );
}
