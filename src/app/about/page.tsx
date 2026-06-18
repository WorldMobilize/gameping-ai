import Link from "next/link";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_BODY_SM,
  APP_CALLOUT,
  APP_CARD,
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
  "What GamePing AI is, how recommendations and pricing work, and how to get in touch."
);

export default function AboutPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-4xl">
        <p className={APP_KICKER}>About</p>
        <h1 className={APP_PAGE_TITLE}>
          What is <span className={APP_ACCENT}>GamePing AI</span>?
        </h1>

        <p className={APP_PAGE_LEAD}>
          GamePing AI is an AI-powered game recommendation assistant. You describe what you feel
          like playing, and GamePing responds with a small set of verified games—with metadata and
          best-effort deal-aware price lookups.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className={APP_CARD_LG}>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${APP_ACCENT}`}>
              Discover
            </p>
            <h2 className={`mt-3 ${APP_PROSE_HEADING}`}>Find games that fit your intent</h2>
            <p className={`mt-3 ${APP_BODY_SM}`}>
              The goal is coherence over noise. Recommendations are generated automatically and
              may not always be perfect.
            </p>
          </div>

          <div className={APP_CARD_LG}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">
              Track
            </p>
            <h2 className={`mt-3 ${APP_PROSE_HEADING}`}>Save searches for later</h2>
            <p className={`mt-3 ${APP_BODY_SM}`}>
              Save your preferences and results so you can revisit them from your dashboard.
            </p>
          </div>

          <div className={APP_CARD_LG}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">
              Alerts
            </p>
            <h2 className={`mt-3 ${APP_PROSE_HEADING}`}>Future deal alerts</h2>
            <p className={`mt-3 ${APP_BODY_SM}`}>
              The roadmap includes periodic price checks and notifications when tracked games hit
              your budget.
            </p>
          </div>
        </div>

        <div className={`mt-12 ${APP_CARD_LG} p-8`}>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data sources and disclaimers</h2>
          <p className={`mt-3 ${APP_BODY_SM} leading-7`}>
            Game metadata and prices are sourced from third-party providers (as configured) such
            as RAWG and CheapShark. Prices and availability may change. Always verify final prices
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
    </AppPageShell>
  );
}
