import { steamHeaderImage } from "@/lib/curated/game-links";

/**
 * Static demo data for the personal premium pages:
 *   /weekly-picks · /deals-for-you · /monthly-recap
 *
 * No DB, no API, no recommendation/pricing calls — these are mock structures
 * shaped like the eventual personalized payloads so the UI can be wired to live
 * data later without changes.
 *
 * Future replacement (per page): a server fetch that merges the user's
 * Supabase signals (saved games, tracked games, recommendation history, ignored
 * games, price alerts, taste profile) + Steam import + OpenAI weekly curation,
 * returning these same shapes:
 *   getWeeklyPicks(userId)   → WeeklyPicksDemoData
 *   getDealsForYou(userId)   → DealsForYouDemoData   (ITAD/Steam/CheapShark prices)
 *   getMonthlyRecap(userId)  → MonthlyRecapDemoData
 * Until then everything below is clearly demo/sample content.
 */

// ---------------------------------------------------------------------------
// Weekly Picks — "Netflix recommendations for games"
// ---------------------------------------------------------------------------

export type WeeklyPickCardData = {
  id: string;
  title: string;
  image: string;
  matchScore: number;
  category: string;
  whyPicked: string[];
  possibleConcerns: string[];
};

export type MoodOption = {
  id: string;
  label: string;
  description: string;
};

export type WeeklyPicksDemoData = {
  picks: WeeklyPickCardData[];
  moods: MoodOption[];
  tasteEvolution: { more: string[]; less: string[] };
};

export const WEEKLY_PICKS_DEMO_DATA: WeeklyPicksDemoData = {
  picks: [
    {
      id: "bg3",
      title: "Baldur's Gate 3",
      image: steamHeaderImage(1086940),
      matchScore: 94,
      category: "Deep RPG",
      whyPicked: [
        "You enjoy meaningful choices",
        "You like deep, reactive worlds",
        "Long progression fits your style",
      ],
      possibleConcerns: ["Slower pacing", "Tactical, turn-based combat"],
    },
    {
      id: "disco-elysium",
      title: "Disco Elysium",
      image: steamHeaderImage(632470),
      matchScore: 91,
      category: "Story-first",
      whyPicked: [
        "Dialogue and consequence over combat",
        "Rewards curiosity and reading",
        "Strong, unusual writing",
      ],
      possibleConcerns: ["Almost no combat", "Very text-heavy"],
    },
    {
      id: "outer-wilds",
      title: "Outer Wilds",
      image: steamHeaderImage(753640),
      matchScore: 89,
      category: "Exploration",
      whyPicked: [
        "Discovery is the whole reward",
        "Open-ended investigation",
        "Memorable one-of-a-kind payoff",
      ],
      possibleConcerns: ["No waypoints or hand-holding", "Time-loop pressure"],
    },
    {
      id: "pentiment",
      title: "Pentiment",
      image: steamHeaderImage(1205520),
      matchScore: 87,
      category: "Narrative",
      whyPicked: [
        "Choices shape the story",
        "Rich historical setting",
        "Distinctive hand-drawn style",
      ],
      possibleConcerns: ["No action", "Deliberate pacing"],
    },
  ],
  moods: [
    { id: "relaxing", label: "Relaxing week", description: "Low-stress games to wind down with." },
    { id: "challenge", label: "Need a challenge", description: "Tough, rewarding games that test you." },
    { id: "short", label: "Short weekend game", description: "Something you can finish in a sitting or two." },
    { id: "long", label: "Long adventure", description: "A big world to sink dozens of hours into." },
    { id: "hidden", label: "Hidden discovery", description: "Overlooked games you probably missed." },
    { id: "different", label: "Something different", description: "Step outside your usual genres." },
  ],
  tasteEvolution: {
    more: ["Story-rich games", "Exploration", "RPG choices"],
    less: ["Repetitive grinding"],
  },
};

// ---------------------------------------------------------------------------
// Deals For You — "a Steam sale filtered through my taste"
// ---------------------------------------------------------------------------

/** Deal label tier — reflects how strong the current price is, not whether it's "on sale". */
export type DealLabel = "Great deal" | "Good price" | "Price found" | "Watch price";

export type DealCardData = {
  id: string;
  title: string;
  image: string;
  matchScore: number;
  whyDealFits: string[];
  /** Tiered label so we can surface taste matches even without a steep discount. */
  dealLabel: DealLabel;
  /** Current/best price (sale or regular). Absent when no verified price exists. */
  newPrice?: string;
  /** Original price — present only when there's a genuine discount. */
  oldPrice?: string;
  /** Discount badge (e.g. "-45%") — present only when there's a genuine discount. */
  discount?: string;
  /** External store deal/price link (drives "View deal"). */
  dealUrl?: string;
  /** Why now is a good time to act on this deal. */
  whyNow?: string;
  /** Taste-fit confidence. */
  confidence?: "high" | "medium" | "low";
  /** Store/provider the price came from (e.g. "Steam"). */
  store?: string;
};

export type DealsForYouDemoData = {
  deals: DealCardData[];
  categories: MoodOption[];
  radar: { watching: number; dealsFound: number };
};

export const DEALS_FOR_YOU_DEMO_DATA: DealsForYouDemoData = {
  deals: [
    {
      id: "cyberpunk",
      title: "Cyberpunk 2077",
      image: steamHeaderImage(1091500),
      oldPrice: "$59.99",
      newPrice: "$19.99",
      discount: "-67%",
      dealLabel: "Great deal",
      matchScore: 92,
      whyDealFits: ["Open worlds", "RPG choices", "Dark atmosphere"],
    },
    {
      id: "witcher3",
      title: "The Witcher 3: Wild Hunt",
      image: steamHeaderImage(292030),
      oldPrice: "$39.99",
      newPrice: "$9.99",
      discount: "-75%",
      dealLabel: "Great deal",
      matchScore: 90,
      whyDealFits: ["Story-rich quests", "Big open world", "Meaningful choices"],
    },
    {
      id: "disco-elysium-deal",
      title: "Disco Elysium",
      image: steamHeaderImage(632470),
      oldPrice: "$39.99",
      newPrice: "$11.99",
      discount: "-70%",
      dealLabel: "Great deal",
      matchScore: 88,
      whyDealFits: ["Dialogue-driven", "Consequence over combat", "Unusual writing"],
    },
    {
      id: "dishonored2",
      title: "Dishonored 2",
      image: steamHeaderImage(403640),
      oldPrice: "$29.99",
      newPrice: "$7.49",
      discount: "-75%",
      dealLabel: "Great deal",
      matchScore: 85,
      whyDealFits: ["Immersive sim freedom", "Stealth options", "Atmospheric world"],
    },
  ],
  categories: [
    { id: "wishlist", label: "Wishlist matches", description: "Discounts on games you've saved." },
    { id: "similar", label: "Similar to games you love", description: "Deals near your favorites' DNA." },
    { id: "lows", label: "Historical lows", description: "Cheapest a game has been." },
    { id: "hidden", label: "Hidden discounted gems", description: "Overlooked games on sale." },
  ],
  radar: { watching: 23, dealsFound: 5 },
};

// ---------------------------------------------------------------------------
// Monthly Recap — "Spotify Wrapped for gaming taste"
// ---------------------------------------------------------------------------

export type TasteDnaBar = { label: string; value: number };

export type MonthlyRecapDemoData = {
  personality: { name: string; summary: string; dna: TasteDnaBar[] };
  month: { searches: number; discovered: number; saved: number; alerts: number };
  evolution: { before: string[]; now: string[] };
  returnsTo: string[];
  topPlayed: { title: string; hours: number }[];
  dominantGenres: string[];
  favoriteMechanics: string[];
  predictions: WeeklyPickCardData[];
};

export const MONTHLY_RECAP_DEMO_DATA: MonthlyRecapDemoData = {
  personality: {
    name: "The Explorer",
    summary: "You chase discovery and story over competition — the player who wanders off the path on purpose.",
    dna: [
      { label: "Discovery", value: 90 },
      { label: "Story", value: 80 },
      { label: "Challenge", value: 50 },
      { label: "Competitive", value: 20 },
    ],
  },
  month: { searches: 18, discovered: 12, saved: 4, alerts: 3 },
  returnsTo: ["Open worlds", "Meaningful choices", "Character progression"],
  topPlayed: [
    { title: "The Witcher 3", hours: 120 },
    { title: "Hades", hours: 64 },
    { title: "Disco Elysium", hours: 38 },
  ],
  dominantGenres: ["RPG", "Adventure", "Story-rich"],
  favoriteMechanics: ["Exploration", "Dialogue choices", "Build crafting"],
  evolution: {
    before: ["Open world", "Action RPG", "Combat focused"],
    now: ["Open world", "Choices matter", "Atmospheric", "Story rich"],
  },
  predictions: [
    {
      id: "citizen-sleeper-pred",
      title: "Citizen Sleeper",
      image: steamHeaderImage(1578650),
      matchScore: 93,
      category: "Narrative RPG",
      whyPicked: ["Tabletop-style choices", "Strong character writing", "Short and humane"],
      possibleConcerns: [],
    },
    {
      id: "obra-dinn-pred",
      title: "Return of the Obra Dinn",
      image: steamHeaderImage(653530),
      matchScore: 90,
      category: "Deduction",
      whyPicked: ["Pure discovery loop", "Rewards careful thinking", "Unforgettable structure"],
      possibleConcerns: [],
    },
    {
      id: "norco-pred",
      title: "NORCO",
      image: steamHeaderImage(1221250),
      matchScore: 88,
      category: "Adventure",
      whyPicked: ["Atmospheric and strange", "Story-first", "Strong sense of place"],
      possibleConcerns: [],
    },
  ],
};
