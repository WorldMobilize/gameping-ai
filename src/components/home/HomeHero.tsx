import Link from "next/link";
import HomeProductDemo from "@/components/home/HomeProductDemo";
import { HOME_VIBE_TAGS } from "@/components/home/home-demo-data";

export default function HomeHero() {
  return (
    <section className="gp-home-hero relative overflow-hidden px-6 pb-20 pt-24 md:pb-28 md:pt-32">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.08),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-500/[0.04] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="gp-home-hero-copy max-w-xl lg:max-w-none">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/40 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400/90" />
            </span>
            <span className="text-xs font-medium text-white/55">
              Personal game discovery
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
            Find the next game you&apos;ll{" "}
            <span className="text-cyan-300">actually love.</span>
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/55">
            GamePing learns your taste, explains every pick, and surfaces games worth
            your time—with real store prices when you&apos;re ready to buy.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {HOME_VIBE_TAGS.slice(0, 6).map((tag, i) => (
              <span
                key={tag}
                className="gp-home-tag rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50"
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/recommend"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]"
            >
              Try GamePing
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-transparent px-8 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-sm text-white/35">
            No account required · Under a minute · Prices on every game page
          </p>

          <nav
            aria-label="Explore GamePing"
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-6 text-sm"
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

        <div className="gp-home-hero-demo lg:pl-4">
          <HomeProductDemo />
        </div>
      </div>
    </section>
  );
}
