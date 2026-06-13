import Link from "next/link";
import HomeProductDemo from "@/components/home/HomeProductDemo";
import { HOME_TRUST_BADGES } from "@/components/home/home-demo-data";

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-6 pb-16 pt-24 md:pb-24 md:pt-28 lg:pt-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(56,189,248,0.07),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 xl:gap-16">
          <div className="gp-home-hero-copy max-w-xl lg:max-w-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Game discovery · real prices
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.05]">
              Find the next game you&apos;ll actually love.
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-white/55">
              GamePing learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/recommend"
                className="inline-flex items-center justify-center rounded-xl bg-sky-400 px-7 py-3.5 text-sm font-semibold text-[#041018] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]"
              >
                Try GamePing
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.02] px-7 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-sm text-white/35">
              No login required · Under a minute · Prices on every game page
            </p>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {HOME_TRUST_BADGES.map((badge) => (
                <li
                  key={badge.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5"
                >
                  <p className="text-sm font-medium text-white/85">{badge.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/40">{badge.detail}</p>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Explore GamePing"
              className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-6 text-sm"
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

          <div className="gp-home-hero-demo lg:pt-2">
            <HomeProductDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
