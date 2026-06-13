import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";

export default function HomePersonalFit() {
  return (
    <section className="gp-landing-section" aria-labelledby="home-fit-heading">
      <HomePageAtmosphere variant="section" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-shell grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="gp-landing-kicker">Personal fit</p>
            <h2 id="home-fit-heading" className="gp-landing-h2 mt-3">
              Is this game right for you?
            </h2>
            <p className="gp-landing-body mt-4 max-w-md">
              On every game page, Ping can answer whether a title fits your taste—with
              reasons you may like it and honest concerns before you buy.
            </p>
          </div>

          <div className="gp-landing-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/38">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-white/42">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-white/42">
                  Potential concerns
                </p>
                <ul className="mt-2.5 space-y-2 text-sm text-white/55">
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
      </div>
    </section>
  );
}
