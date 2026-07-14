import AppPageShell from "@/components/app/AppPageShell";
import GamesLikeHubView, {
  type CategoryRow,
  type GamesLikeCard,
} from "@/components/curated/GamesLikeHubView";
import type { RowCard } from "@/components/curated/CollectionRow";
import { collectionPath } from "@/lib/curated/collection-kinds";
import { loadCollectionSubjectArt } from "@/lib/curated/collection-game-stats";
import { CURATED_COLLECTIONS, type CuratedCollection } from "@/lib/curated/collections";
import {
  ALL_LISTS_BLURB,
  ALL_LISTS_LABEL,
  EDITOR_PICKS_BLURB,
  EDITOR_PICKS_LABEL,
  EDITOR_PICKS_SLUGS,
  GAMES_LIKE_CATEGORIES,
  RECENTLY_ADDED_BLURB,
  RECENTLY_ADDED_LABEL,
  RECENTLY_ADDED_MAX,
} from "@/lib/curated/games-like-categories";
import { DISCOVERY_HUBS, hubHref } from "@/lib/seo/discovery-hubs";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Games like… — start from a game you love | GamePing AI",
  description:
    "Loved a game? Find what to play next. Curated “games like” lists for Hades, Skyrim, Elden Ring, Stardew Valley and more—then get picks tuned to you.",
  path: "/games-like",
});

/** Themed collections surfaced as a way out of the "start from one game" frame. */
const THEME_SLUGS = [
  "best-cozy-games",
  "best-roguelike-games",
  "best-soulslike-games",
  "best-open-world-games",
  "games-with-deep-stories",
  "beautiful-indie-games",
];

/**
 * Chip-length names for the discovery hubs. Their h1s are written for the page they
 * head ("Atmospheric Games Worth Getting Lost In") and are far too long for a chip.
 */
const HUB_CHIP_LABELS: Record<string, string> = {
  "cozy-games": "Cozy",
  roguelikes: "Roguelike",
  rpg: "RPG",
  metroidvania: "Metroidvania",
  relaxing: "Relaxing",
  atmospheric: "Atmospheric",
};

/**
 * "Games like Hades" → "Hades", so the card can lead with the game, not the label.
 *
 * Deliberately from the h1 and not from the RAWG art title: a few lists look their
 * subject up under its full name ("Grand Theft Auto V") while the page is titled
 * with the one people search for ("GTA V"). The card has to agree with the page it
 * links to, so the h1 wins here and RAWG is only asked for the image.
 */
function subjectTitle(collection: CuratedCollection): string {
  const match = /^games\s+like\s+(.+)$/i.exec(collection.h1.trim());
  return match ? match[1].trim() : collection.h1;
}

/**
 * "Games like X" lives here, grouped into category rows. Themed lists (cozy,
 * emotional, best-of…) live on /collections and are only linked from one row.
 */
export default async function GamesLikeIndexPage() {
  const gamesLike = CURATED_COLLECTIONS.filter((c) => c.slug.startsWith("games-like-"));

  const subjectArt = await loadCollectionSubjectArt(gamesLike);

  const toCard = (c: CuratedCollection): GamesLikeCard => ({
    slug: c.slug,
    path: collectionPath(c.slug),
    title: subjectTitle(c),
    intro: c.intro,
    gameCount: c.games.length,
    label: "Games like",
    // RAWG key art for the game the list starts FROM. The first pick's Steam header
    // is only a fallback: a "Games like Hades" card showing Dead Cells would be a
    // small lie about where the list begins.
    image: subjectArt[c.slug]?.image ?? c.games[0]?.image ?? null,
  });

  const cardBySlug = new Map(gamesLike.map((c) => [c.slug, toCard(c)]));

  const pick = (slugs: string[]): GamesLikeCard[] =>
    slugs.map((slug) => cardBySlug.get(slug)).filter((c): c is GamesLikeCard => Boolean(c));

  const editorPicks = pick(EDITOR_PICKS_SLUGS);

  const rows: CategoryRow[] = [];

  /* Leads the page. "Recently added" is only as real as the dates behind it: a list
     earns its place here by carrying an `addedAt`, and the row disappears entirely
     when none does. That is the point — the alternative is a row that says "new"
     about lists which have been sitting there since launch. */
  const recentlyAdded = gamesLike
    .filter((c) => c.addedAt)
    .sort((a, b) => (b.addedAt as string).localeCompare(a.addedAt as string))
    .slice(0, RECENTLY_ADDED_MAX)
    .map(toCard);

  if (recentlyAdded.length > 0) {
    rows.push({
      id: "recently-added",
      label: RECENTLY_ADDED_LABEL,
      blurb: RECENTLY_ADDED_BLURB,
      cards: recentlyAdded,
      size: "lead",
    });
  }

  if (editorPicks.length > 0) {
    rows.push({
      id: "editors-picks",
      label: EDITOR_PICKS_LABEL,
      blurb: EDITOR_PICKS_BLURB,
      cards: editorPicks,
      // Lead size only while it opens the page; once "Recently added" exists, that
      // row takes the weight and this one settles into the stack.
      size: recentlyAdded.length > 0 ? "standard" : "lead",
    });
  }

  /* One row per category, in the order the category file declares them. A list can
     appear in several — the same way a title sits on several shelves of a streaming
     home page. */
  for (const category of GAMES_LIKE_CATEGORIES) {
    const cards = pick(category.slugs);
    if (cards.length > 0) {
      rows.push({
        id: category.id,
        label: category.label,
        blurb: category.blurb,
        cards,
      });
    }
  }

  /* Everything, always — and the row that keeps every collection page linked from
     the hub, whatever the categories above happen to cover. Never make it
     conditional: a list nobody categorised would silently vanish from the site. */
  rows.push({
    id: "all-lists",
    label: ALL_LISTS_LABEL,
    blurb: ALL_LISTS_BLURB,
    cards: gamesLike.map(toCard),
  });

  const themes: RowCard[] = THEME_SLUGS.map((slug) =>
    CURATED_COLLECTIONS.find((c) => c.slug === slug)
  )
    .filter((c): c is CuratedCollection => Boolean(c))
    .map((c) => ({
      slug: c.slug,
      path: collectionPath(c.slug),
      title: c.h1,
      gameCount: c.games.length,
      // Themed lists have no "subject" game, so the first pick's art stands in.
      image: c.games[0]?.image ?? null,
    }));

  const hubs = DISCOVERY_HUBS.map((h) => ({
    label: HUB_CHIP_LABELS[h.slug] ?? h.h1,
    href: hubHref(h),
  }));

  const totalGames = gamesLike.reduce((sum, c) => sum + c.games.length, 0);

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-curated-bg" />
        <GamesLikeHubView
          heroCards={editorPicks}
          rows={rows}
          themes={themes}
          hubs={hubs}
          totalLists={gamesLike.length}
          totalGames={totalGames}
        />
      </div>
    </AppPageShell>
  );
}
