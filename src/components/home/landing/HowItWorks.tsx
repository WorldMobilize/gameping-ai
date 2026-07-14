import type { ReactNode } from "react";
import Reveal from "@/components/home/landing/Reveal";
import PremiumIcon from "@/components/home/landing/PremiumIcon";
import { GLYPH_COMPANION, GLYPH_DISCOVERY, GLYPH_WORLDMOBILIZE } from "@/components/home/landing/landing-icons";

/**
 * "How it works" — the three products at a glance (Discovery → Companion →
 * WorldMobilize). WorldMobilize is named and nothing else: pre-launch, it gets
 * no description here or anywhere else on the site. Premium metallic icons.
 * Presentation only.
 */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

type Product = { n: string; name: string; line: string; body: string; tag: string; href: string; icon: ReactNode };

const PRODUCTS: Product[] = [
  {
    n: "01",
    name: "Discovery",
    line: "Find your next game",
    body: "Describe a vibe and get explained matches, curated lists, hidden gems, and price-aware deals — tuned to your taste.",
    tag: "Live",
    href: "#discovery",
    icon: GLYPH_DISCOVERY,
  },
  {
    n: "02",
    name: "Companion",
    line: "A co-pilot while you play",
    body: "A desktop overlay that lives beside your game — ask mid-play and get the answer right over your screen, no alt-tab.",
    tag: "Desktop",
    href: "#companion",
    icon: GLYPH_COMPANION,
  },
  {
    n: "03",
    name: "WorldMobilize",
    line: "Something is being built",
    body: "The third product. It isn't ready yet, and we're not saying what it is — you'll know when it opens.",
    tag: "Coming soon",
    href: "#worldmobilize",
    icon: GLYPH_WORLDMOBILIZE,
  },
];

export default function HowItWorks({ className = "" }: { className?: string }) {
  return (
    // The hero's primary action lands here: the three products, before anything else.
    <section id="how-it-works" className={`scroll-mt-[110px] py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300/80">
            How it works
          </p>
          <h2 className="gp-home-display mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Three products, one world
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Find and price your games, get help while you play — and something new on the horizon. One account across all of it.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {PRODUCTS.map((product, i) => (
            <Reveal key={product.name} delay={i * 260} repeat>
              <a href={product.href} className="group relative flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white p-7 transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-[0_0_28px_-8px_rgba(59,130,246,0.4)] dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-blue-400/40">
                <div className="flex items-center justify-between">
                  <PremiumIcon><Icon>{product.icon}</Icon></PremiumIcon>
                  <span className="gp-home-display text-4xl font-bold text-slate-200 dark:text-white/10">{product.n}</span>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{product.name}</h3>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:border-white/15 dark:text-slate-400">{product.tag}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300/90">{product.line}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{product.body}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
