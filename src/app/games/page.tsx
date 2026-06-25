import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import GamesDirectoryBrowser from "@/components/games/GamesDirectoryBrowser";
import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Games Directory | GamePing AI",
  description:
    "Browse popular games A–Z, open each title for verified deals and price context, then use AI recommendations to find what to play next.",
  path: "/games",
});

const BREADCRUMBS: GameBreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Games" },
];

export default function GamesDirectoryPage() {
  const titles = DIRECTORY_GAMES.map((g) => g.title);

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-games-bg" />
        <AppSection>
        <PageBreadcrumbs items={BREADCRUMBS} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Directory
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          Games <span className="text-[color:var(--page-accent-strong)]">A–Z</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">
          A compact, curated slice of well-known titles—each links to our game detail page. This
          list will grow over time; for personalized picks, use{" "}
          <Link
            href="/recommend"
            className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
          >
            AI recommendations
          </Link>{" "}
          or explore{" "}
          <Link
            href="/curated"
            className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
          >
            curated collections
          </Link>
          .
        </p>

        <GamesDirectoryBrowser titles={titles} />
        </AppSection>
      </div>
    </AppPageShell>
  );
}
