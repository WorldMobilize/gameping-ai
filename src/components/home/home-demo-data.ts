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

/** Static hero product-preview (no API). */
export const HOME_HERO_DASHBOARD = {
  tasteScore: 92,
  traits: ["Exploration", "Story rich", "Progression"],
  playStyle: "Co-op explorer",
  picks: [
    HOME_INITIAL_PICKS[0],
    HOME_INITIAL_PICKS[1],
    HOME_REFINED_PICKS[0],
    HOME_REFINED_PICKS[1],
  ],
  whySummary:
    "These picks share relaxed co-op pacing with room to grow at your own speed—exploration and progression without pressure.",
};

export const HOME_FLOW_STEPS = [
  {
    step: "1",
    title: "Tell us what you want",
    text: "Describe the mood, pace, or vibe you're after—one sentence is enough to start.",
    icon: "ping" as const,
  },
  {
    step: "2",
    title: "We understand your taste",
    text: "GamePing reads motivations and what to avoid—not just genre tags on a box.",
    icon: "taste" as const,
  },
  {
    step: "3",
    title: "Get better matches",
    text: "Up to five picks with fit scores, plain-language why, and honest trade-offs.",
    icon: "love" as const,
  },
];

export const HOME_TRUST_PILLARS = [
  { id: "personalized", label: "Personalized", icon: "target" as const },
  { id: "transparent", label: "Transparent", icon: "shield" as const },
  { id: "fast", label: "Fast & easy", icon: "bolt" as const },
  { id: "gamers", label: "Made for gamers", icon: "heart" as const },
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
    icon: "prompt" as const,
  },
  {
    step: "02",
    title: "Get picks with reasons",
    text: "Up to five matches with fit scores, plain-language why, and honest trade-offs.",
    icon: "picks" as const,
  },
  {
    step: "03",
    title: "Refine, save, or track prices",
    text: "Nudge results with a follow-up, save a run to your dashboard, or track deals on favorites.",
    icon: "refine" as const,
  },
];

export const HOME_DEAL_POINTS = [
  {
    title: "Real prices where available",
    text: "See verified store offers on each game page before you click through to buy.",
    icon: "price" as const,
  },
  {
    title: "Price tracking",
    text: "Follow a game from its page and get alerts when deals hit your dashboard.",
    icon: "track" as const,
  },
  {
    title: "Regional pricing",
    text: "Offers are selected for your region when storefront data supports it.",
    icon: "region" as const,
  },
];

/** @deprecated Use HOME_VALUE_PROPS — kept for any stale imports */
export const HOME_TRUST_BADGES = HOME_VALUE_PROPS.map((p) => ({
  label: p.label,
  detail: p.detail,
}));
