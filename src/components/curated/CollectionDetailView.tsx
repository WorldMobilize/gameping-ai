import Link from "next/link";
import CuratedGameArt from "@/components/CuratedGameArt";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD_INTERACTIVE_LG,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import {
  COLLECTIONS_INDEX,
  GAMES_LIKE_INDEX,
  collectionPath,
  isGamesLikeSlug,
} from "@/lib/curated/collection-kinds";
import type { CuratedCollection } from "@/lib/curated/collections";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

/** Inline link in the current page accent (violet on collection pages). */
const ACCENT_LINK =
  "font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline";

/**
 * One collection page, shared by /games-like/[slug] and /collections/[slug].
 * The two families render identically — only where they came from differs, and
 * that is what the breadcrumb and the "back" link follow.
 */
export default function CollectionDetailView({
  collection,
  others,
}: {
  collection: CuratedCollection;
  others: CuratedCollection[];
}) {
  const gamesLike = isGamesLikeSlug(collection.slug);
  const indexHref = gamesLike ? GAMES_LIKE_INDEX : COLLECTIONS_INDEX;
  const indexLabel = gamesLike ? "Games like…" : "Curated Collections";

  const breadcrumbs: GameBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: indexLabel, href: indexHref },
    { label: collection.h1 },
  ];

  return (
    <AppPageShell hideAmbient>
      <article className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-curated-bg" />
        <AppSection maxWidth="max-w-3xl">
          <PageBreadcrumbs items={breadcrumbs} theme="dark" className="mb-6 flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65" />
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
            {gamesLike ? "Games like…" : "Curated collection"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            {collection.h1}
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-200">{collection.intro}</p>

          <p className="mt-6 text-sm leading-7 text-slate-300">
            For recommendations shaped to your budget, platform, and mood, use{" "}
            <Link href="/recommend" className={ACCENT_LINK}>
              GamePing AI recommendations
            </Link>
            . You can also browse our{" "}
            <Link href="/games" className={ACCENT_LINK}>
              games directory (A–Z)
            </Link>{" "}
            or return to{" "}
            <Link href={indexHref} className={ACCENT_LINK}>
              {indexLabel.toLowerCase()}
            </Link>
            .
          </p>

          <div className="mt-10 rounded-3xl border border-[color:var(--page-accent-border)] bg-white p-6 dark:bg-slate-900/70">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Try your own recommendation</p>
            <Link href="/recommend" className={`mt-3 ${APP_PRIMARY_CTA_ACCENT_SM}`}>
              Open GamePing AI
            </Link>
          </div>
        </AppSection>

        <AppSection maxWidth="max-w-5xl" className="pt-0">
          <h2 className="text-xl font-bold text-white md:text-2xl">Games in this list</h2>
          <p className="mt-2 text-sm text-slate-300">
            Each entry explains why it fits this collection—tap through to the game page when
            available.
          </p>

          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {collection.games.map((game) => (
              <li
                key={game.title}
                className={`group flex flex-col overflow-hidden ${APP_CARD_INTERACTIVE_LG} p-0 hover:-translate-y-0.5`}
              >
                <CuratedGameArt
                  src={game.image}
                  alt={`${game.title} header art`}
                  sizes="(max-width: 768px) 100vw, 520px"
                  variant="carousel"
                />

                <div className="flex flex-1 flex-col justify-center p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{game.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{game.whyItFits}</p>
                  <Link
                    href={`${gameDetailPath(game.title)}?from=curated`}
                    className={`mt-4 inline-flex w-fit ${APP_SECONDARY_CTA}`}
                  >
                    View game details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </AppSection>

        {others.length > 0 ? (
          <AppSection maxWidth="max-w-5xl" className="border-t border-[color:var(--page-accent-border)] pt-12">
            <h2 className="text-xl font-bold text-white">Related collections</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={collectionPath(c.slug)}
                    className="inline-flex rounded-full border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-text)] dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    {c.h1}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                Discover more
              </span>
              <Link href="/hidden-gems" className={ACCENT_LINK}>
                Hidden Gems
              </Link>
              <Link href="/games-of-the-week" className={ACCENT_LINK}>
                Games of the Week
              </Link>
              <Link href="/recommend" className={ACCENT_LINK}>
                AI recommendations
              </Link>
            </div>
          </AppSection>
        ) : null}
      </article>
    </AppPageShell>
  );
}
