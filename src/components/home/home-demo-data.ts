export type HomeDemoPick = {
  title: string;
  match: number;
  reason: string;
  price: string;
  tag: string;
};

export type HomeDemoScenario = {
  prompt: string;
  highlightIndex: number;
};

export const HOME_DEMO_PICKS: HomeDemoPick[] = [
  {
    title: "Hades",
    match: 96,
    reason: "Fast combat and roguelite loops—great when you want momentum, not grind.",
    price: "$8.24",
    tag: "Roguelike",
  },
  {
    title: "Disco Elysium",
    match: 91,
    reason: "Story-rich choices and unforgettable writing when mood matters more than action.",
    price: "$8.88",
    tag: "Narrative RPG",
  },
  {
    title: "Hollow Knight",
    match: 89,
    reason: "Atmospheric exploration with challenge—rewards patience and curiosity.",
    price: "$7.49",
    tag: "Metroidvania",
  },
];

export const HOME_DEMO_SCENARIOS: HomeDemoScenario[] = [
  {
    prompt: "Something like Hades but cozier, under $15",
    highlightIndex: 0,
  },
  {
    prompt: "Dark story RPG with real choices—not just combat",
    highlightIndex: 1,
  },
  {
    prompt: "Exploration-heavy, challenging, great atmosphere",
    highlightIndex: 2,
  },
];

export const HOME_VIBE_TAGS = [
  "Cozy evenings",
  "Dark story",
  "Under $20",
  "Steam Deck",
  "Roguelike",
  "Short sessions",
  "Open world",
  "Hidden gems",
];

export const HOME_FEATURES = [
  {
    step: "01",
    title: "Describe your taste",
    text: "One sentence is enough—or add tags, budget, and platform when you want tighter picks.",
    icon: "✦",
  },
  {
    step: "02",
    title: "Get curated picks",
    text: "Up to five matches with fit scores, plain-language reasons, and verified prices on each game page.",
    icon: "◎",
  },
  {
    step: "03",
    title: "Save & track",
    text: "Save a search to your dashboard, track deals on favorites, and connect Steam for personal fit.",
    icon: "↗",
  },
];
