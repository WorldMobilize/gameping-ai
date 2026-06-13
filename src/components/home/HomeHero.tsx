import Link from "next/link";
import HomeHeroAtmosphere from "@/components/home/HomeHeroAtmosphere";
import HomePingPanel from "@/components/home/HomePingPanel";
import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-5 pb-16 pt-24 min-[960px]:px-8 min-[960px]:pb-20 min-[960px]:pt-28 xl:px-10 2xl:px-16">
      <HomeHeroAtmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        <div className="grid grid-cols-1 items-center gap-10 min-[960px]:grid-cols-[minmax(360px,1fr)_minmax(330px,0.82fr)] min-[960px]:gap-8 xl:gap-12">
          <div className="gp-home-hero-copy min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
              <span className="gp-home-eyebrow-dot h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden />
              Meet Ping · your discovery companion
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl min-[960px]:text-[2.35rem] min-[960px]:leading-[1.05] xl:text-[3.25rem] xl:leading-[1.04]">
              Find the next game you&apos;ll actually{" "}
              <span className="gp-home-accent-text">love.</span>
            </h1>

            <p className="mt-4 max-w-lg text-lg leading-8 text-white/60 min-[960px]:max-w-none xl:max-w-lg">
              Ping learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch">
              <Link
                href="/recommend"
                className="gp-home-cta-primary inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-semibold leading-none text-[#041814] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]"
              >
                Try GamePing
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-7 text-sm font-medium leading-none text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
              >
                <svg
                  className="block h-4 w-4 shrink-0 text-cyan-300/80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M10 8.5v7l6.5-3.5L10 8.5z" />
                </svg>
                <span>See how it works</span>
              </a>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/35">
              <span>No login required</span>
              <span className="text-cyan-400/60" aria-hidden>
                ·
              </span>
              <span>Under a minute</span>
              <span className="text-cyan-400/60" aria-hidden>
                ·
              </span>
              <span>Prices on every game page</span>
            </p>

            <ul className="mt-11 grid gap-3.5 min-[480px]:grid-cols-2 min-[480px]:gap-4">
              {HOME_VALUE_PROPS.map((prop, i) => {
                const tone = ["cyan", "violet", "amber", "rose"][i % 4];
                return (
                  <li
                    key={prop.id}
                    className={`gp-home-value-benefit gp-tone-${tone} group flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4 backdrop-blur-sm transition-colors hover:bg-white/[0.04]`}
                  >
                    <span className="gp-home-value-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300">
                      <HomeValuePropIcon id={prop.id} />
                    </span>
                    <div className="min-w-0 pt-1">
                      <p className="text-[15px] font-semibold leading-snug text-white">
                        {prop.label}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-white/50">{prop.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <nav
              aria-label="Explore GamePing"
              className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5 text-sm"
            >
              <Link
                href="/recommend"
                className="font-medium text-cyan-200/90 transition hover:text-cyan-100"
              >
                Personal recommendations
              </Link>
              <Link
                href="/games"
                className="text-white/45 transition hover:text-white/70"
              >
                Games A–Z
              </Link>
              <Link
                href="/curated"
                className="text-white/45 transition hover:text-white/70"
              >
                Curated lists
              </Link>
            </nav>
          </div>

          <div className="gp-home-hero-insight min-w-0 w-full min-[960px]:ml-auto min-[960px]:max-w-[460px] xl:max-w-[500px]">
            <HomePingPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
