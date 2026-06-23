"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { gameDetailPath } from "@/lib/curated/game-links";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** A–Z jump pill — glass + games accent, with a hover lift + accent glow. */
const GAMES_LETTER_PILL =
  "inline-flex min-w-[2.25rem] justify-center rounded-xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-1.5 text-sm font-bold text-[color:var(--page-accent-strong)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-strong)] hover:shadow-[0_0_16px_-2px_var(--page-accent-glow)]";

/**
 * Premium glass list card. `bg-white`/`border-slate-200` resolve to the frosted
 * games-accent surface in light mode (via .gp-accent-page); dark glass in dark.
 */
const GAMES_ROW =
  "group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--page-accent-border)] hover:shadow-[0_14px_34px_-14px_var(--page-accent-glow)] dark:border-slate-800/80 dark:bg-slate-900/70";

/** All-chars-in-order subsequence test — lightweight, allocation-free fuzzy. */
function isSubsequence(haystack: string, needle: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

/** 0 = exact, 1 = starts-with, 2 = includes, 3 = fuzzy, -1 = no match. */
function rankScore(title: string, query: string): number {
  const t = title.toLowerCase();
  if (t === query) return 0;
  if (t.startsWith(query)) return 1;
  if (t.includes(query)) return 2;
  if (isSubsequence(t, query)) return 3;
  return -1;
}

function GameRow({ title }: { title: string }) {
  return (
    <li>
      <Link href={`${gameDetailPath(title)}?from=games`} className={GAMES_ROW}>
        <span className="font-bold text-slate-900 dark:text-white">{title}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-[color:var(--page-accent-text)] transition-all group-hover:gap-2">
          Details
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 8h9M8.5 4l4 4-4 4" />
          </svg>
        </span>
      </Link>
    </li>
  );
}

export default function GamesDirectoryBrowser({ titles }: { titles: string[] }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const byLetter = useMemo(
    () =>
      LETTERS.map((letter) => ({
        letter,
        games: titles.filter((t) => t.charAt(0).toUpperCase() === letter),
      })).filter((g) => g.games.length > 0),
    [titles]
  );
  const letterSet = useMemo(() => new Set(byLetter.map((b) => b.letter)), [byLetter]);

  const results = useMemo(() => {
    if (!q) return [];
    return titles
      .map((title) => ({ title, score: rankScore(title, q) }))
      .filter((r) => r.score >= 0)
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.title.localeCompare(b.title, "en", { sensitivity: "base" })
      )
      .map((r) => r.title);
  }, [q, titles]);

  return (
    <div className="mt-10">
      {/* Search — cinematic glass field with a red (games-accent) focus ring. */}
      <label htmlFor={inputId} className="sr-only">
        Search games by title
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
        }}
        placeholder="Search games by title..."
        autoComplete="off"
        className="w-full rounded-2xl border border-[color:var(--page-accent-border)] bg-white px-5 py-3.5 text-base text-slate-900 shadow-sm backdrop-blur-sm outline-none transition placeholder:text-slate-500 focus:border-[color:var(--page-accent-strong)] focus:ring-2 focus:ring-[color:var(--page-accent-border)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-400"
      />

      {searching ? (
        <div className="mt-8">
          <p className="text-sm font-semibold text-slate-200" aria-live="polite">
            {results.length} game{results.length === 1 ? "" : "s"} found
          </p>

          {results.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {results.map((title) => (
                <GameRow key={title} title={title} />
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-[color:var(--page-accent-border)] bg-white p-6 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                No games found
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Try another title or use AI recommendations.
              </p>
              <Link
                href="/recommend"
                className="mt-5 inline-flex items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-sm font-bold text-[color:var(--page-accent-strong)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[color:var(--page-accent-strong)] hover:shadow-[0_0_16px_-2px_var(--page-accent-glow)]"
              >
                Get AI recommendations
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <nav
            className="mt-6 flex flex-wrap gap-2 border-b border-[color:var(--page-accent-border)] pb-8"
            aria-label="Jump to letter"
          >
            {LETTERS.map((L) => (
              <span key={L}>
                {letterSet.has(L) ? (
                  <a href={`#letter-${L}`} className={GAMES_LETTER_PILL}>
                    {L}
                  </a>
                ) : (
                  <span className="inline-flex min-w-[2.25rem] justify-center px-2.5 py-1.5 text-sm font-bold text-slate-500/70">
                    {L}
                  </span>
                )}
              </span>
            ))}
          </nav>

          <div className="mt-10 space-y-14">
            {byLetter.map(({ letter, games }) => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-[color:var(--page-accent-strong)]">
                    {letter}
                  </h2>
                  <span aria-hidden className="h-px flex-1 bg-[color:var(--page-accent-border)]" />
                </div>
                <ul className="mt-5 space-y-3">
                  {games.map((title) => (
                    <GameRow key={title} title={title} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
