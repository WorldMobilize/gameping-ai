import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD_INTERACTIVE_LG,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";
import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Curated game collections | GamePing AI",
  description:
    "Editor-style lists for popular searches—games like Hades, cozy picks, emotional stories, and more. Jump in, then get personalized recommendations.",
  path: "/curated",
});

export default function CuratedIndexPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-curated-bg" />
        <AppSection>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          SEO collections
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          Curated <span className="text-[color:var(--page-accent-strong)]">game lists</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">
          Starting points for common searches—each page has context, examples, and links to dive
          deeper. When you are ready,{" "}
          <Link
            href="/recommend"
            className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
          >
            run your own recommendation
          </Link>{" "}
          with GamePing AI.
        </p>

        <ul className="mt-12 space-y-4">
          {CURATED_COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/curated/${c.slug}`}
                className={`group flex flex-col md:flex-row md:items-center md:justify-between md:gap-6 ${APP_CARD_INTERACTIVE_LG}`}
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-[color:var(--page-accent-text)] dark:text-white dark:group-hover:text-[color:var(--page-accent-text)]">
                    {c.h1}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">{c.intro}</p>
                </div>
                <span className="mt-4 shrink-0 text-sm font-bold text-[color:var(--page-accent-text)] md:mt-0">Read</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl border border-[color:var(--page-accent-border)] bg-white p-6 dark:bg-slate-900/70">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Want picks tailored to you—not a static list?
          </p>
          <Link href="/recommend" className={`mt-3 ${APP_PRIMARY_CTA_ACCENT_SM}`}>
            Try your own recommendation
          </Link>
        </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
