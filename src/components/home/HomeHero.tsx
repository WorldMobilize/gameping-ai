import Link from "next/link";
import HomeHeroAtmosphere from "@/components/home/HomeHeroAtmosphere";
import HomePingPanel from "@/components/home/HomePingPanel";
import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-5 pb-20 pt-28 min-[960px]:px-8 min-[960px]:pb-24 min-[960px]:pt-32 xl:px-10 2xl:px-16">
      <HomeHeroAtmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        <div className="grid grid-cols-1 items-center gap-12 min-[960px]:grid-cols-[minmax(380px,1.05fr)_minmax(340px,0.88fr)] min-[960px]:gap-10 xl:gap-14">
          <div className="gp-home-hero-copy min-w-0">
            <p className="gp-home-eyebrow inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-100/90">
              <span className="gp-home-eyebrow-dot h-1.5 w-1.5 rounded-full bg-teal-200" aria-hidden />
              Meet Ping · your discovery companion
            </p>

            <h1 className="mt-6 text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl min-[960px]:text-[2.6rem] min-[960px]:leading-[1.06] xl:text-[3.35rem] xl:leading-[1.05]">
              Find the next game you&apos;ll actually{" "}
              <span className="gp-home-accent-text">love.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-[1.75] text-white/72 min-[960px]:max-w-none xl:max-w-xl">
              Ping learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-9 flex flex-col gap-3.5 min-[480px]:flex-row min-[480px]:items-stretch">
              <Link
                href="/recommend"
                className="gp-home-cta-primary inline-flex h-[3.25rem] items-center justify-center rounded-2xl px-8 text-sm font-semibold leading-none text-[#0a2e28] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c14]"
              >
                Try GamePing
              </Link>
              <a
                href="#how-it-works"
                className="gp-home-cta-secondary inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-2xl px-8 text-sm font-medium leading-none text-white/85 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/35"
              >
                <svg
                  className="block h-4 w-4 shrink-0 text-teal-200/80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M10 8.5v7l6.5-3.5L10 8.5z" />
                </svg>
                <span>See how it works</span>
              </a>
            </div>

            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/48">
              <span>No login required</span>
              <span className="text-teal-300/55" aria-hidden>
                ·
              </span>
              <span>Under a minute</span>
              <span className="text-teal-300/55" aria-hidden>
                ·
              </span>
              <span>Prices on every game page</span>
            </p>

            <ul className="mt-14 grid gap-4 min-[480px]:grid-cols-2 min-[480px]:gap-5">
              {HOME_VALUE_PROPS.map((prop, i) => {
                const tone = ["mint", "violet", "amber", "rose"][i % 4];
                return (
                  <li
                    key={prop.id}
                    className={`gp-home-benefit-card gp-benefit-${tone} group flex items-start gap-4 rounded-[1.35rem] px-5 py-5 transition-transform duration-300 hover:-translate-y-0.5`}
                  >
                    <span className="gp-home-benefit-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-[1.04]">
                      <HomeValuePropIcon id={prop.id} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[15px] font-semibold leading-snug text-white/95">
                        {prop.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/58">{prop.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <nav
              aria-label="Explore GamePing"
              className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.07] pt-6 text-sm"
            >
              <Link
                href="/recommend"
                className="font-medium text-teal-100/90 transition hover:text-teal-50"
              >
                Personal recommendations
              </Link>
              <Link
                href="/games"
                className="text-white/50 transition hover:text-white/75"
              >
                Games A–Z
              </Link>
              <Link
                href="/curated"
                className="text-white/50 transition hover:text-white/75"
              >
                Curated lists
              </Link>
            </nav>
          </div>

          <div className="gp-home-hero-insight min-w-0 w-full min-[960px]:ml-auto min-[960px]:max-w-[480px] xl:max-w-[520px]">
            <HomePingPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
