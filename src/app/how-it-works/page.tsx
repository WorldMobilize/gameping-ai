import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import {
  APP_CARD_INTERACTIVE_LG,
  APP_CARD_LG,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { HOW_IT_WORKS_PAGES } from "@/lib/how-it-works/pages";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "How GamePing works — features & how to use it | GamePing AI",
  description:
    "How GamePing turns plain-language taste into game recommendations: describe your taste, get explained matches, keep discovering, and sync Steam for a personal GamePing DNA.",
  path: "/how-it-works",
});

const BREADCRUMBS: GameBreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Features" },
];

export default function HowItWorksIndexPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AppSection>
          <PageBreadcrumbs items={BREADCRUMBS} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
            How GamePing works
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            Find games <span className="text-[color:var(--page-accent-strong)]">worth your time</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-200">
            Describe what you feel like playing and GamePing turns it into picks with clear reasons,
            real prices, and price alerts. Here&apos;s how each part works—then{" "}
            <Link
              href="/recommend"
              className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
            >
              try a recommendation
            </Link>{" "}
            yourself.
          </p>

          <ul className="mt-12 space-y-4">
            {HOW_IT_WORKS_PAGES.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/how-it-works/${page.slug}`}
                  className={`group flex flex-col md:flex-row md:items-center md:justify-between md:gap-6 ${APP_CARD_INTERACTIVE_LG}`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-[color:var(--page-accent-text)] dark:text-white dark:group-hover:text-[color:var(--page-accent-text)]">
                        {page.navLabel}
                      </h2>
                      {page.kicker ? (
                        <span className="inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]">
                          {page.kicker}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {page.body}
                    </p>
                  </div>
                  <span className="mt-4 shrink-0 text-sm font-bold text-[color:var(--page-accent-text)] md:mt-0">
                    Read
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={`mt-12 ${APP_CARD_LG}`}>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Ready to find your next game?
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Run a free recommendation, or unlock Steam sync and personalized picks with Premium.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/recommend" className={APP_PRIMARY_CTA_ACCENT_SM}>
                Try GamePing
              </Link>
              <Link href="/upgrade" className={APP_SECONDARY_CTA}>
                See Premium
              </Link>
            </div>
          </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
