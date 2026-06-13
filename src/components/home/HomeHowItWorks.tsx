import { HOME_FEATURES } from "@/components/home/home-demo-data";

export default function HomeHowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/75">
            How GamePing works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            From mood to picks you can trust
          </h2>
          <p className="mt-4 text-base leading-7 text-white/50">
            Describe what you want to feel while playing. GamePing returns curated matches
            with reasons—not another endless storefront scroll.
          </p>
        </div>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {HOME_FEATURES.map((feature) => (
            <li
              key={feature.step}
              className="gp-home-feature-card rounded-2xl border border-white/[0.08] bg-[#0a0d14]/70 p-7"
            >
              <p className="text-[11px] font-semibold tabular-nums tracking-[0.2em] text-white/30">
                STEP {feature.step}
              </p>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-white">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/50">{feature.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
