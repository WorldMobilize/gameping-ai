import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_INLINE_LINK,
  APP_KICKER,
  APP_LIST_ROW,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
} from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Games Directory | GamePing AI",
  description:
    "Browse popular games A–Z, open each title for verified deals and price context, then use AI recommendations to find what to play next.",
  path: "/games",
});

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GamesDirectoryPage() {
  const byLetter = LETTERS.map((letter) => ({
    letter,
    games: DIRECTORY_GAMES.filter((g) => g.title.charAt(0).toUpperCase() === letter),
  })).filter((g) => g.games.length > 0);

  const letterSet = new Set(byLetter.map((b) => b.letter));

  return (
    <AppPageShell>
      <AppSection>
        <p className={APP_KICKER}>Directory</p>
        <h1 className={APP_PAGE_TITLE}>
          Games <span className={APP_ACCENT}>A–Z</span>
        </h1>
        <p className={APP_PAGE_LEAD}>
          A compact, curated slice of well-known titles—each links to our game detail page. This
          list will grow over time; for personalized picks, use{" "}
          <Link href="/recommend" className={APP_INLINE_LINK}>
            AI recommendations
          </Link>{" "}
          or explore{" "}
          <Link href="/curated" className={APP_INLINE_LINK}>
            curated collections
          </Link>
          .
        </p>

        <nav
          className="mt-10 flex flex-wrap gap-2 border-b border-slate-200/90 pb-8 dark:border-slate-800/80"
          aria-label="Jump to letter"
        >
          {LETTERS.map((L) => (
            <span key={L}>
              {letterSet.has(L) ? (
                <a
                  href={`#letter-${L}`}
                  className="inline-flex min-w-[2rem] justify-center rounded-lg border border-cyan-200/80 bg-cyan-50 px-2 py-1.5 text-sm font-bold text-cyan-800 transition hover:bg-cyan-100"
                >
                  {L}
                </a>
              ) : (
                <span className="inline-flex min-w-[2rem] justify-center px-2 py-1.5 text-sm font-bold text-slate-300">
                  {L}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="mt-10 space-y-14">
          {byLetter.map(({ letter, games }) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
              <h2 className={`text-2xl font-bold ${APP_ACCENT}`}>{letter}</h2>
              <ul className="mt-4 space-y-3">
                {games.map((game) => (
                  <li key={game.title}>
                    <Link href={gameDetailPath(game.title)} className={APP_LIST_ROW}>
                      <span className="font-bold text-slate-900 dark:text-white">{game.title}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-700">
                        Details
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </AppSection>
    </AppPageShell>
  );
}
