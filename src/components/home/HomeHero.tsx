import Link from "next/link";
import HomeHeroAtmosphere from "@/components/home/HomeHeroAtmosphere";
import HomeHeroInsightPanel from "@/components/home/HomeHeroInsightPanel";
import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-5 pb-16 pt-24 min-[960px]:px-8 min-[960px]:pb-20 min-[960px]:pt-28 xl:px-10 2xl:px-16">
      <HomeHeroAtmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        <div className="grid grid-cols-1 items-start gap-10 min-[960px]:grid-cols-[minmax(360px,0.95fr)_minmax(320px,0.85fr)] min-[960px]:gap-8 xl:gap-12">
          <div className="gp-home-hero-copy min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/75">
              Personal game discovery
            </p>

            <h1 className="mt-3 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl min-[960px]:text-[2.35rem] min-[960px]:leading-[1.05] xl:text-[3.25rem] xl:leading-[1.04]">
              Find the next game you&apos;ll actually{" "}
              <span className="text-sky-400">love.</span>
            </h1>

            <p className="mt-4 max-w-lg text-lg leading-8 text-white/55 min-[960px]:max-w-none xl:max-w-lg">
              GamePing learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch">
              <Link
                href="/recommend"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-400 px-7 text-sm font-semibold leading-none text-[#041018] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]"
              >
                Try GamePing
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.02] px-7 text-sm font-medium leading-none text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                <svg
                  className="block h-4 w-4 shrink-0 text-white/55"
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
              <span className="text-sky-400/60" aria-hidden>
                ·
              </span>
              <span>Under a minute</span>
              <span className="text-sky-400/60" aria-hidden>
                ·
              </span>
              <span>Prices on every game page</span>
            </p>

            <ul className="mt-11 grid gap-3.5 min-[480px]:grid-cols-2 min-[480px]:gap-4">
              {HOME_VALUE_PROPS.map((prop) => (
                <li
                  key={prop.id}
                  className="gp-home-value-benefit group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition-colors hover:border-sky-400/25 hover:bg-sky-400/[0.04]"
                >
                  <span className="gp-home-value-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.08] transition-all duration-300 group-hover:border-sky-400/40 group-hover:bg-sky-400/[0.12]">
                    <HomeValuePropIcon id={prop.id} />
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-[15px] font-semibold leading-snug text-white">
                      {prop.label}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-white/45">{prop.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Explore GamePing"
              className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5 text-sm"
            >
              <Link
                href="/recommend"
                className="font-medium text-sky-200/90 transition hover:text-sky-100"
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

          <div className="gp-home-hero-insight min-w-0 w-full min-[960px]:ml-auto min-[960px]:max-w-[480px] xl:max-w-[520px]">
            <HomeHeroInsightPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
