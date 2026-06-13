import HomeProductDemo from "@/components/home/HomeProductDemo";
import { HOME_FEATURES } from "@/components/home/home-demo-data";

export default function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] bg-[#070910]/50 px-5 py-20 min-[960px]:px-8 md:py-28 xl:px-10 2xl:px-16"
    >
      <span className="gp-home-section-blob gp-section-blob-mint" aria-hidden />
      <div className="relative mx-auto w-full max-w-[1500px]">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            See Ping in action
          </h2>
          <p className="mt-4 text-base leading-7 text-white/55">
            Start with a feeling, then refine until Ping&apos;s picks match what you
            actually want.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 min-[960px]:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] min-[960px]:gap-10 xl:gap-14">
          <div className="gp-home-section-demo min-w-0 w-full">
            <HomeProductDemo variant="section" />
          </div>

          <ol className="flex min-w-0 flex-col gap-4 min-[960px]:pt-2">
            {HOME_FEATURES.map((feature, i) => {
              const tone = ["cyan", "violet", "amber"][i % 3];
              return (
                <li
                  key={feature.step}
                  className={`gp-home-feature-card gp-tone-${tone} relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0d14]/70 p-6 min-[960px]:p-7`}
                >
                  <div className="flex items-center gap-3">
                    <span className="gp-home-step-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums">
                      {feature.step}
                    </span>
                    <h3 className="text-lg font-semibold leading-snug tracking-tight text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/55">{feature.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
