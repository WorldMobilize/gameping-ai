import Link from "next/link";
import HomeProductDemo from "@/components/home/HomeProductDemo";
import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";

function ValuePropIcon({ id }: { id: string }) {
  const className = "h-5 w-5 text-sky-400";

  switch (id) {
    case "taste":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "dna":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 4c0 2.5 1.5 4 4 4s4-1.5 4-4M8 20c0-2.5 1.5-4 4-4s4 1.5 4 4M8 12h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="4" r="1.5" fill="currentColor" />
          <circle cx="16" cy="4" r="1.5" fill="currentColor" />
          <circle cx="8" cy="20" r="1.5" fill="currentColor" />
          <circle cx="16" cy="20" r="1.5" fill="currentColor" />
        </svg>
      );
    case "refine":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 12h10M14 8l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 6v12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    case "deals":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 8h12l-1.5 10H7.5L6 8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 8V6a3 3 0 0 1 6 0v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="12" r="1" fill="currentColor" />
          <circle cx="14" cy="14" r="1" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-6 pb-20 pt-24 md:pb-28 md:pt-28 lg:pt-32">
      <div className="gp-home-hero-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-start gap-12 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-10 2xl:gap-14">
          <div className="gp-home-hero-copy max-w-xl xl:max-w-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/75">
              Personal game discovery
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.04]">
              Find the next game you&apos;ll actually{" "}
              <span className="text-sky-400">love.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-white/55">
              GamePing learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
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

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
              {HOME_VALUE_PROPS.map((prop) => (
                <li key={prop.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/15 bg-sky-400/[0.06]">
                    <ValuePropIcon id={prop.id} />
                  </span>
                  <div>
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

          <div className="gp-home-hero-demo xl:sticky xl:top-28">
            <HomeProductDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
