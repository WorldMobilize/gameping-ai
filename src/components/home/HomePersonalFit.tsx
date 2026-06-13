export default function HomePersonalFit() {
  return (
    <section className="border-y border-white/[0.06] bg-[#070910]/80 px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/75">
            Personal fit
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Is this game right for you?
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-white/50">
            On every game page, GamePing can answer whether a title fits your taste—with
            reasons you may like it and honest concerns before you buy.
          </p>
        </div>

        <div className="gp-home-fit-mock rounded-2xl border border-white/[0.08] bg-[#0a0d14] p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Your personal fit
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">Cyberpunk 2077</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-emerald-300/90">Good fit</p>
              <p className="text-2xl font-semibold tabular-nums text-white">75%</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Why you may like it
              </p>
              <ul className="mt-2.5 space-y-2 text-sm text-white/65">
                {[
                  "Open city exploration at your own pace",
                  "Long-term progression through builds and gear",
                  "Strong atmosphere and world density",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400/80" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Potential concerns
              </p>
              <ul className="mt-2.5 space-y-2 text-sm text-white/55">
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400/70" />
                  Less systemic sandbox freedom than Fallout
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 border-t border-white/[0.06] pt-4 text-[11px] text-white/30">
            Sample preview · connect Steam for your real Gaming DNA
          </p>
        </div>
      </div>
    </section>
  );
}
