import Link from "next/link";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_BODY_SM,
  APP_CALLOUT,
  APP_CARD_INTERACTIVE_LG,
  APP_CARD_LG,
  APP_CTA_PANEL,
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  APP_PROSE_HEADING,
} from "@/components/app/app-styles";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/about",
  "About",
  "What GamePing AI is: an ecosystem for gamers — Discovery, the desktop Companion, and WorldMobilize — for how you find, play, and belong."
);

const PILLAR_EYEBROW = "text-xs font-semibold uppercase tracking-[0.35em]";
const PILLAR_BADGE =
  "inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]";

export default function AboutPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AppSection maxWidth="max-w-4xl">
        <p className={APP_KICKER}>About</p>
        <h1 className={APP_PAGE_TITLE}>
          What is <span className={APP_ACCENT}>GamePing AI</span>?
        </h1>

        <p className={APP_PAGE_LEAD}>
          GamePing AI is an ecosystem for gamers — three connected products for how you find,
          play, and belong. It started as an AI game-discovery assistant and is growing into a
          home for everything around the games you love.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Link href="/discover" className={`group flex flex-col ${APP_CARD_INTERACTIVE_LG}`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className={`${PILLAR_EYEBROW} ${APP_ACCENT}`}>Discovery</p>
            </div>
            <h2 className={`mt-3 ${APP_PROSE_HEADING} group-hover:text-[color:var(--page-accent-text)]`}>
              Find games that fit your intent
            </h2>
            <p className={`mt-3 flex-1 ${APP_BODY_SM}`}>
              Describe what you feel like playing and GamePing returns a small set of verified
              games with clear reasons, real prices, and price alerts you can track. Connect Steam
              and your Taste DNA tunes every pick to how you actually play.
            </p>
            <span className="mt-4 text-sm font-bold text-[color:var(--page-accent-text)]">
              Explore Discovery
            </span>
          </Link>

          <Link href="/companion/about" className={`group flex flex-col ${APP_CARD_INTERACTIVE_LG}`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className={`${PILLAR_EYEBROW} ${APP_ACCENT}`}>Companion</p>
              <span className={PILLAR_BADGE}>Alpha</span>
            </div>
            <h2 className={`mt-3 ${APP_PROSE_HEADING} group-hover:text-[color:var(--page-accent-text)]`}>
              Help, right over your game
            </h2>
            <p className={`mt-3 flex-1 ${APP_BODY_SM}`}>
              A desktop overlay that answers your questions mid-session — builds, guides, and
              rich media — without alt-tabbing. Signs in with your GamePing account. Windows, in alpha.
            </p>
            <span className="mt-4 text-sm font-bold text-[color:var(--page-accent-text)]">
              Learn more
            </span>
          </Link>

          <Link href="/worldmobilize" className={`group flex flex-col ${APP_CARD_INTERACTIVE_LG}`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className={`${PILLAR_EYEBROW} ${APP_ACCENT}`}>WorldMobilize</p>
              <span className={PILLAR_BADGE}>Coming soon</span>
            </div>
            <h2 className={`mt-3 ${APP_PROSE_HEADING} group-hover:text-[color:var(--page-accent-text)]`}>
              Something new for gamers
            </h2>
            <p className={`mt-3 flex-1 ${APP_BODY_SM}`}>
              Something new is on the way. It isn&apos;t ready yet — we&apos;re keeping the details
              under wraps until launch.
            </p>
            <span className="mt-4 text-sm font-bold text-[color:var(--page-accent-text)]">
              Preview
            </span>
          </Link>
        </div>

        <div className={`mt-12 ${APP_CARD_LG} p-8`}>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data sources and disclaimers</h2>
          <p className={`mt-3 ${APP_BODY_SM} leading-7`}>
            Recommendations are generated automatically and may not always be perfect. Game
            metadata and prices are sourced from third-party providers (as configured) such as
            RAWG and CheapShark. Prices and availability may change. Always verify final prices
            and purchase details on the store before buying.
          </p>
        </div>

        <div className={`mt-10 ${APP_CALLOUT}`}>
          This page is provided for general informational purposes and does not constitute legal
          advice.
        </div>

        <div className={`mt-14 ${APP_CTA_PANEL} md:flex md:items-center md:justify-between md:gap-8`}>
          <div>
            <p className={APP_KICKER}>Next step</p>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              Ready to discover your next game?
            </p>
          </div>
          <Link href="/recommend" className={`mt-6 md:mt-0 ${APP_PRIMARY_CTA_SM}`}>
            Open GamePing AI
          </Link>
        </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
