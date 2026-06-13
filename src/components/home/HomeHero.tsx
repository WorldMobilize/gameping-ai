import Link from "next/link";
import HomeProductDemo from "@/components/home/HomeProductDemo";
import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-5 pb-20 pt-24 min-[960px]:px-8 min-[960px]:pb-24 min-[960px]:pt-28 xl:px-10 2xl:px-16 lg:pt-32">
      <div className="gp-home-hero-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        <div className="grid grid-cols-1 items-start gap-10 min-[960px]:grid-cols-[minmax(360px,0.9fr)_minmax(460px,1.1fr)] min-[960px]:gap-8 xl:gap-12">
          <div className="gp-home-hero-copy min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/75">
              Personal game discovery
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl min-[960px]:text-[2.35rem] min-[960px]:leading-[1.05] xl:text-[3.4rem] xl:leading-[1.04]">
              Find the next game you&apos;ll actually{" "}
              <span className="text-sky-400">love.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-white/55 min-[960px]:max-w-none xl:max-w-lg">
              GamePing learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center">
              <Link
                href="/recommend"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-7 py-3.5 text-sm font-semibold text-[#041018] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]"
              >
                Try GamePing
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.02] px-7 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                <svg
                  className="h-4 w-4 text-white/55"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                See how it works
              </a>
            </div>

            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/35">
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

            <ul className="mt-12 grid gap-5 min-[480px]:grid-cols-2 min-[480px]:gap-6">
              {HOME_VALUE_PROPS.map((prop) => (
                <li key={prop.id} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.07]">
                    <HomeValuePropIcon id={prop.id} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-white/88">{prop.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/40">{prop.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Explore GamePing"
              className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-6 text-sm"
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

          <div className="gp-home-hero-demo min-w-0 w-full min-[960px]:sticky min-[960px]:top-28 min-[960px]:ml-auto min-[960px]:max-w-[820px]">
            <HomeProductDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
