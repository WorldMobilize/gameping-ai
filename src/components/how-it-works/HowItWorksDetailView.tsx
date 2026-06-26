"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_DISPLAY_FONT,
  HOME_PRIMARY_CTA_LG,
  HOME_SECTION_TITLE,
  homeSecondaryCta,
} from "@/components/home/home-styles";

export type HowItWorksPage = {
  title: string;
  description: string;
  body: string;
  kicker?: string;
};

/**
 * In-depth "Learn more" page rendered with the landing cinematic identity:
 * the fixed gameping-hero background (identical in light + dark), cyan accent,
 * and frosted/dark glass cards that adapt to theme. Presentational only — no
 * data fetching, no routing/logic changes. Content lives in this file; the
 * route + metadata stay in the server page.
 */
export default function HowItWorksDetailView({
  slug,
  page,
  breadcrumbs,
}: {
  slug: string;
  page: HowItWorksPage;
  breadcrumbs?: GameBreadcrumbItem[];
}) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  // Floating "HUD" text over the fixed dark cinematic room stays light in BOTH
  // themes (the room never brightens); only the glass cards adapt to theme.
  const eyebrow = "text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400";
  const onBgTitle = `${HOME_SECTION_TITLE} text-slate-50`;
  const onBgLead = "mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl";
  const sectionTitle = `${HOME_DISPLAY_FONT} text-2xl font-extrabold text-slate-50 sm:text-[1.75rem]`;

  // Glass card surfaces + in-card text (dark glass in dark mode, frosted light
  // glass in light mode via the .gp-landing scope).
  const card = `gp-home-card rounded-3xl border p-6 sm:p-7 ${
    isDark ? "gp-home-card-dark" : "gp-home-card-light"
  }`;
  const cardEyebrow = `text-xs font-semibold uppercase tracking-[0.3em] ${
    isDark ? "text-cyan-300" : "text-cyan-700"
  }`;
  const cardTitle = `${HOME_DISPLAY_FONT} text-lg font-bold ${
    isDark ? "text-slate-50" : "text-slate-900"
  }`;
  const cardBody = `text-base leading-relaxed ${
    isDark ? "text-slate-300" : "text-slate-700"
  }`;
  const quote = `text-base leading-relaxed ${
    isDark ? "text-slate-100" : "text-slate-900"
  }`;

  // Premium bullet: a short cyan accent dash, not an icon/circle.
  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <li className="flex gap-3">
      <span aria-hidden className="mt-[0.7em] h-px w-3.5 shrink-0 bg-cyan-400/70" />
      <span className={cardBody}>{children}</span>
    </li>
  );

  return (
    <div className="gp-landing relative flex min-h-screen flex-col overflow-x-clip bg-[#070b14] text-slate-100">
      <div aria-hidden className="gp-landing-bg" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar ctaLabel="Try GamePing" />

        <main className="flex-1">
          <section className="relative z-10 px-6 pt-16 pb-10 md:pt-20">
            <div className="mx-auto max-w-3xl">
              {breadcrumbs?.length ? (
                <PageBreadcrumbs items={breadcrumbs} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
              ) : null}
              {page.kicker ? (
                <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  {page.kicker}
                </span>
              ) : (
                <p className={eyebrow}>How GamePing works</p>
              )}
              <h1 className={`mt-4 ${onBgTitle}`}>{page.title}</h1>
              <p className={onBgLead}>{page.description}</p>
            </div>
          </section>

          <div className="mx-auto max-w-3xl px-6 pb-4">
            {slug === "taste" ? (
              <TasteContent />
            ) : slug === "matches" ? (
              <MatchesContent />
            ) : slug === "discovery" ? (
              <DiscoveryContent />
            ) : slug === "steam-import" ? (
              <SteamImportContent />
            ) : slug === "taste-memory" ? (
              <TasteMemoryContent />
            ) : (
              <FallbackContent body={page.body} />
            )}
          </div>

          {/* Closing CTA — standard landing primary style. */}
          <section className="relative z-10 px-6 py-16 md:py-20">
            <div className={`mx-auto max-w-3xl text-center ${card}`}>
              <p className={eyebrow}>Get started</p>
              <h2 className={`mt-3 ${sectionTitle} ${isDark ? "" : "!text-slate-900"}`}>
                Ready to find your next game?
              </h2>
              <p className={`mx-auto mt-3 max-w-xl ${cardBody}`}>
                Describe what you feel like playing — GamePing turns it into picks with clear
                reasons.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/recommend" className={HOME_PRIMARY_CTA_LG}>
                  Try GamePing
                </Link>
                <Link href="/" className={homeSecondaryCta(isDark)}>
                  Back to homepage
                </Link>
              </div>
            </div>
          </section>
        </main>

        <div
          aria-hidden
          className="h-16 w-full bg-gradient-to-b from-transparent to-[#070b14] sm:h-20"
        />
        <Footer theme="dark" />
      </div>
    </div>
  );

  // ---- Page bodies -------------------------------------------------------

  function TasteContent() {
    const naturalExamples = [
      "I want something like Skyrim but with better combat.",
      "I need a relaxing game after work.",
      "I want something that makes me love gaming again.",
    ];
    const understands = [
      "Mood — cozy, tense, melancholy, triumphant",
      "Pacing — slow and meditative or fast and relentless",
      "Favorite games and why they stuck with you",
      "Mechanics you love — crafting, stealth, deckbuilding",
      "Things you dislike and want to avoid",
      "Memories — what a past favorite made you feel",
      "Play style — completionist, story-first, pick-up-and-play",
    ];

    return (
      <div className="space-y-6">
        <article className={card}>
          <p className={cardEyebrow}>No perfect filters needed</p>
          <h2 className={`mt-2 ${cardTitle}`}>Just say it in your own words</h2>
          <p className={`mt-3 ${cardBody}`}>
            You don&apos;t have to translate a feeling into genres and tags. Write the way you&apos;d
            text a friend who knows games, and GamePing reads the intent behind it.
          </p>
          <ul className="mt-5 space-y-3">
            {naturalExamples.map((ex) => (
              <li
                key={ex}
                className={`rounded-2xl border px-4 py-3 ${
                  isDark
                    ? "border-cyan-400/20 bg-cyan-950/20"
                    : "border-cyan-300/40 bg-cyan-50/60"
                }`}
              >
                <span className={quote}>“{ex}”</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>What GamePing reads</p>
          <h2 className={`mt-2 ${cardTitle}`}>The signals behind your words</h2>
          <ul className="mt-5 space-y-3">
            {understands.map((u) => (
              <Bullet key={u}>{u}</Bullet>
            ))}
          </ul>
        </article>

        <div className="grid gap-6 sm:grid-cols-2">
          <article className={card}>
            <p className={cardEyebrow}>Traditional search</p>
            <h2 className={`mt-2 ${cardTitle}`}>Rigid filters</h2>
            <div className="mt-4 space-y-2">
              <p className={cardBody}>
                <span className="font-semibold">Genre:</span> RPG
              </p>
              <p className={cardBody}>
                <span className="font-semibold">Tags:</span> Open world
              </p>
            </div>
            <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Describes a category — not what you actually enjoy.
            </p>
          </article>

          <article
            className={`${card} ${
              isDark ? "!border-cyan-400/40" : "!border-cyan-400/50"
            }`}
          >
            <p className={cardEyebrow}>GamePing</p>
            <h2 className={`mt-2 ${cardTitle}`}>Your taste, in plain language</h2>
            <p className={`mt-4 ${quote}`}>
              “I love exploring worlds where my choices matter.”
            </p>
            <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Captures mood, freedom, and the feel of play — then finds games that match it.
            </p>
          </article>
        </div>
      </div>
    );
  }

  function MatchesContent() {
    const considers = [
      "Gameplay loop — what you actually do moment to moment",
      "Freedom — how open or guided the experience is",
      "Difficulty — gentle, fair, or punishing",
      "Story focus — narrative-driven or mechanics-first",
      "Atmosphere — tone, art, and sound",
      "Progression — how you grow and unlock",
      "Replayability — one strong run or endless variety",
    ];
    const cardParts = [
      ["Why it matches", "The specific reasons a game lines up with what you described."],
      ["Possible concerns", "Honest caveats — so a pick is a decision, not a gamble."],
      ["Price information", "Current pricing context so value is part of the call."],
      ["Store availability", "Where the game is actually available to buy or play."],
    ];

    return (
      <div className="space-y-6">
        <article className={card}>
          <p className={cardEyebrow}>Beyond &quot;people also bought&quot;</p>
          <h2 className={`mt-2 ${cardTitle}`}>It analyzes why a game fits</h2>
          <p className={`mt-3 ${cardBody}`}>
            Most stores recommend by sales patterns. GamePing reasons about the game itself and how
            it maps to your taste, so a match is something it can explain — not just a correlation.
          </p>
          <ul className="mt-5 space-y-3">
            {considers.map((c) => (
              <Bullet key={c}>{c}</Bullet>
            ))}
          </ul>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>Every result card</p>
          <h2 className={`mt-2 ${cardTitle}`}>Built to help you decide</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {cardParts.map(([t, d]) => (
              <div
                key={t}
                className={`rounded-2xl border p-4 ${
                  isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200/80 bg-white/60"
                }`}
              >
                <p className={`${cardEyebrow}`}>{t}</p>
                <p className={`mt-2 text-sm leading-relaxed ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}>
                  {d}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>How it ranks</p>
          <h2 className={`mt-2 ${cardTitle}`}>AI ranking + verified game data</h2>
          <p className={`mt-3 ${cardBody}`}>
            Picks come from AI ranking grounded in verified game data, so reasons are tied to real
            details rather than guesses. It won&apos;t promise a perfect score for everyone — it aims
            to give you a clear, honest read so you can choose with confidence.
          </p>
        </article>
      </div>
    );
  }

  function DiscoveryContent() {
    const current = [
      "Save your recommendation runs and revisit them anytime",
      "Track games you're interested in and get price alerts when they drop",
      "Sync your Steam library so picks skip what you already own",
      "Premium personalization — Weekly Picks, Deals For You, and Monthly Recap from your GamePing DNA",
    ];
    const future = [
      "Weekly Picks — a fresh set of recommendations from your taste profile",
      "Deals For You — taste-matched games first, then their best prices",
      "Monthly Recap — your gaming personality and how your taste is evolving",
    ];

    return (
      <div className="space-y-6">
        <article className={card}>
          <p className={cardEyebrow}>It doesn&apos;t stop at one search</p>
          <h2 className={`mt-2 ${cardTitle}`}>Discovery keeps going</h2>
          <p className={`mt-3 ${cardBody}`}>
            A great recommendation is a starting point. GamePing helps you hold onto picks, watch
            for the right moment to buy, and keep finding games that fit how you play.
          </p>
        </article>

        <div className="grid gap-6 sm:grid-cols-2">
          <article className={card}>
            <p className={cardEyebrow}>Available now</p>
            <h2 className={`mt-2 ${cardTitle}`}>Today</h2>
            <ul className="mt-5 space-y-3">
              {current.map((c) => (
                <Bullet key={c}>{c}</Bullet>
              ))}
            </ul>
          </article>

          <article className={card}>
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Powered by your taste
            </span>
            <h2 className={`mt-3 ${cardTitle}`}>Built around you</h2>
            <ul className="mt-5 space-y-3">
              {future.map((f) => (
                <Bullet key={f}>{f}</Bullet>
              ))}
            </ul>
          </article>
        </div>
      </div>
    );
  }

  function SteamImportContent() {
    const reads = [
      "Owned games — what's already in your library",
      "Playtime patterns — what you keep coming back to",
      "Finished vs. barely-touched — what stuck and what didn't",
      "Favorite genres and series — signals stronger than a single search",
    ];
    const reasons = [
      [
        "No more recommending games you own",
        "GamePing skips titles already in your library, so every pick is something new to you.",
      ],
      [
        "A sharper taste profile",
        "Real playtime is honest. It tells GamePing what you actually enjoy — not just what you searched once.",
      ],
      [
        "Smarter backlog help",
        "With your library in view, GamePing can point you back at great games you already own but never finished.",
      ],
      [
        "Better group picks",
        "Knowing what a group owns makes shared recommendations — and future party finding — far more useful.",
      ],
    ] as const;
    const future = [
      "Personalized picks that skip games you already own",
      "A sharper GamePing DNA built from your real playtime",
      "Weekly Picks, Deals For You, and Monthly Recap tuned to your library",
    ];

    return (
      <div className="space-y-6">
        <article className={card}>
          <p className={cardEyebrow}>What it does</p>
          <h2 className={`mt-2 ${cardTitle}`}>Connect your Steam library</h2>
          <p className={`mt-3 ${cardBody}`}>
            Steam Library Sync lets you securely connect your Steam account so GamePing understands
            the games you already own and play. Instead of guessing from one prompt, it learns from
            your real history — making every recommendation more personal.
          </p>
          <ul className="mt-5 space-y-3">
            {reads.map((r) => (
              <Bullet key={r}>{r}</Bullet>
            ))}
          </ul>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>Why it matters</p>
          <h2 className={`mt-2 ${cardTitle}`}>Recommendations that respect your library</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {reasons.map(([t, d]) => (
              <div
                key={t}
                className={`rounded-2xl border p-4 ${
                  isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200/80 bg-white/60"
                }`}
              >
                <p className={cardEyebrow}>{t}</p>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {d}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>How GamePing uses it</p>
          <h2 className={`mt-2 ${cardTitle}`}>From library to better matches</h2>
          <p className={`mt-3 ${cardBody}`}>
            Your library becomes part of your taste profile. GamePing reads which games you owned and
            actually played, filters out what you already have, and weighs the patterns — genres,
            pacing, and mechanics you return to — when it ranks new picks. You stay in control of
            what&apos;s included, and you can disconnect anytime.
          </p>
        </article>

        <article
          className={`${card} ${isDark ? "!border-cyan-400/40" : "!border-cyan-400/50"}`}
        >
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Powered by your taste
          </span>
          <h2 className={`mt-3 ${cardTitle}`}>What it powers today</h2>
          <ul className="mt-5 space-y-3">
            {future.map((f) => (
              <Bullet key={f}>{f}</Bullet>
            ))}
          </ul>
          <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Steam Library Sync is live today — connect it from your account settings to start
            personalizing your picks, deals, and recap.
          </p>
        </article>
      </div>
    );
  }

  function TasteMemoryContent() {
    const remembers = [
      "Mood — the feelings you reach for, from cozy to tense",
      "Pacing — slow and meditative or fast and relentless",
      "Mechanics — crafting, stealth, deckbuilding, and more",
      "Favorite games — the ones you keep comparing everything to",
      "Dislikes — the things you tell GamePing to avoid",
    ];
    const today = [
      "Steam library & playtime — what you actually play",
      "Searches you make",
      "Games you save to your dashboard",
      "Games you track for price alerts",
    ];
    const roadmap = [
      "Recommendations — results lean toward what you love",
      "Personal fit — fit analysis on game pages, tuned to you",
      "Weekly Picks, Deals For You, and Monthly Recap — your Premium personalization",
    ];

    return (
      <div className="space-y-6">
        <article className={card}>
          <p className={cardEyebrow}>What it does</p>
          <h2 className={`mt-2 ${cardTitle}`}>Your GamePing DNA, built from how you play</h2>
          <p className={`mt-3 ${cardBody}`}>
            Your GamePing DNA builds a picture of what you enjoy from your Steam library, searches,
            and saved games — so picks feel like they already know you, without you having to
            re-explain yourself every time. The more you use GamePing, the sharper it gets.
          </p>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>What it remembers</p>
          <h2 className={`mt-2 ${cardTitle}`}>The shape of your taste</h2>
          <ul className="mt-5 space-y-3">
            {remembers.map((r) => (
              <Bullet key={r}>{r}</Bullet>
            ))}
          </ul>
        </article>

        <article className={card}>
          <p className={cardEyebrow}>How GamePing uses it</p>
          <h2 className={`mt-2 ${cardTitle}`}>Every signal sharpens the next pick</h2>
          <p className={`mt-3 ${cardBody}`}>
            As you search, save, and skip, GamePing learns which signals matter to you and quietly
            weights them in future recommendations and fit analysis. The more you use it, the less
            you have to spell out — results lean toward what you love and away from what you don&apos;t.
          </p>
        </article>

        <div className="grid gap-6 sm:grid-cols-2">
          <article className={card}>
            <p className={cardEyebrow}>Available now</p>
            <h2 className={`mt-2 ${cardTitle}`}>What feeds it today</h2>
            <ul className="mt-5 space-y-3">
              {today.map((t) => (
                <Bullet key={t}>{t}</Bullet>
              ))}
            </ul>
          </article>

          <article
            className={`${card} ${isDark ? "!border-cyan-400/40" : "!border-cyan-400/50"}`}
          >
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Powered by your taste
            </span>
            <h2 className={`mt-3 ${cardTitle}`}>What it sharpens</h2>
            <ul className="mt-5 space-y-3">
              {roadmap.map((r) => (
                <Bullet key={r}>{r}</Bullet>
              ))}
            </ul>
            <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Your GamePing DNA is live as part of Premium and sharpens every pick the more you use GamePing.
            </p>
          </article>
        </div>
      </div>
    );
  }

  function FallbackContent({ body }: { body: string }) {
    return (
      <article className={card}>
        <p className={cardEyebrow}>Overview</p>
        <p className={`mt-3 ${cardBody}`}>{body}</p>
      </article>
    );
  }
}
