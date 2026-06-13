import { steamHeaderImage } from "@/lib/curated/game-links";

export type HomeDemoPick = {
  title: string;
  match: number;
  reason: string;
  image: string;
  tags: string[];
};

export const HOME_INITIAL_PROMPT =
  "I want a co-op game that feels relaxing but still has progression";

export const HOME_REFINE_PROMPT = "Less cozy, more survival and exploration";

export const HOME_INITIAL_PICKS: HomeDemoPick[] = [
  {
    title: "Stardew Valley",
    match: 92,
    reason: "Shared farming with gentle co-op and steady progression at your pace.",
    image: steamHeaderImage(413150),
    tags: ["Co-op", "Cozy", "Progression"],
  },
  {
    title: "Spiritfarer",
    match: 89,
    reason: "Calm rhythm, meaningful growth, and a journey you can share.",
    image: steamHeaderImage(972660),
    tags: ["Co-op", "Relaxing", "Story"],
  },
  {
    title: "Unrailed!",
    match: 87,
    reason: "Quick co-op sessions with teamwork and escalating challenge.",
    image: steamHeaderImage(1016920),
    tags: ["Co-op", "Arcade", "Teamwork"],
  },
];

export const HOME_REFINED_PICKS: HomeDemoPick[] = [
  {
    title: "Valheim",
    match: 92,
    reason: "Co-op survival with exploration and long-term base building.",
    image: steamHeaderImage(892970),
    tags: ["Survival", "Exploration", "Building"],
  },
  {
    title: "No Man's Sky",
    match: 89,
    reason: "Vast worlds to explore together with steady progression.",
    image: steamHeaderImage(275850),
    tags: ["Survival", "Exploration", "Sci-fi"],
  },
  {
    title: "Enshrouded",
    match: 87,
    reason: "Survival crafting with discovery and shared progression.",
    image: steamHeaderImage(1203620),
    tags: ["Survival", "Crafting", "Co-op"],
  },
];

export const HOME_HERO_INSIGHT = {
  title: "GamePing turns vague prompts into useful picks",
  input: "I want a co-op game with progression",
  understands: [
    { label: "Mood", value: "relaxed co-op" },
    { label: "Need", value: "long-term progression" },
    { label: "Avoid", value: "endless generic lists" },
  ],
  outputs: [
    "Curated game picks",
    "Reasons + possible concerns",
    "Real prices when available",
    "Refine until it feels right",
  ],
};

export type HomeValueProp = {
  id: string;
  label: string;
  detail: string;
};

export const HOME_VALUE_PROPS: HomeValueProp[] = [
  {
    id: "taste",
    label: "Taste-based discovery",
    detail: "Understands why you play",
  },
  {
    id: "dna",
    label: "Gaming DNA",
    detail: "Your personal taste profile",
  },
  {
    id: "refine",
    label: "Refine search",
    detail: "Adjust picks instantly",
  },
  {
    id: "deals",
    label: "Deal aware",
    detail: "Find games worth buying",
  },
];

export const HOME_FEATURES = [
  {
    step: "01",
    title: "Describe the game you want",
    text: "One sentence is enough—or add budget, platform, and mood when you want tighter picks.",
  },
  {
    step: "02",
    title: "Get picks with reasons",
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

/** @deprecated Use HOME_VALUE_PROPS — kept for any stale imports */
export const HOME_TRUST_BADGES = HOME_VALUE_PROPS.map((p) => ({
  label: p.label,
  detail: p.detail,
}));
