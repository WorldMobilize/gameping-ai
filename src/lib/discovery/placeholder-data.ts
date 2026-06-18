import { steamHeaderImage } from "@/lib/curated/game-links";

export type HiddenGemPick = {
  title: string;
  image: string;
  reason: string;
  tag: "Underrated" | "Cult favorite" | "Hidden RPG" | "Small studio";
  futureMatch: number;
};

export type GamesOfWeekPick = {
  title: string;
  image: string;
  whyThisWeek: string;
  category: "New discovery" | "Great deal" | "Community favorite";
};

export type WeeklyPersonalPick = {
  title: string;
  image: string;
  reason: string;
  match: number;
};

export type DealForYouPick = {
  title: string;
  image: string;
  oldPrice: string;
  newPrice: string;
  whyItMatches: string;
};

export const HIDDEN_GEMS_DEMO: HiddenGemPick[] = [
  {
    title: "Outer Wilds",
    image: steamHeaderImage(753640),
    reason: "A compact galaxy of mysteries — easy to overlook next to bigger space games.",
    tag: "Cult favorite",
    futureMatch: 94,
  },
  {
    title: "Disco Elysium",
    image: steamHeaderImage(632470),
    reason: "Dialogue-heavy RPG that rewards patience more than combat stats.",
    tag: "Hidden RPG",
    futureMatch: 91,
  },
  {
    title: "Firewatch",
    image: steamHeaderImage(383870),
    reason: "Short, moody, and personal — the kind of game people forget to search for.",
    tag: "Underrated",
    futureMatch: 88,
  },
  {
    title: "Inscryption",
    image: steamHeaderImage(1092790),
    reason: "Genre-bending deckbuilder with a stranger second act than marketing suggests.",
    tag: "Small studio",
    futureMatch: 90,
  },
  {
    title: "Spiritfarer",
    image: steamHeaderImage(972660),
    reason: "Cozy management with emotional weight — often missed by action-first shoppers.",
    tag: "Underrated",
    futureMatch: 87,
  },
  {
    title: "DREDGE",
    image: steamHeaderImage(1562430),
    reason: "Fishing loop hides creeping dread — niche until word of mouth catches up.",
    tag: "Cult favorite",
    futureMatch: 89,
  },
];

export const GAMES_OF_WEEK_DEMO: GamesOfWeekPick[] = [
  {
    title: "Hades II",
    image: steamHeaderImage(1145350),
    whyThisWeek: "Early access momentum and strong roguelike buzz make it a natural conversation starter.",
    category: "New discovery",
  },
  {
    title: "Dave the Diver",
    image: steamHeaderImage(1868140),
    whyThisWeek: "Still pulling cozy-adventure players who want one more dive before the weekend.",
    category: "Community favorite",
  },
  {
    title: "Slay the Spire",
    image: steamHeaderImage(646570),
    whyThisWeek: "Frequent discounts keep this deckbuilder classic on shortlists for new strategy fans.",
    category: "Great deal",
  },
  {
    title: "Lethal Company",
    image: steamHeaderImage(1966720),
    whyThisWeek: "Co-op horror sessions are spiking again in friend groups hunting something fresh.",
    category: "Community favorite",
  },
  {
    title: "Palworld",
    image: steamHeaderImage(1623730),
    whyThisWeek: "Sandbox creature collectors keep circling back after major updates.",
    category: "New discovery",
  },
  {
    title: "Celeste",
    image: steamHeaderImage(504230),
    whyThisWeek: "A precision-platformer staple that still shows up in “games like Hollow Knight” threads.",
    category: "Great deal",
  },
];

export const WEEKLY_PICKS_TASTE_MOCK = ["Exploration", "Story", "Strategy"] as const;

export const WEEKLY_PICKS_DEMO: WeeklyPersonalPick[] = [
  {
    title: "Outer Wilds",
    image: steamHeaderImage(753640),
    reason: "Curiosity-driven exploration with a strong narrative payoff — matches your story + discovery mix.",
    match: 96,
  },
  {
    title: "Disco Elysium",
    image: steamHeaderImage(632470),
    reason: "Deep dialogue and consequence — a strategy-minded RPG without spreadsheet combat.",
    match: 93,
  },
  {
    title: "Slay the Spire",
    image: steamHeaderImage(646570),
    reason: "Tight runs and long-term planning — strategy in a digestible roguelike loop.",
    match: 91,
  },
  {
    title: "Firewatch",
    image: steamHeaderImage(383870),
    reason: "Short, atmospheric story hike when you want exploration without a 60-hour map.",
    match: 88,
  },
];

export const DEALS_FOR_YOU_DEMO: DealForYouPick[] = [
  {
    title: "Hollow Knight",
    image: steamHeaderImage(367520),
    oldPrice: "$14.99",
    newPrice: "$7.49",
    whyItMatches: "Metroidvania exploration with moody storytelling — aligns with your saved searches.",
  },
  {
    title: "Stardew Valley",
    image: steamHeaderImage(413150),
    oldPrice: "$14.99",
    newPrice: "$10.49",
    whyItMatches: "Cozy pacing with light strategy in farm planning — a calm counterpoint to action picks.",
  },
  {
    title: "XCOM 2",
    image: steamHeaderImage(268500),
    oldPrice: "$59.99",
    newPrice: "$11.99",
    whyItMatches: "Turn-based strategy depth when you want tactical decisions over reflex combat.",
  },
  {
    title: "Spiritfarer",
    image: steamHeaderImage(972660),
    oldPrice: "$29.99",
    newPrice: "$8.99",
    whyItMatches: "Emotional narrative management — story-first, low combat friction.",
  },
];

export type MonthlyRecapGame = {
  title: string;
  image: string;
  hours: string;
};

export const MONTHLY_RECAP_DEMO = {
  vibe: "Story-rich explorers who love open worlds",
  topGames: [
    {
      title: "Baldur's Gate 3",
      image: steamHeaderImage(1086940),
      hours: "42h",
    },
    {
      title: "Hollow Knight",
      image: steamHeaderImage(367520),
      hours: "28h",
    },
    {
      title: "Disco Elysium",
      image: steamHeaderImage(632470),
      hours: "19h",
    },
  ] satisfies MonthlyRecapGame[],
  favoriteTags: ["Open World", "Story Rich", "RPG"] as const,
  stats: {
    gamesExplored: 12,
    savedPicks: 4,
    trackedDeals: 3,
  },
  tasteEvolution:
    "Your taste leaned harder into narrative RPGs this month, with more exploration picks and fewer pure action titles.",
} as const;
