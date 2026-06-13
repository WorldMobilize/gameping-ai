import { HOME_FEATURES } from "@/components/home/home-demo-data";

export default function HomeHowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            From vibe to verified picks in three steps
          </h2>
          <p className="mt-4 text-base leading-7 text-white/50">
            Less endless scrolling, more clarity. GamePing focuses on why a game fits
            you—not just what&apos;s trending.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3 md:gap-5">
          {HOME_FEATURES.map((feature, index) => (
            <li
              key={feature.step}
              className="gp-home-feature-card group relative rounded-2xl border border-white/[0.08] bg-[#0a0b12]/80 p-6 md:p-7"
            >
              {index < HOME_FEATURES.length - 1 ? (
                <span
                  className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-white/10 to-transparent md:block"
                  aria-hidden
                />
              ) : null}

              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-lg text-cyan-200/90">
                  {feature.icon}
                </span>
                <div>
                  <p className="text-[11px] font-semibold tabular-nums tracking-widest text-white/30">
                    STEP {feature.step}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{feature.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
