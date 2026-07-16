import { steamHeaderImage } from "@/lib/curated/game-links";

/**
 * Local, static discovery data for /hidden-gems and /games-of-the-week.
 *
 * This is intentionally a plain module of typed mock data — no DB, no API. The
 * shapes mirror what the future API responses should return so the pages can be
 * swapped to live data without UI changes:
 *
 *   Hidden Gems  ← RAWG discovery + Steam/RAWG popularity signals + AI curation
 *                  + ITAD/Steam/CheapShark price enrichment (priceLabel/dealNote).
 *   Games of Week ← ITAD deals + RAWG trending + AI weekly curation + manual picks.
 *
 * To go live later: replace the exported arrays below with a server fetch that
 * returns the same `HiddenGemPick` / `WeeklyGamePick` shapes (e.g. an async
 * `getHiddenGemPicks()` / `getWeeklyGamePicks()` reading from those sources),
 * keep the types, and the views/cards keep working unchanged.
 */

// ---------------------------------------------------------------------------
// Hidden Gems
// ---------------------------------------------------------------------------

export const HIDDEN_GEM_CATEGORIES = [
  "Weird but brilliant",
  "Underplayed RPGs",
  "Short unforgettable games",
  "Cult favorites",
  "Experimental mechanics",
  "Story-first discoveries",
  "Cozy hidden picks",
  "Difficult but rewarding",
] as const;

export type HiddenGemCategory = (typeof HIDDEN_GEM_CATEGORIES)[number];

export type HiddenGemPick = {
  id: string;
  title: string;
  /** lowercased title — aligns with the /game/[slug] route convention. */
  slug: string;
  image: string;
  /** Why it's a hidden gem. */
  reason: string;
  bestFor: string;
  skipIf: string;
  tags: string[];
  discoveryCategory: HiddenGemCategory;
  /** Optional price placeholder until price enrichment is wired. */
  priceLabel?: string;
  /** Where this pick would come from once live (shown subtly). */
  sourceNote?: string;
  // Optional metadata populated by live/cached generation (RAWG). The views
  // ignore these today; they're stored so the data shape matches the rotation
  // spec and is available for future UI without another migration.
  /** RAWG game id, when the pick came from live discovery. */
  gameId?: number;
  /** RAWG rating (0–5), when available. */
  rating?: number | null;
  /** Release date string (YYYY-MM-DD), when available. */
  released?: string | null;
  /** One-line "what makes it stand out" hook. */
  standoutElement?: string;
  // --- Editorial fields exposed explicitly on curated/AI items (Fix 1). These
  // mirror the display fields above but are surfaced under the names the curation
  // contract uses, so previews/consumers can read them directly. ---
  /** Vivid one-line draw (mirrors standoutElement). */
  hook?: string;
  /** Why this game is overlooked / a gem (mirrors reason). */
  whyHidden?: string;
  /** Who will love it (mirrors bestFor). */
  whoFor?: string;
  /** Discovery category as a tag (mirrors discoveryCategory). */
  discoveryTag?: HiddenGemCategory;
  /** Curator confidence 0–100. */
  confidence?: number;
};

export const HIDDEN_GEM_FEATURED: HiddenGemPick = {
  id: "pentiment",
  title: "Pentiment",
  slug: "pentiment",
  image: steamHeaderImage(1205520),
  reason:
    "A hand-illustrated historical murder mystery where your choices, biases, and time pressure shape the truth — there's nothing else that looks or plays quite like it.",
  bestFor: "Players who want a reactive narrative and don't need combat or loot.",
  skipIf: "You're after fast action or systems-driven progression.",
  tags: ["Narrative", "Choices matter", "Historical", "Hand-drawn"],
  discoveryCategory: "Story-first discoveries",
};

export const HIDDEN_GEM_PICKS: HiddenGemPick[] = [
  {
    id: "signalis",
    title: "SIGNALIS",
    slug: "signalis",
    image: steamHeaderImage(1262350),
    reason:
      "Survival horror with a cold retro-future aesthetic and a story that lingers far longer than its runtime.",
    bestFor: "Fans of slow dread, puzzles, and atmosphere over jump scares.",
    skipIf: "You dislike inventory management or deliberate pacing.",
    tags: ["Horror", "Atmospheric", "Retro", "Puzzle"],
    discoveryCategory: "Cult favorites",
  },
  {
    id: "norco",
    title: "NORCO",
    slug: "norco",
    image: steamHeaderImage(1221250),
    reason:
      "A Southern-gothic point-and-click about a fractured family and a strange town — beautiful, weird, and unlike anything else.",
    bestFor: "Readers who love mood, place, and unusual sci-fi.",
    skipIf: "You want action or quick sessions.",
    tags: ["Adventure", "Story-rich", "Surreal"],
    discoveryCategory: "Weird but brilliant",
  },
  {
    id: "citizen-sleeper",
    title: "Citizen Sleeper",
    slug: "citizen sleeper",
    image: steamHeaderImage(1578650),
    reason:
      "A dice-and-survival RPG about scraping by on a derelict station — small, humane, and quietly gripping.",
    bestFor: "People who like tabletop-flavored choices and character writing.",
    skipIf: "You need combat or a big open world.",
    tags: ["RPG", "Narrative", "Sci-fi"],
    discoveryCategory: "Underplayed RPGs",
  },
  {
    id: "paradise-killer",
    title: "Paradise Killer",
    slug: "paradise killer",
    image: steamHeaderImage(1156580),
    reason:
      "An open-ended murder investigation on a vaporwave island where you decide who's guilty and prove it your way.",
    bestFor: "Detectives who want freedom and a wild vibe.",
    skipIf: "You prefer linear, hand-held mysteries.",
    tags: ["Investigation", "Open-ended", "Stylish"],
    discoveryCategory: "Experimental mechanics",
  },
  {
    id: "return-of-the-obra-dinn",
    title: "Return of the Obra Dinn",
    slug: "return of the obra dinn",
    image: steamHeaderImage(653530),
    reason:
      "Reconstruct the fates of a ghost ship's crew from frozen moments — a deduction puzzle with no equal.",
    bestFor: "Logic lovers who enjoy piecing things together.",
    skipIf: "You dislike note-taking or 1-bit visuals.",
    tags: ["Mystery", "Deduction", "Puzzle"],
    discoveryCategory: "Difficult but rewarding",
  },
  {
    id: "the-case-of-the-golden-idol",
    title: "The Case of the Golden Idol",
    slug: "the case of the golden idol",
    image: steamHeaderImage(1677770),
    reason:
      "A chain of grisly scenes you solve by spotting details and naming names — pure, satisfying detective work.",
    bestFor: "Players who want short, brainy mystery vignettes.",
    skipIf: "You want story over puzzle mechanics.",
    tags: ["Detective", "Puzzle", "Short"],
    discoveryCategory: "Short unforgettable games",
  },
  {
    id: "slay-the-princess",
    title: "Slay the Princess",
    slug: "slay the princess",
    image: steamHeaderImage(1989270),
    reason:
      "A branching horror-romance visual novel that mutates with every choice — endlessly surprising and superbly voiced.",
    bestFor: "People who love dialogue, twists, and replay.",
    skipIf: "You want gameplay systems beyond choices.",
    tags: ["Visual novel", "Horror", "Branching"],
    discoveryCategory: "Weird but brilliant",
  },
  {
    id: "dredge",
    title: "DREDGE",
    slug: "dredge",
    image: steamHeaderImage(1562430),
    reason:
      "A cozy fishing loop that slowly curdles into eldritch dread once the sun goes down.",
    bestFor: "Players who like a calm core with a creeping edge.",
    skipIf: "You want pure relaxation with no tension.",
    tags: ["Adventure", "Eerie", "Exploration"],
    discoveryCategory: "Cult favorites",
  },
  {
    id: "outer-wilds",
    title: "Outer Wilds",
    slug: "outer wilds",
    image: steamHeaderImage(753640),
    reason:
      "A handcrafted solar system you unravel through curiosity alone — knowledge is the only upgrade.",
    bestFor: "Explorers who love discovery and a payoff that earns it.",
    skipIf: "You get frustrated without waypoints or progress bars.",
    tags: ["Exploration", "Mystery", "Space"],
    discoveryCategory: "Difficult but rewarding",
  },
  {
    id: "a-short-hike",
    title: "A Short Hike",
    slug: "a short hike",
    image: steamHeaderImage(1055540),
    reason:
      "A gentle afternoon of climbing a mountain, chatting with critters, and just being somewhere nice.",
    bestFor: "Anyone who wants a warm, low-stress evening.",
    skipIf: "You want depth or a long campaign.",
    tags: ["Cozy", "Exploration", "Wholesome"],
    discoveryCategory: "Cozy hidden picks",
  },
];

// ---------------------------------------------------------------------------
// Games of the Week
// ---------------------------------------------------------------------------

export const WEEKLY_CATEGORIES = [
  "Best deal",
  "Hidden pick",
  "Worth replaying",
  "New & interesting",
  "Story pick",
  "Co-op pick",
  "Short weekend game",
] as const;

export type WeeklyCategory = (typeof WEEKLY_CATEGORIES)[number];

/** Why a weekly pick matters *this week* — the editorial angle, not a genre. */
export const WEEKLY_REASON_TYPES = [
  "new-release",
  "rediscovered",
  "trending",
  "hidden-pick",
  "timeless-pick",
  "upcoming-watch",
] as const;

export type WeeklyReasonType = (typeof WEEKLY_REASON_TYPES)[number];

export type WeeklyGamePick = {
  id: string;
  title: string;
  /** lowercased title — aligns with the /game/[slug] route convention. */
  slug: string;
  image: string;
  category: WeeklyCategory;
  whyThisWeek: string;
  bestFor: string;
  /** Optional price placeholder until ITAD/price enrichment is wired. */
  priceLabel?: string;
  /** Optional savings/deal note — rendered in green when it represents savings. */
  dealNote?: string;
  sourceNote?: string;
  // Optional metadata populated by live/cached generation (RAWG). The views
  // ignore these today; stored to match the rotation spec / future UI.
  /** RAWG game id, when the pick came from live discovery. */
  gameId?: number;
  /** RAWG rating (0–5), when available. */
  rating?: number | null;
  /** Release date string (YYYY-MM-DD), when available. */
  released?: string | null;
  /** Vibe/genre tags, when available. */
  tags?: string[];
  // --- Editorial fields exposed explicitly on curated/AI items (Fix 1). ---
  /** Vivid one-line draw. */
  hook?: string;
  /** Why it deserves attention *this week* (editorial angle). */
  reasonType?: WeeklyReasonType;
  /** Who will love it (mirrors bestFor). */
  whoFor?: string;
  /** Curator confidence 0–100. */
  confidence?: number;
};

export const WEEKLY_FEATURED: WeeklyGamePick = {
  id: "obra-dinn-weekly",
  title: "Return of the Obra Dinn",
  slug: "return of the obra dinn",
  image: steamHeaderImage(653530),
  category: "Worth replaying",
  whyThisWeek:
    "A perfect cold-evening puzzle: one sitting, one notebook, and a mystery you'll think about all week. It frequently dips in price, making now a great time to finally play it.",
  bestFor: "Deduction fans who want a complete, self-contained experience.",
};

export const WEEKLY_GAME_PICKS: WeeklyGamePick[] = [
  {
    id: "disco-elysium-weekly",
    title: "Disco Elysium",
    slug: "disco elysium",
    image: steamHeaderImage(632470),
    category: "Best deal",
    whyThisWeek:
      "One of the best-written RPGs ever made, and it regularly drops to a fraction of its price — an easy pickup right now.",
    bestFor: "Readers who want consequence over combat.",
  },
  {
    id: "citizen-sleeper-weekly",
    title: "Citizen Sleeper",
    slug: "citizen sleeper",
    image: steamHeaderImage(1578650),
    category: "Hidden pick",
    whyThisWeek:
      "A short, humane sci-fi RPG that slipped past a lot of people — a great palate cleanser between bigger games.",
    bestFor: "Players who like tabletop-style choices.",
  },
  {
    id: "outer-wilds-weekly",
    title: "Outer Wilds",
    slug: "outer wilds",
    image: steamHeaderImage(753640),
    category: "Worth replaying",
    whyThisWeek:
      "If you've never finished it, this is the week — and if you have, the DLC is worth a fresh loop.",
    bestFor: "Explorers chasing that one-of-a-kind payoff.",
  },
  {
    id: "pentiment-weekly",
    title: "Pentiment",
    slug: "pentiment",
    image: steamHeaderImage(1205520),
    category: "Story pick",
    whyThisWeek:
      "A reactive historical mystery that reads like an illuminated manuscript — ideal for a slower, story-led week.",
    bestFor: "Narrative fans who want their choices to matter.",
  },
  {
    id: "deep-rock-galactic-weekly",
    title: "Deep Rock Galactic",
    slug: "deep rock galactic",
    image: steamHeaderImage(548430),
    category: "Co-op pick",
    whyThisWeek:
      "Rock-solid co-op mining with friends — endlessly repeatable and great for a weekend session. Rock and Stone.",
    bestFor: "Groups who want approachable, fun co-op.",
  },
  {
    id: "case-golden-idol-weekly",
    title: "The Case of the Golden Idol",
    slug: "the case of the golden idol",
    image: steamHeaderImage(1677770),
    category: "Short weekend game",
    whyThisWeek:
      "A tidy run of detective puzzles you can finish over a weekend, with that 'one more case' pull.",
    bestFor: "Mystery solvers short on time.",
  },
  {
    id: "dredge-weekly",
    title: "DREDGE",
    slug: "dredge",
    image: steamHeaderImage(1562430),
    category: "New & interesting",
    whyThisWeek:
      "A cozy-then-creepy fishing adventure that keeps finding new players — easy to recommend, hard to put down.",
    bestFor: "Anyone wanting calm with a sinister undertow.",
  },
  {
    id: "norco-weekly",
    title: "NORCO",
    slug: "norco",
    image: steamHeaderImage(1221250),
    category: "Story pick",
    whyThisWeek:
      "An award-winning Southern-gothic adventure for a week when you want atmosphere over action.",
    bestFor: "Players who read every line and love a strong sense of place.",
  },
];
