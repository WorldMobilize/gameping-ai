export type HomeDemoPick = {
  title: string;
  match: number;
  reason: string;
};

export const HOME_INITIAL_PROMPT =
  "I want a co-op game that feels relaxing but still has progression";

export const HOME_REFINE_PROMPT = "Less cozy, more survival and exploration";

export const HOME_INITIAL_PICKS: HomeDemoPick[] = [
  {
    title: "Stardew Valley",
    match: 94,
    reason: "Shared farming with gentle co-op and steady progression at your pace.",
  },
  {
    title: "Spiritfarer",
    match: 91,
    reason: "Calm rhythm, meaningful growth, and a journey you can share.",
  },
  {
    title: "Unrailed!",
    match: 88,
    reason: "Quick co-op sessions with teamwork and escalating challenge.",
  },
];

export const HOME_REFINED_PICKS: HomeDemoPick[] = [
  {
    title: "Valheim",
    match: 92,
    reason: "Co-op survival with exploration and long-term base building.",
  },
  {
    title: "No Man's Sky",
    match: 89,
    reason: "Vast worlds to explore together with steady progression.",
  },
  {
    title: "Enshrouded",
    match: 87,
    reason: "Survival crafting with discovery and shared progression.",
  },
];

export const HOME_TRUST_BADGES = [
  { label: "Personal recommendations", detail: "Curated picks, not endless lists" },
  { label: "Taste-based fit", detail: "Reasons that match how you play" },
  { label: "Real prices", detail: "Verified store prices on game pages" },
  { label: "Steam library optional", detail: "Connect when you want deeper fit" },
];

export const HOME_FEATURES = [
  {
    step: "01",
    title: "Describe what you feel like playing",
    text: "One sentence is enough—or add budget, platform, and mood when you want tighter picks.",
  },
  {
    step: "02",
    title: "Get picks with reasons and possible concerns",
    text: "Up to five matches with fit scores, plain-language why, and honest trade-offs.",
  },
  {
    step: "03",
    title: "Refine, save, or track prices",
    text: "Nudge results with a follow-up, save a run to your dashboard, or track deals on favorites.",
  },
];

export const HOME_DEAL_POINTS = [
  {
    title: "Real prices where available",
    text: "See verified store offers on each game page before you click through to buy.",
  },
  {
    title: "Price tracking",
    text: "Follow a game from its page and get alerts when deals hit your dashboard.",
  },
  {
    title: "Regional pricing",
    text: "Offers are selected for your region when storefront data supports it.",
  },
];
