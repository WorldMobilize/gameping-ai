import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_CARD_INTERACTIVE_LG,
  APP_INLINE_LINK,
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
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
    <AppPageShell>
      <AppSection>
        <p className={APP_KICKER}>SEO collections</p>
        <h1 className={APP_PAGE_TITLE}>
          Curated <span className={APP_ACCENT}>game lists</span>
        </h1>
        <p className={APP_PAGE_LEAD}>
          Starting points for common searches—each page has context, examples, and links to dive
          deeper. When you are ready,{" "}
          <Link href="/recommend" className={APP_INLINE_LINK}>
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
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-cyan-800 dark:text-white dark:group-hover:text-cyan-400">
                    {c.h1}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">{c.intro}</p>
                </div>
                <span className={`mt-4 shrink-0 text-sm font-bold md:mt-0 ${APP_ACCENT}`}>Read</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl border border-cyan-200/80 bg-cyan-50/60 p-6 dark:border-cyan-900/50 dark:bg-cyan-950/30">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Want picks tailored to you—not a static list?
          </p>
          <Link href="/recommend" className={`mt-3 inline-flex ${APP_PRIMARY_CTA_SM}`}>
            Try your own recommendation
          </Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
