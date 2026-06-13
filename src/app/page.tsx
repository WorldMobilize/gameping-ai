import Link from "next/link";
import type { Metadata } from "next";
import HomeGameCarousel from "@/components/HomeGameCarousel";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import Navbar from "@/components/Navbar";
import SteamTasteComingSoon from "@/components/SteamTasteComingSoon";
import { buildPublicPageMetadata, DEFAULT_SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "GamePing AI — AI game discovery with real prices",
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
});

const previewGames = [
  {
    title: "Hades",
    match: "96%",
    reason: "Fast combat, roguelite loop, perfect for short sessions",
    price: "$8.24",
  },
  {
    title: "Disco Elysium",
    match: "91%",
    reason: "Story-rich, deep choices, unforgettable writing",
    price: "$8.88",
  },
  {
    title: "Hollow Knight",
    match: "89%",
    reason: "Dark atmosphere, exploration, challenge",
    price: "$7.49",
  },
];

const features = [
  {
    label: "01",
    title: "Describe your taste",
    text: "Write one sentence or pick a few tags. GamePing understands mood, genres, budget, and platform.",
  },
  {
    label: "02",
    title: "Get smarter picks",
    text: "Curated matches with a fit score, a clear reason, and real prices on each game page.",
  },
  {
    label: "03",
    title: "Track better deals",
    text: "Save a recommendation run to your dashboard for deal alerts. Follow one game’s price from its game page — both show up in how you use GamePing.",
  },
];

const tags = [
  "Cozy",
  "Dark story",
  "Under $10",
  "Steam Deck",
  "Roguelike",
  "Short sessions",
  "Open world",
  "Hidden gems",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05060f] text-white">
      <Navbar />

      <HomeLoggedInStrip />

      <section className="relative px-6 pb-24 pt-28">
        <div className="pointer-events-none absolute left-0 top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-64 h-80 w-80 rounded-full bg-cyan-600/5 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90">
              Game discovery · real prices
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Find the next game you&apos;ll actually love.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
              GamePing learns your taste, explains recommendations, and helps you discover
              games worth your time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/recommend">
                <button className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-black transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]">
                  Try GamePing
                </button>
              </Link>

              <a href="#how-it-works">
                <button className="rounded-full border border-white/15 bg-white/[0.03] px-8 py-4 font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060f]">
                  See how it works
                </button>
              </a>
            </div>

            <p className="mt-6 text-sm text-white/40">
              No login required • Takes less than 60 seconds • Real prices included
            </p>

            <nav
              aria-label="Explore GamePing"
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-white/70"
            >
              <Link
                href="/recommend"
                className="text-cyan-200/90 underline-offset-4 transition hover:text-cyan-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
              >
                Personal recommendations
              </Link>
              <Link
                href="/games"
                className="text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
              >
                Games directory
              </Link>
              <Link
                href="/curated"
                className="text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
              >
                Curated lists
              </Link>
            </nav>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b14]/90 p-5 shadow-lg shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
                    Product preview
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Your picks</h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/50">
                  Sample
                </span>
              </div>

              <div className="space-y-3">
                {previewGames.map((game, index) => (
                  <div
                    key={game.title}
                    className="rounded-2xl border border-white/[0.08] bg-black/25 p-5 transition hover:border-white/15 hover:bg-black/35"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                          Pick {index + 1}
                        </p>
                        <h3 className="mt-1.5 text-xl font-bold tracking-tight">{game.title}</h3>
                      </div>

                      <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-bold tabular-nums text-cyan-200 ring-1 ring-cyan-400/25">
                        {game.match}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-white/55">{game.reason}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4">
                      <span className="text-xs uppercase tracking-wider text-white/35">
                        Best price
                      </span>
                      <span className="font-bold tabular-nums text-cyan-200">{game.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white/80">
                  &ldquo;Find me a dark story game under $20&rdquo;
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Turn a simple request into curated picks with clear reasons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeGameCarousel />

      <section id="how-it-works" className="px-6 pb-24 pt-6 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Discovery that respects your taste.
            </h2>

            <p className="mt-4 text-white/55">
              GamePing goes beyond bestseller lists. It blends what you ask for with why
              games fit—so picks feel worth your time.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-black text-cyan-300">
                  {feature.label}
                </div>

                <h3 className="text-xl font-black">{feature.title}</h3>

                <p className="mt-3 text-sm leading-6 text-white/55">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-4xl font-black tabular-nums text-cyan-300">5</p>
            <p className="mt-2 font-bold">curated picks</p>
            <p className="mt-2 text-sm text-white/50">
              Not an endless list—just strong matches with reasons.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-4xl font-black text-cyan-300">Live</p>
            <p className="mt-2 font-bold">price checks</p>
            <p className="mt-2 text-sm text-white/50">
              Verified store prices on each game page.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-4xl font-black text-cyan-300">Fit</p>
            <p className="mt-2 font-bold">taste matching</p>
            <p className="mt-2 text-sm text-white/50">
              Describe your vibe in plain language—or connect Steam for deeper fit.
            </p>
          </div>
        </div>
      </section>

      <SteamTasteComingSoon idPrefix="home-steam" />

      <section className="relative px-6 pb-28 pt-14 md:pt-20 lg:pt-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-white/12 to-transparent md:top-8 lg:top-10"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b14]/80 p-10 text-center">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Ready to play something new?
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Your next favorite game is one search away.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/55">
              Describe a mood, set a budget, or keep it simple. GamePing handles the rest.
            </p>

            <Link href="/recommend">
              <button className="mt-8 rounded-full bg-cyan-400 px-9 py-4 font-bold text-black transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b14]">
                Try GamePing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}