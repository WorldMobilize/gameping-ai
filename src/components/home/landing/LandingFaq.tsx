import Link from "next/link";
import type { ReactNode } from "react";
import Reveal from "@/components/home/landing/Reveal";

/**
 * Landing FAQ — a compact, honest accordion (native <details>, no JS). Answers
 * the common pre-signup questions and links only to existing pages. Presentation
 * only.
 */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Is GamePing free?",
    a: (
      <>
        Yes — the core discovery engine and the Companion&apos;s text chat are free, no credit card.
        Premium raises the limits and adds personalized picks, taste-matched deals, and more.{" "}
        <Link href="/upgrade" className="font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300">Compare the plans</Link>.
      </>
    ),
  },
  {
    q: "What does Discovery actually do?",
    a: (
      <>
        Describe a vibe in your own words and get an explained shortlist, plus curated collections,
        hidden gems, weekly picks, and price-aware deals — all tuned to your taste.{" "}
        <Link href="/discover" className="font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300">Open Discovery</Link>.
      </>
    ),
  },
  {
    q: "What is the Companion?",
    a: (
      <>
        A desktop overlay you summon with Alt&nbsp;+&nbsp;G — ask a question mid-play and the answer
        appears right over your screen, no alt-tabbing to a wiki. Text is free; voice and more come
        with Premium.{" "}
        <Link href="/companion/about" className="font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300">More on Companion</Link>.
      </>
    ),
  },
  {
    q: "…and WorldMobilize?",
    a: "That would be telling. It's the third product, it's being built, and it isn't ready yet — that's all we're saying for now. Keep an eye on it.",
  },
  {
    q: "Where do the prices come from?",
    a: "Live store data via IsThereAnyDeal, Steam, and CheapShark, with game info from RAWG. Prices and availability can change — always confirm on the store before buying.",
  },
  {
    q: "Do I need an account, and how does it learn my taste?",
    a: "You can run recommendations straight away; an account only matters once you want to save searches, track games, or get alerts. It learns from what you tell it, what you save and track — and, if you connect Steam, your library and playtime.",
  },
];

export default function LandingFaq({ className = "" }: { className?: string }) {
  return (
    <section className={`py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300/80">FAQ</p>
          <h2 className="gp-home-display mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Good to know
          </h2>
        </Reveal>

        <div className="mt-12 flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 70}>
              <details className="group rounded-2xl border border-slate-200/70 bg-white px-5 transition hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/15">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-900 marker:content-none dark:text-white">
                  {item.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition group-open:rotate-45 dark:border-white/15 dark:text-slate-300" aria-hidden>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
