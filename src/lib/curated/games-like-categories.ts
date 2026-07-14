/**
 * The rows of /games-like — a streaming-home-page model.
 *
 * All 63 "games like X" lists are assigned here, and a list belongs to every
 * category that genuinely describes it: "Games like Elden Ring" is an open world
 * AND a soulslike AND an RPG AND fantasy, and someone browsing any of those shelves
 * should find it there. That is the whole point of the model — it is not duplication
 * to be pruned.
 *
 * Rules this file is meant to keep easy:
 *   - New category → add an entry here. Nothing else to touch.
 *   - New list → drop its slug into every category that fits it.
 *   - A single-list category is fine; it renders as a one-card row.
 *   - A list in NO category is never lost: the page always ends with an "All lists"
 *     row, which is also what keeps every collection page linked from the hub.
 *
 * Row order below IS the page order. "Recently added" is built separately and always
 * leads; "Editor's picks" follows it.
 */

export type GamesLikeCategory = {
  id: string;
  label: string;
  /** One line under the row title — what the row is for. */
  blurb: string;
  /** Data slugs, in the order they should appear in the rail. */
  slugs: string[];
};

/**
 * "Recently added" is built from `addedAt` on the collection data — set it by hand
 * when you actually publish a list. Lists with no date never appear here, so the row
 * stays hidden until a real one exists. It is never faked.
 */
export const RECENTLY_ADDED_LABEL = "Recently added";
export const RECENTLY_ADDED_BLURB = "Fresh lists, newest first.";
export const RECENTLY_ADDED_MAX = 12;

/**
 * The curated lead row. NOT "most viewed" or "trending" — we have no traffic data,
 * and a row that claims to show what other people are watching has to actually know.
 */
export const EDITOR_PICKS_SLUGS = [
  "games-like-hades",
  "games-like-elden-ring",
  "games-like-disco-elysium",
  "games-like-hollow-knight",
  "games-like-stardew-valley",
  "games-like-minecraft",
];

export const EDITOR_PICKS_LABEL = "Editor’s picks";
export const EDITOR_PICKS_BLURB = "Where we’d start, if we were you.";

/** Prefix every slug once, so the lists below stay readable. */
const gl = (...names: string[]) => names.map((n) => `games-like-${n}`);

export const GAMES_LIKE_CATEGORIES: GamesLikeCategory[] = [
  {
    id: "open-world",
    label: "Open world",
    blurb: "Huge maps and long horizons.",
    slugs: gl(
      "elden-ring",
      "skyrim",
      "the-witcher-3",
      "red-dead-redemption-2",
      "cyberpunk-2077",
      "gta-5",
      "zelda-breath-of-the-wild",
      "horizon-zero-dawn",
      "ghost-of-tsushima",
      "fallout-new-vegas",
      "hogwarts-legacy",
      "no-mans-sky",
      "forza-horizon-5",
      "ark-survival-evolved"
    ),
  },
  {
    id: "rpg",
    label: "RPG",
    blurb: "Builds, choices, and a character to grow.",
    slugs: gl(
      "baldurs-gate-3",
      "disco-elysium",
      "skyrim",
      "the-witcher-3",
      "elden-ring",
      "cyberpunk-2077",
      "divinity-original-sin-2",
      "mass-effect",
      "fallout-new-vegas",
      "diablo-4",
      "hogwarts-legacy",
      "monster-hunter-world",
      "undertale"
    ),
  },
  {
    id: "jrpg",
    label: "JRPG",
    blurb: "Japanese role-playing, from turn-based to social sim.",
    slugs: gl("persona-5", "pokemon", "undertale"),
  },
  {
    id: "story-rich",
    label: "Story rich",
    blurb: "Writing worth slowing down for.",
    slugs: gl(
      "disco-elysium",
      "the-last-of-us",
      "baldurs-gate-3",
      "the-witcher-3",
      "red-dead-redemption-2",
      "cyberpunk-2077",
      "mass-effect",
      "god-of-war",
      "bioshock",
      "ghost-of-tsushima",
      "fallout-new-vegas",
      "persona-5",
      "undertale",
      "it-takes-two",
      "stray"
    ),
  },
  {
    id: "soulslike",
    label: "Soulslike",
    blurb: "Punishing, deliberate, worth it.",
    slugs: gl("elden-ring", "dark-souls", "sekiro"),
  },
  {
    id: "action",
    label: "Action",
    blurb: "Tight controls and hard-earned mastery.",
    slugs: gl(
      "hades",
      "hollow-knight",
      "elden-ring",
      "dark-souls",
      "sekiro",
      "god-of-war",
      "doom-eternal",
      "resident-evil-4",
      "dead-cells",
      "binding-of-isaac",
      "vampire-survivors",
      "monster-hunter-world",
      "zelda-breath-of-the-wild",
      "horizon-zero-dawn",
      "ghost-of-tsushima",
      "gta-5",
      "terraria"
    ),
  },
  {
    id: "roguelike",
    label: "Roguelike",
    blurb: "Die, learn, build, go again.",
    slugs: gl(
      "hades",
      "slay-the-spire",
      "dead-cells",
      "binding-of-isaac",
      "vampire-survivors",
      "balatro",
      "dont-starve"
    ),
  },
  {
    id: "deckbuilder",
    label: "Deckbuilder",
    blurb: "Every card is a decision.",
    slugs: gl("slay-the-spire", "balatro"),
  },
  {
    id: "metroidvania",
    label: "Metroidvania",
    blurb: "One world, unlocked one ability at a time.",
    slugs: gl("hollow-knight", "dead-cells"),
  },
  {
    id: "platformer",
    label: "Platformer",
    blurb: "Jump, fall, try again.",
    slugs: gl("celeste", "hollow-knight", "it-takes-two"),
  },
  {
    id: "shooter",
    label: "Shooter",
    blurb: "Guns, and a reason to keep firing.",
    slugs: gl("doom-eternal", "bioshock", "deep-rock-galactic", "resident-evil-4"),
  },
  {
    id: "survival",
    label: "Survival",
    blurb: "Scavenge, shelter, make it to morning.",
    slugs: gl(
      "minecraft",
      "valheim",
      "subnautica",
      "rust",
      "ark-survival-evolved",
      "project-zomboid",
      "terraria",
      "dont-starve",
      "palworld",
      "no-mans-sky"
    ),
  },
  {
    id: "sandbox-crafting",
    label: "Sandbox & crafting",
    blurb: "The world is raw material.",
    slugs: gl("minecraft", "terraria", "valheim", "rust", "satisfactory", "rimworld"),
  },
  {
    id: "simulation",
    label: "Simulation & management",
    blurb: "Systems to tinker with until sunrise.",
    slugs: gl(
      "rimworld",
      "cities-skylines",
      "factorio",
      "the-sims-4",
      "stardew-valley",
      "satisfactory"
    ),
  },
  {
    id: "automation",
    label: "Automation",
    blurb: "The factory must grow.",
    slugs: gl("factorio", "satisfactory"),
  },
  {
    id: "strategy",
    label: "Strategy",
    blurb: "Win it in your head before you win it on the board.",
    slugs: gl("civilization-6", "xcom-2", "rimworld", "divinity-original-sin-2", "slay-the-spire"),
  },
  {
    id: "co-op",
    label: "Co-op & multiplayer",
    blurb: "Better with someone else on the call.",
    slugs: gl(
      "it-takes-two",
      "deep-rock-galactic",
      "valheim",
      "among-us",
      "lethal-company",
      "phasmophobia",
      "portal-2",
      "rust",
      "palworld",
      "monster-hunter-world",
      "divinity-original-sin-2",
      "ark-survival-evolved"
    ),
  },
  {
    id: "horror",
    label: "Horror",
    blurb: "Games that want you scared.",
    slugs: gl("resident-evil-4", "phasmophobia", "lethal-company", "project-zomboid", "the-last-of-us"),
  },
  {
    id: "cozy",
    label: "Cozy",
    blurb: "No fail state, nothing chasing you.",
    slugs: gl("stardew-valley", "animal-crossing", "stray", "the-sims-4"),
  },
  {
    id: "farming-life-sim",
    label: "Farming & life sim",
    blurb: "Plant, build, belong somewhere.",
    slugs: gl("stardew-valley", "animal-crossing", "the-sims-4", "palworld"),
  },
  {
    id: "creature-collection",
    label: "Creature collection",
    blurb: "Catch them, raise them, send them into battle.",
    slugs: gl("pokemon", "palworld", "monster-hunter-world"),
  },
  {
    id: "exploration",
    label: "Exploration & mystery",
    blurb: "Worlds that reward curiosity over combat.",
    slugs: gl("outer-wilds", "subnautica", "no-mans-sky", "stray", "zelda-breath-of-the-wild"),
  },
  {
    id: "puzzle",
    label: "Puzzle",
    blurb: "The answer is in the room.",
    slugs: gl("portal-2"),
  },
  {
    id: "racing",
    label: "Racing",
    blurb: "Speed, and a road to spend it on.",
    slugs: gl("forza-horizon-5"),
  },
  {
    id: "post-apocalyptic",
    label: "Post-apocalyptic",
    blurb: "After everything went wrong.",
    slugs: gl("fallout-new-vegas", "the-last-of-us", "project-zomboid", "horizon-zero-dawn"),
  },
  {
    id: "sci-fi",
    label: "Sci-fi",
    blurb: "Space, machines, and futures gone sideways.",
    slugs: gl(
      "mass-effect",
      "cyberpunk-2077",
      "outer-wilds",
      "subnautica",
      "no-mans-sky",
      "bioshock",
      "portal-2",
      "horizon-zero-dawn",
      "stray",
      "deep-rock-galactic",
      "xcom-2",
      "factorio",
      "satisfactory",
      "rimworld"
    ),
  },
  {
    id: "fantasy",
    label: "Fantasy",
    blurb: "Swords, gods, and places that never were.",
    slugs: gl(
      "elden-ring",
      "dark-souls",
      "skyrim",
      "the-witcher-3",
      "baldurs-gate-3",
      "zelda-breath-of-the-wild",
      "hades",
      "hollow-knight",
      "god-of-war",
      "diablo-4",
      "divinity-original-sin-2",
      "hogwarts-legacy",
      "valheim"
    ),
  },
];

/** Every list, always. The row that guarantees each collection page is linked. */
export const ALL_LISTS_LABEL = "All “games like” lists";
export const ALL_LISTS_BLURB = "Every collection we’ve made so far.";
