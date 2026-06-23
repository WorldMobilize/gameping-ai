/**
 * Static demo data for the (admin-only) GamePing Parties page.
 *
 * No DB, no API, no matchmaking. Shapes are kept simple but future-ready:
 * once Steam import + user signals exist, a real party list would be
 * `{ game, region, language, playstyle, availability, contact }` rows fetched
 * per game — this file just powers the visual demo for now.
 */

export type PartyCategory =
  | "Competitive"
  | "Co-op / PvE"
  | "Survival"
  | "Strategy";

export type PartyGame = {
  title: string;
  reason: string;
};

export type PartyCategoryGroup = {
  /** Anchor id used by the hamburger submenu (e.g. #competitive). */
  id: string;
  category: PartyCategory;
  blurb: string;
  games: PartyGame[];
};

export const PARTY_CATEGORY_GROUPS: PartyCategoryGroup[] = [
  {
    id: "competitive",
    category: "Competitive",
    blurb: "Ranked ladders and team queues where you want squadmates on your level.",
    games: [
      { title: "League of Legends", reason: "Five-stack ranked or normals without the solo-queue coin flip." },
      { title: "Dota 2", reason: "Find a core/support duo that actually communicates." },
      { title: "Counter-Strike 2", reason: "Premier and Faceit squads by rank and region." },
      { title: "Valorant", reason: "Agent-role balanced stacks for ranked nights." },
      { title: "Rocket League", reason: "2s and 3s partners who rotate instead of ball-chase." },
    ],
  },
  {
    id: "co-op",
    category: "Co-op / PvE",
    blurb: "Shared objectives, friendly fire optional, good vibes mandatory.",
    games: [
      { title: "Helldivers 2", reason: "Dive squads for higher difficulties and full loadout coverage." },
      { title: "Monster Hunter: World", reason: "Hunt parties for tough monsters and farming runs." },
      { title: "Deep Rock Galactic", reason: "Balanced four-dwarf teams. Rock and Stone." },
      { title: "Warframe", reason: "Veterans to help new players through the star chart." },
      { title: "Left 4 Dead 2", reason: "Full human teams for campaigns and versus." },
    ],
  },
  {
    id: "survival",
    category: "Survival",
    blurb: "Long-haul servers, base builds, and people who won't grief on night one.",
    games: [
      { title: "7 Days to Die", reason: "Horde-night crews who plan defenses together." },
      { title: "Valheim", reason: "Viking co-op for builds, sailing, and boss fights." },
      { title: "Rust", reason: "Trustworthy group servers over solo wipe chaos." },
      { title: "Project Zomboid", reason: "Co-op survival with roles and a shared base." },
      { title: "The Forest", reason: "Two-to-four player survival without the lone-wolf dread." },
    ],
  },
  {
    id: "strategy",
    category: "Strategy",
    blurb: "The long-session crowd — multi-hour games that need committed players.",
    games: [
      { title: "Civilization VI", reason: "Multiplayer lobbies that finish the game, not rage-quit turn 80." },
      { title: "Hearts of Iron IV", reason: "Coordinated alliances for grand-strategy campaigns." },
      { title: "Total War: Warhammer III", reason: "Co-op campaign partners and multiplayer battles." },
      { title: "Age of Empires IV", reason: "2v2 / 3v3 teams that scout and wall." },
    ],
  },
];

/** Future filters previewed on the example "party list" card. */
export const PARTY_LIST_PREVIEW = {
  game: "Dota 2",
  filters: [
    "Ranked / casual",
    "EU / NA / other region",
    "Voice chat preferred",
    "Evenings / weekends",
    "Beginner friendly",
  ],
} as const;
