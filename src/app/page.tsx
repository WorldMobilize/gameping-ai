import Link from "next/link";
import HomeGameCarousel from "@/components/HomeGameCarousel";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import Navbar from "@/components/Navbar";
import SteamTasteComingSoon from "@/components/SteamTasteComingSoon";

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
    text: "Get picks with a match score, a clear reason, and real prices found online.",
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
        <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-64 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              AI game discovery + real prices
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
              Find games that actually match{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                your vibe.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              Stop endless scrolling through stores and random deals.
              Tell GamePing what you feel like playing and get tailored picks with real prices.
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
                <button className="rounded-full bg-cyan-400 px-8 py-4 font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300">
                  Find my perfect games →
                </button>
              </Link>

              <a href="#how-it-works">
                <button className="rounded-full border border-white/15 px-8 py-4 font-bold text-white/80 transition hover:border-cyan-400/50 hover:bg-white/10 hover:text-cyan-300">
                  How it works
                </button>
              </a>
            </div>

            <p className="mt-6 text-sm text-white/40">
              No login required • Takes less than 60 seconds • Real prices included
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-400/20 to-purple-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_0_80px_rgba(168,85,247,0.15)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                    Live preview
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Your AI picks</h2>
                </div>

                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
                  Demo
                </span>
              </div>

              <div className="space-y-4">
                {previewGames.map((game, index) => (
                  <div
                    key={game.title}
                    className="group rounded-3xl border border-white/10 bg-black/30 p-5 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-400/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                          Pick #{index + 1}
                        </p>
                        <h3 className="mt-2 text-xl font-black">{game.title}</h3>
                      </div>

                      <span className="rounded-full bg-cyan-400 px-3 py-1 text-sm font-black text-black">
                        {game.match}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-white/60">
                      💡 {game.reason}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-xs uppercase tracking-widest text-white/35">
                        Best price
                      </span>
                      <span className="font-black text-cyan-300">{game.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-bold text-cyan-200">
                  “Find me a dark story game under $20”
                </p>
                <p className="mt-1 text-xs text-white/45">
                  GamePing turns simple requests into smart recommendations.
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
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Smart recommendations, without the noise.
            </h2>

            <p className="mt-4 text-white/55">
              GamePing goes beyond surfacing the usual bestsellers. It blends your taste,
              budget, and context so recommendations actually feel worth playing.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-400/[0.06]"
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
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-4xl font-black text-cyan-300">5</p>
            <p className="mt-2 font-black">personalized picks</p>
            <p className="mt-2 text-sm text-white/50">
              Not an endless list—just the best matches.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-4xl font-black text-cyan-300">Live</p>
            <p className="mt-2 font-black">price checks</p>
            <p className="mt-2 text-sm text-white/50">
              Real prices found via deal providers.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-4xl font-black text-cyan-300">AI</p>
            <p className="mt-2 font-black">taste matching</p>
            <p className="mt-2 text-sm text-white/50">
              Describe your vibe in plain language.
            </p>
          </div>
        </div>
      </section>

      <SteamTasteComingSoon idPrefix="home-steam" />

      <section className="px-6 pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 p-10 text-center">
          <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Ready?
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Find your next game in under a minute.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Pick a vibe, set a budget and platform, or just write one sentence.
              GamePing does the rest.
            </p>

            <Link href="/recommend">
              <button className="mt-8 rounded-full bg-cyan-400 px-9 py-4 font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300">
                Start now →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}