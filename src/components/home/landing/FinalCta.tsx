import Link from "next/link";
import type { ReactNode } from "react";
import PremiumIcon from "@/components/home/landing/PremiumIcon";
import Reveal from "@/components/home/landing/Reveal";
import {
  GLYPH_COMPANION,
  GLYPH_DISCOVERY,
  GLYPH_WORLDMOBILIZE,
} from "@/components/home/landing/landing-icons";

/**
 * Closing band before the footer. It closes on the ecosystem, not on one product:
 * three doors — Discovery, Companion, WorldMobilize — instead of a single
 * "try a recommendation" funnel. WorldMobilize stays locked and unexplained.
 * Presentation only; links to existing pages.
 */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const DOORS: { name: string; line: string; href: string; icon: ReactNode; locked?: boolean }[] = [
  { name: "Discovery", line: "Find your next game", href: "/discover", icon: GLYPH_DISCOVERY },
  { name: "Companion", line: "Play with help beside you", href: "/companion/about", icon: GLYPH_COMPANION },
  { name: "WorldMobilize", line: "Coming soon", href: "/worldmobilize", icon: GLYPH_WORLDMOBILIZE, locked: true },
];

export default function FinalCta({ className = "" }: { className?: string }) {
  return (
    <section className={`py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-b from-blue-600/[0.08] to-transparent p-10 text-center sm:p-16 dark:border-blue-400/20">
            {/* Soft accent glow */}
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />

            <div className="relative">
              <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300/80">
                One connected world
              </p>
              <h2 className="gp-home-display mx-auto mt-4 max-w-2xl text-balance text-[2.25rem] font-bold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                One account. Three products.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Pick where you want to start. Free, no credit card — the rest is waiting whenever you are.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {DOORS.map((door) => (
                  <Link
                    key={door.name}
                    href={door.href}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-blue-400/40"
                  >
                    <PremiumIcon className="h-12 w-12 transition-transform duration-300 group-hover:scale-105">
                      <Icon>{door.icon}</Icon>
                    </PremiumIcon>
                    <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                      {door.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      {door.locked ? (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                      ) : null}
                      {door.line}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
