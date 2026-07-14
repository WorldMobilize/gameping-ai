import { gameDetailPath } from "@/lib/curated/game-links";

/**
 * Discovery SEO hubs — a SCALABLE content architecture for evergreen pages.
 *
 * One data model powers four page families (Best-of, Genre, Mood, Games-Like).
 * Each family renders through a single shared route template + view, so new
 * pages are added by dropping an entry in DISCOVERY_HUBS — no new components,
 * no layout work. This is the foundation for programmatic expansion later
 * (hundreds of pages), seeded here with a few representative demos.
 *
 * Semantic hierarchy:  /browse  →  /{kind}/{slug}  →  /game/{slug}
 * Internal linking:    hub index → item pages → games + related items.
 */

export type HubKind = "best" | "genre" | "mood";

export type HubGame = {
  title: string;
  /** One-line "why it fits" — the editorial value that makes the page useful. */
  note: string;
};

export type DiscoveryHub = {
  kind: HubKind;
  /** Globally unique slug (also used for related-hub cross-links). */
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  games: HubGame[];
  /** Slugs of related hubs (any kind) for internal linking. */
  related: string[];
};

export const HUB_KIND_META: Record<
  HubKind,
  { label: string; basePath: string; eyebrow: string; blurb: string }
> = {
  best: { label: "Best Games", basePath: "/best", eyebrow: "Best of", blurb: "Editor-style best-of lists by theme." },
  genre: { label: "Genres", basePath: "/genre", eyebrow: "Genre", blurb: "Explore standout games by genre." },
  mood: { label: "By Mood", basePath: "/mood", eyebrow: "Mood", blurb: "Find games that match a feeling." },
};

export const DISCOVERY_HUBS: DiscoveryHub[] = [
  // ── Best-of ────────────────────────────────────────────────
  {
    kind: "best",
    slug: "cozy-games",
    h1: "Best Cozy Games",
    metaTitle: "Best Cozy Games (2026) — Relaxing Picks | GamePing AI",
    metaDescription:
      "A hand-picked list of the best cozy games — warm, low-stress worlds perfect for unwinding, with why each one fits.",
    intro:
      "Cozy games are about comfort, not challenge — gentle loops, soft art, and worlds that feel like a warm blanket. These are the ones worth your evenings.",
    games: [
      { title: "Stardew Valley", note: "The definitive cozy farm sim — endlessly relaxing, endlessly deep." },
      { title: "Spiritfarer", note: "A tender management game about saying goodbye, wrapped in beautiful art." },
      { title: "A Short Hike", note: "A tiny, joyful afternoon of climbing, gliding, and exploring." },
      { title: "Unpacking", note: "Meditative, wordless storytelling told through the things we own." },
      { title: "Dorfromantik", note: "A calm tile-laying builder that turns strategy into a spa day." },
    ],
    related: ["relaxing", "atmospheric"],
  },
  {
    kind: "best",
    slug: "roguelikes",
    h1: "Best Roguelikes",
    metaTitle: "Best Roguelikes & Roguelites (2026) | GamePing AI",
    metaDescription:
      "The best roguelikes and roguelites — run-based games with sharp combat and endless replayability, with why each one fits.",
    intro:
      "Roguelikes turn failure into fuel: every run teaches you something, every death is a fresh start. These deliver the tightest loops in the genre.",
    games: [
      { title: "Hades", note: "A flawless action roguelike where the story advances every time you die." },
      { title: "Dead Cells", note: "Fluid, fast metroidvania combat with brutal, satisfying runs." },
      { title: "Slay the Spire", note: "The deckbuilder that defined a genre — pure strategic depth." },
      { title: "Balatro", note: "Poker reimagined as a roguelike; deceptively simple, wildly addictive." },
      { title: "Risk of Rain 2", note: "Escalating chaos that gets gloriously out of hand in co-op." },
    ],
    related: ["metroidvania", "rpg"],
  },

  // ── Genre ──────────────────────────────────────────────────
  {
    kind: "genre",
    slug: "rpg",
    h1: "Best RPG Games",
    metaTitle: "Best RPGs to Play in 2026 | GamePing AI",
    metaDescription:
      "Standout role-playing games — deep worlds, meaningful choices, and characters you'll remember, with why each one fits.",
    intro:
      "The best RPGs let you live another life: worlds that react to you, choices that matter, and stories that stay with you long after the credits.",
    games: [
      { title: "The Witcher 3: Wild Hunt", note: "A benchmark open-world RPG with side quests better than most main stories." },
      { title: "Disco Elysium", note: "A writing-first RPG where your own mind is the battlefield." },
      { title: "Divinity: Original Sin 2", note: "The gold standard for tactical, systemic party RPGs." },
      { title: "Elden Ring", note: "Open-world discovery and combat mastery at the highest level." },
      { title: "Baldur's Gate 3", note: "Tabletop freedom realized — every plan you imagine actually works." },
    ],
    related: ["metroidvania", "atmospheric"],
  },
  {
    kind: "genre",
    slug: "metroidvania",
    h1: "Best Metroidvania Games",
    metaTitle: "Best Metroidvania Games (2026) | GamePing AI",
    metaDescription:
      "The best metroidvanias — interconnected worlds, ability-gated exploration, and tight combat, with why each one fits.",
    intro:
      "Metroidvanias reward curiosity: a locked door now is a triumph later. These build worlds worth mapping in your head.",
    games: [
      { title: "Hollow Knight", note: "A vast, hand-drawn world with combat and atmosphere in perfect balance." },
      { title: "Ori and the Will of the Wisps", note: "Gorgeous, emotional, and impeccably smooth to control." },
      { title: "Blasphemous", note: "Grim, gorgeous pixel art and punishing, deliberate combat." },
      { title: "Guacamelee! 2", note: "A colorful, combo-heavy take with clever dimension-swapping." },
    ],
    related: ["rpg", "roguelikes"],
  },

  // ── Mood ───────────────────────────────────────────────────
  {
    kind: "mood",
    slug: "relaxing",
    h1: "Relaxing Games to Unwind",
    metaTitle: "Relaxing Games to Unwind & De-stress (2026) | GamePing AI",
    metaDescription:
      "Low-stress games to calm down with — no timers, no pressure, just flow. With why each one fits your evening.",
    intro:
      "Sometimes you want a game that lowers your shoulders. No fail states, no rush — just a quiet loop to sink into.",
    games: [
      { title: "PowerWash Simulator", note: "Oddly hypnotic — the satisfaction of making dirty things clean." },
      { title: "A Short Hike", note: "A gentle, open afternoon with nowhere you have to be." },
      { title: "Dorfromantik", note: "Peaceful puzzle-building where every tile feels right." },
      { title: "Islanders", note: "Minimalist city-building distilled to its most soothing core." },
    ],
    related: ["cozy-games", "atmospheric"],
  },
  {
    kind: "mood",
    slug: "atmospheric",
    h1: "Atmospheric Games Worth Getting Lost In",
    metaTitle: "Most Atmospheric Games (2026) | GamePing AI",
    metaDescription:
      "Games with unforgettable atmosphere — mood, sound, and place that pull you in completely. With why each one fits.",
    intro:
      "Some games are a feeling before they're a challenge. These build worlds so complete you'll want to stay just to breathe them in.",
    games: [
      { title: "Outer Wilds", note: "A curiosity-driven mystery set in a tiny, doomed solar system." },
      { title: "INSIDE", note: "A wordless, dread-soaked journey with masterful pacing." },
      { title: "Journey", note: "A wordless pilgrimage that turns strangers into companions." },
      { title: "Subnautica", note: "Beautiful and terrifying — an ocean world that earns your awe." },
    ],
    related: ["roguelikes", "rpg"],
  },

  // "Games like X" hubs were retired: /curated/games-like-* already covered the
  // same two games, so the pair competed for one query. Old URLs 301 to the
  // curated collection (see next.config.ts).
];

/* ── Lookups & helpers ──────────────────────────────────────── */

export function hubHref(hub: Pick<DiscoveryHub, "kind" | "slug">): string {
  return `${HUB_KIND_META[hub.kind].basePath}/${hub.slug}`;
}

export function getHub(kind: HubKind, slug: string): DiscoveryHub | undefined {
  return DISCOVERY_HUBS.find((h) => h.kind === kind && h.slug === slug);
}

export function getHubBySlug(slug: string): DiscoveryHub | undefined {
  return DISCOVERY_HUBS.find((h) => h.slug === slug);
}

export function hubsByKind(kind: HubKind): DiscoveryHub[] {
  return DISCOVERY_HUBS.filter((h) => h.kind === kind);
}

export function relatedHubs(hub: DiscoveryHub): DiscoveryHub[] {
  return hub.related.map((slug) => getHubBySlug(slug)).filter((h): h is DiscoveryHub => Boolean(h));
}

export function hubGameHref(game: HubGame): string {
  return gameDetailPath(game.title);
}

/** All hub item paths — for the sitemap. */
export function getDiscoveryHubPaths(): string[] {
  return DISCOVERY_HUBS.map((h) => hubHref(h));
}
