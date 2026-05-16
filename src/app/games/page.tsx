import Link from "next/link";
import Navbar from "@/components/Navbar";
import { gameDetailPath } from "@/lib/curated/game-links";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Games A–Z | GamePing AI",
  description:
    "Discover popular games from A to Z and jump into each title’s page. Use GamePing’s AI recommendations to find what to play next based on your tastes.",
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GamesDirectoryPage() {
  const byLetter = LETTERS.map((letter) => ({
    letter,
    games: DIRECTORY_GAMES.filter(
      (g) => g.title.charAt(0).toUpperCase() === letter
    ),
  })).filter((g) => g.games.length > 0);

  const letterSet = new Set(byLetter.map((b) => b.letter));

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/12 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Directory
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">
            Games <span className="text-cyan-300">A–Z</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
            A compact, curated slice of well-known titles—each links to our game detail page. This
            list will grow over time; for personalized picks, use{" "}
            <Link href="/recommend" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              AI recommendations
            </Link>{" "}
            or explore{" "}
            <Link href="/curated" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              curated collections
            </Link>
            .
          </p>

          <nav
            className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-8"
            aria-label="Jump to letter"
          >
            {LETTERS.map((L) => (
              <span key={L}>
                {letterSet.has(L) ? (
                  <a
                    href={`#letter-${L}`}
                    className="inline-flex min-w-[2rem] justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1.5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    {L}
                  </a>
                ) : (
                  <span className="inline-flex min-w-[2rem] justify-center px-2 py-1.5 text-sm font-bold text-white/25">
                    {L}
                  </span>
                )}
              </span>
            ))}
          </nav>

          <div className="mt-10 space-y-14">
            {byLetter.map(({ letter, games }) => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
                <h2 className="text-2xl font-black text-cyan-300">{letter}</h2>
                <ul className="mt-4 space-y-3">
                  {games.map((game) => (
                    <li key={game.title}>
                      <Link
                        href={gameDetailPath(game.title)}
                        className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.06]"
                      >
                        <span className="font-black">{game.title}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-white/40 group-hover:text-cyan-300">
                          Details
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
