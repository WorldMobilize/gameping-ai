import { steamHeaderImage } from "@/lib/curated/game-links";

export type HomeDemoGameCover = {
  title: string;
  image: string;
  fallback: string;
};

/** Static Steam header art for homepage mockups (no API). */
export const HOME_DEMO_GAMES = {
  stardewValley: {
    title: "Stardew Valley",
    image: steamHeaderImage(413150),
    fallback: "from-emerald-500/50 to-green-700/40",
  },
  outerWilds: {
    title: "Outer Wilds",
    image: steamHeaderImage(753640),
    fallback: "from-violet-500/50 to-indigo-700/40",
  },
  hades: {
    title: "Hades",
    image: steamHeaderImage(1145360),
    fallback: "from-rose-500/50 to-orange-700/40",
  },
  witcher3: {
    title: "The Witcher 3",
    image: steamHeaderImage(292030),
    fallback: "from-red-800/50 to-slate-700/40",
  },
  cyberpunk2077: {
    title: "Cyberpunk 2077",
    image: steamHeaderImage(1091500),
    fallback: "from-yellow-500/40 via-fuchsia-600/30 to-blue-600/35",
  },
  hollowKnight: {
    title: "Hollow Knight",
    image: steamHeaderImage(367520),
    fallback: "from-indigo-600/50 to-slate-800/40",
  },
} as const satisfies Record<string, HomeDemoGameCover>;

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

export type HomeHeroWalkthroughCard = {
  title: string;
  match: number;
  whyFits: string;
  image?: string;
  fallback?: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  matchTier?: "best_match" | "good_alternative" | "partial_match";
};

/** Static hero product walkthrough — single stable example (no API). */
export const HOME_HERO_WALKTHROUGH = {
  prompt: "I want a dark RPG with choices",
  initialResults: [
    {
      title: "Cyberpunk 2077",
      match: 92,
      whyFits:
        "Meaningful choices and a dense world that reacts to how you play — strong fit for dark RPG requests.",
      image: HOME_DEMO_GAMES.cyberpunk2077.image,
      fallback: HOME_DEMO_GAMES.cyberpunk2077.fallback,
      imagePosition: "center 20%",
      imageFit: "cover",
      matchTier: "best_match",
    },
    {
      title: "The Witcher 3",
      match: 90,
      whyFits:
        "Branching story and consequences in a dark fantasy world with long-form RPG pacing.",
      image: HOME_DEMO_GAMES.witcher3.image,
      fallback: HOME_DEMO_GAMES.witcher3.fallback,
      imagePosition: "center center",
      imageFit: "cover",
      matchTier: "good_alternative",
    },
    {
      title: "Deus Ex: Mankind Divided",
      match: 88,
      whyFits:
        "Multiple approaches to missions with strong player agency and immersive atmosphere.",
      image: steamHeaderImage(337000),
      fallback: "from-amber-600/40 to-slate-800/50",
      imagePosition: "center center",
      imageFit: "contain",
      matchTier: "good_alternative",
    },
  ] satisfies readonly HomeHeroWalkthroughCard[],
  refinePrompt: "Less futuristic, more fantasy",
  refineLabel: "Not quite right?",
  refineHint: "Tell GamePing what to adjust. You get one refinement for this search.",
  refinedResults: [
    {
      title: "The Witcher 3",
      match: 94,
      whyFits:
        "Deep fantasy RPG where your choices shape characters, politics, and the world around you.",
      image: HOME_DEMO_GAMES.witcher3.image,
      fallback: HOME_DEMO_GAMES.witcher3.fallback,
      imagePosition: "center center",
      imageFit: "cover",
      matchTier: "best_match",
    },
    {
      title: "Dragon Age: Inquisition",
      match: 90,
      whyFits:
        "Party dynamics and major story decisions across a huge fantasy campaign.",
      image: steamHeaderImage(1222690),
      fallback: "from-red-900/40 to-slate-800/50",
      imagePosition: "center 25%",
      imageFit: "cover",
      matchTier: "good_alternative",
    },
    {
      title: "Kingdom Come: Deliverance",
      match: 88,
      whyFits:
        "Realistic medieval RPG where choices carry lasting consequences in a grounded world.",
      image: steamHeaderImage(379430),
      fallback: "from-amber-800/40 to-slate-800/50",
      imagePosition: "center center",
      imageFit: "contain",
      matchTier: "good_alternative",
    },
  ] satisfies readonly HomeHeroWalkthroughCard[],
  detail: {
    title: "The Witcher 3: Wild Hunt",
    shortTitle: "The Witcher 3",
    fitLabel: "Great fit",
    match: 94,
    genres: ["RPG", "Open World", "Fantasy"] as const,
    metacritic: 93,
    whyLike:
      "Looks like you enjoy choices that matter, immersive fantasy worlds, and long adventures.",
    concern: "Combat and pacing may feel slower if you prefer fast action.",
    priceLabel: "Best verified price when available",
    price: "€8.99",
    trackNote: "Get notified when games you care about drop.",
    overview:
      "A story-driven open world RPG set in a morally grey fantasy universe — hunt monsters, navigate political intrigue, and shape Geralt's journey.",
    developer: "CD PROJEKT RED",
    releaseYear: "2015",
    platforms: "PC, PlayStation, Xbox",
    image: HOME_DEMO_GAMES.witcher3.image,
    fallback: HOME_DEMO_GAMES.witcher3.fallback,
    imagePosition: "center center",
  },
} as const;

export type HomeHeroDemoResult = {
  title: string;
  match: number;
  signals: readonly [string, string];
  image: string;
  fallback: string;
  /** object-position for Steam header crops (homepage hero demo only). */
  imagePosition?: string;
  /** Use contain + blurred backdrop when cover crops logos/titles badly. */
  imageFit?: "cover" | "contain";
};

export type HomeHeroDemoExample = {
  prompt: string;
  results: readonly [HomeHeroDemoResult, HomeHeroDemoResult, HomeHeroDemoResult];
};

/** Static hero demo rotation — prompt + picks stay coherent (no API). */
export const HOME_HERO_DEMO_ROTATION: readonly HomeHeroDemoExample[] = [
  {
    prompt: "I want a dark RPG with choices",
    results: [
      {
        title: "Cyberpunk 2077",
        match: 92,
        signals: ["choices", "immersive world"],
        image: HOME_DEMO_GAMES.cyberpunk2077.image,
        fallback: HOME_DEMO_GAMES.cyberpunk2077.fallback,
        imagePosition: "center top",
      },
      {
        title: "The Witcher 3",
        match: 89,
        signals: ["story", "consequences"],
        image: HOME_DEMO_GAMES.witcher3.image,
        fallback: HOME_DEMO_GAMES.witcher3.fallback,
        imagePosition: "center center",
      },
      {
        title: "Deus Ex: Mankind Divided",
        match: 86,
        signals: ["cyberpunk", "player agency"],
        image: steamHeaderImage(337000),
        fallback: "from-amber-600/40 to-slate-800/50",
        imagePosition: "center center",
      },
    ],
  },
  {
    prompt: "I want something cozy after work",
    results: [
      {
        title: "Stardew Valley",
        match: 94,
        signals: ["relaxing routine", "gentle pace"],
        image: HOME_DEMO_GAMES.stardewValley.image,
        fallback: HOME_DEMO_GAMES.stardewValley.fallback,
        imagePosition: "center center",
      },
      {
        title: "A Short Hike",
        match: 91,
        signals: ["peaceful exploration", "low pressure"],
        image: steamHeaderImage(1055540),
        fallback: "from-sky-500/40 to-emerald-700/40",
        imagePosition: "center center",
        imageFit: "contain",
      },
      {
        title: "Spiritfarer",
        match: 88,
        signals: ["emotional", "gentle pace"],
        image: steamHeaderImage(972660),
        fallback: "from-teal-500/40 to-indigo-700/40",
        imagePosition: "center center",
      },
    ],
  },
  {
    prompt: "I want a mystery game that makes me think",
    results: [
      {
        title: "Outer Wilds",
        match: 93,
        signals: ["exploration", "mystery"],
        image: HOME_DEMO_GAMES.outerWilds.image,
        fallback: HOME_DEMO_GAMES.outerWilds.fallback,
        imagePosition: "left center",
      },
      {
        title: "Return of the Obra Dinn",
        match: 90,
        signals: ["deduction", "logic puzzles"],
        image: steamHeaderImage(653530),
        fallback: "from-slate-600/50 to-slate-900/50",
        imagePosition: "center center",
        imageFit: "contain",
      },
      {
        title: "The Case of the Golden Idol",
        match: 87,
        signals: ["logic puzzles", "investigation"],
        image: steamHeaderImage(1677770),
        fallback: "from-amber-700/40 to-yellow-900/40",
        imagePosition: "center center",
        imageFit: "contain",
      },
    ],
  },
  {
    prompt: "I want co-op games like Elden Ring",
    results: [
      {
        title: "Monster Hunter: World",
        match: 91,
        signals: ["co-op hunts", "action RPG"],
        image: steamHeaderImage(582010),
        fallback: "from-emerald-700/40 to-slate-800/50",
        imagePosition: "center center",
      },
      {
        title: "Remnant II",
        match: 88,
        signals: ["co-op action RPG", "challenging combat"],
        image: steamHeaderImage(1282100),
        fallback: "from-red-900/40 to-slate-900/50",
        imagePosition: "center top",
      },
      {
        title: "Nioh 2",
        match: 85,
        signals: ["challenging combat", "deep builds"],
        image: steamHeaderImage(1325200),
        fallback: "from-orange-800/40 to-slate-900/50",
        imagePosition: "center center",
      },
    ],
  },
  {
    prompt: "I want strategy games that eat my weekend",
    results: [
      {
        title: "Civilization VI",
        match: 92,
        signals: ["one more turn", "empire building"],
        image: steamHeaderImage(289070),
        fallback: "from-blue-700/40 to-amber-800/40",
        imagePosition: "center center",
        imageFit: "contain",
      },
      {
        title: "RimWorld",
        match: 89,
        signals: ["emergent stories", "colony sim"],
        image: steamHeaderImage(294100),
        fallback: "from-violet-700/40 to-slate-800/50",
        imagePosition: "center center",
      },
      {
        title: "Factorio",
        match: 87,
        signals: ["automation obsession", "factory building"],
        image: steamHeaderImage(427520),
        fallback: "from-orange-600/40 to-slate-800/50",
        imagePosition: "center center",
      },
    ],
  },
] as const;

/** @deprecated Use HOME_HERO_DEMO_ROTATION */
export const HOME_HERO_SEARCH_PREVIEW = {
  typingPrompt: HOME_HERO_DEMO_ROTATION[0].prompt,
  results: HOME_HERO_DEMO_ROTATION[0].results.map((game) => ({
    title: game.title,
    match: game.match,
    signals: game.signals.join(" • "),
    image: game.image,
    fallback: game.fallback,
  })),
} as const;

/** @deprecated Use HOME_HERO_SEARCH_PREVIEW */
export const HOME_HERO_MOMENT_PREVIEW = {
  prompt: HOME_HERO_SEARCH_PREVIEW.typingPrompt,
  pick: {
    ...HOME_DEMO_GAMES.cyberpunk2077,
    match: 92,
    whyFits: ["player freedom", "deep world", "meaningful choices"],
  },
};

/** How it works — 3 summary cards with expandable details (homepage). */
export const HOME_HOW_CARDS = [
  {
    id: "taste",
    title: "Tell us your taste",
    summary:
      "Describe the kind of game you want in plain language — mood, pacing, favorite games, dealbreakers, or even a weird specific vibe.",
    href: "/how-it-works/taste",
  },
  {
    id: "matches",
    title: "Get smarter matches",
    summary:
      "GamePing looks past store tags and tries to understand why a game fits: exploration, story, progression, challenge, freedom, atmosphere, and more.",
    href: "/how-it-works/matches",
  },
  {
    id: "discovery",
    title: "Keep discovering",
    summary:
      "Save searches, track games, and sync your Steam library so your Taste DNA makes every result more personal.",
    href: "/how-it-works/discovery",
  },
] as const;

/** Product journey timeline (homepage). */
export const HOME_JOURNEY_STEPS = [
  {
    step: "1",
    title: "Tell GamePing what you want",
    prompt: "I want a dark RPG with choices",
  },
  {
    step: "2",
    title: "GamePing understands your request",
    detects: ["Exploration", "Story", "Freedom"],
  },
  {
    step: "3",
    title: "Get explained matches",
    game: HOME_DEMO_GAMES.cyberpunk2077.title,
    gameImage: HOME_DEMO_GAMES.cyberpunk2077.image,
    gameFallback: HOME_DEMO_GAMES.cyberpunk2077.fallback,
    fitLabel: "Good fit",
    fitScore: 86,
    reason: "You seem to enjoy immersive worlds, choices and progression.",
  },
  {
    step: "4",
    title: "Keep discovering",
    items: [
      { label: "Saved games", soon: false },
      { label: "Price tracking", soon: false },
      { label: "Taste DNA", soon: false },
    ],
  },
] as const;

/** Why GamePing card mockups. */
export const HOME_WHY_MOCKUPS = {
  tasteTags: ["RPG", "Open world"],
  tasteSignals: ["Freedom", "Choices", "Exploration"],
  fitScore: 86,
  fitLabel: "Great match",
  radar: {
    game: HOME_DEMO_GAMES.cyberpunk2077.title,
    alert: "Deal found",
    because: ["Fallout", "Deus Ex"],
  },
};

/** Taste profile bars — roadmap mockup only. */
export const HOME_TASTE_PROFILE_BARS = [
  { label: "Exploration", bars: 5 },
  { label: "Story", bars: 4 },
  { label: "Strategy", bars: 2 },
] as const;

/** Why GamePing — simplified homepage cards. */
export const HOME_WHY_SIMPLE = [
  {
    id: "taste",
    title: "Taste over tags",
    detail:
      "Store tags describe categories. GamePing reads what you actually enjoy — mood, pacing, choices, and the feel of play.",
  },
  {
    id: "fit",
    title: "Know before playing",
    detail:
      "Every pick comes with clear reasons, strengths, and possible concerns so you can decide before you buy.",
  },
  {
    id: "radar",
    title: "Your gaming radar",
    detail:
      "Save searches, track games, and spot future matches that line up with how you like to play.",
  },
] as const;

/**
 * Why GamePing — animated carousel cards (homepage).
 * 5 static cards; `accent` highlights part of the title in cyan. No API.
 */
export const HOME_WHY_CAROUSEL = [
  {
    id: "taste",
    title: "Taste over tags",
    accent: "Taste",
    detail:
      "Store tags describe categories. GamePing reads what you actually enjoy — mood, pacing, choices, and the feel of play.",
  },
  {
    id: "fit",
    title: "Know before playing",
    accent: "Know before",
    detail:
      "Every pick comes with clear reasons, strengths, and possible concerns so you can decide before you buy.",
  },
  {
    id: "radar",
    title: "Your gaming radar",
    accent: "radar",
    detail:
      "Save searches, track games, and spot future matches that line up with how you like to play.",
  },
  {
    id: "hidden",
    title: "Finds hidden fits",
    accent: "hidden fits",
    detail:
      "GamePing can surface games you might not search for, based on mood and playstyle.",
  },
  {
    id: "explains",
    title: "Explains the match",
    accent: "match",
    detail:
      "Every pick comes with clear reasons, tradeoffs, and what kind of player it fits.",
  },
] as const;

/** Premium foundations available now — the two rich landing cards. */
export const HOME_FUTURE_ROADMAP = [
  {
    id: "steam-import",
    title: "Steam Import",
    detail:
      "Connect your Steam library so GamePing understands what you actually play — not just what you search.",
    chips: ["Played games", "Playtime patterns", "Owned games"] as const,
    href: "/how-it-works/steam-import",
  },
  {
    id: "taste-memory",
    title: "Taste DNA",
    detail:
      "Your personal gaming profile evolves from your library, searches, and saved games.",
    chips: ["Steam library", "Searches", "Saved games"] as const,
    href: "/how-it-works/taste-memory",
  },
] as const;

/**
 * Personalized Early Access — live Premium discovery areas generated from your
 * Taste DNA. Linked from the landing's Premium section.
 */
export const HOME_PREMIUM_EARLY_ACCESS = [
  {
    id: "weekly-picks",
    title: "Weekly Picks",
    detail: "Personal recommendations generated from your taste.",
    href: "/weekly-picks",
  },
  {
    id: "deals-for-you",
    title: "Deals For You",
    detail: "Taste first. Deals second.",
    href: "/deals-for-you",
  },
  {
    id: "monthly-recap",
    title: "Monthly Recap",
    detail: "Your gaming personality and insights over time.",
    href: "/monthly-recap",
  },
] as const;

/** Static hero taste preview — current search understanding (no permanent profile). */
export const HOME_HERO_TASTE = {
  userDescribes: "Games with exploration, choices and progression",
  detects: ["Exploration", "Story focus", "Player freedom"],
};

/** Animated taste-flow demo (no game covers). */
export const HOME_TASTE_FLOW = {
  tagGenres: ["RPG", "Open World", "Fantasy"],
  whatYouWant: [
    "I want to get lost in a world",
    "I like meaningful choices",
    "I want long-term progression",
  ],
  detectedSignals: ["Freedom", "Meaningful choices", "Immersion", "Progression"],
};

/** Static gaming radar preview — mix of live + coming soon (no API). */
export const HOME_GAMING_RADAR = {
  tasteSignals: ["Story rich", "Exploration", "Strategy"],
  sourcesNow: ["Searches"],
  sourcesComingSoon: ["Saved games", "Steam Import"],
  alertsNow: ["Outer Wilds dropped to $9.99 — a game you're tracking"],
  alertsComingSoon: ["New game matching your taste discovered"],
  notifyNow: "a tracked game gets a deal",
  notifyComingSoon: [
    "a game matching your taste appears",
    "your recommendations improve over time",
  ],
};

/** Static hero preview (no API). */
export const HOME_HERO_MOMENT = {
  userQuery: "I want a relaxing game after work",
  picks: [
    {
      ...HOME_DEMO_GAMES.stardewValley,
      match: 95,
      reason: "Relaxing progression",
      whyFits: ["Cozy daily loop", "Long-term progression"],
      tone: "emerald" as const,
    },
    {
      ...HOME_DEMO_GAMES.outerWilds,
      match: 93,
      reason: "Exploration & curiosity",
      whyFits: ["Curiosity-driven worlds", "Meaningful discovery"],
      tone: "violet" as const,
    },
    {
      ...HOME_DEMO_GAMES.hades,
      match: 91,
      reason: "Fast rewarding runs",
      whyFits: ["Quick satisfying sessions", "Skill-based progression"],
      tone: "rose" as const,
    },
  ],
};

export const HOME_PERSONAL_FIT_MOCK = {
  ...HOME_DEMO_GAMES.cyberpunk2077,
  fitLabel: "Good fit",
  fitScore: 75,
  likes: [
    "You usually enjoy games where you can explore freely instead of following a strict path.",
    "You seem to prefer strong atmosphere, character choices, and worlds with depth.",
    "You like progression that gives you reasons to keep coming back.",
  ],
  concerns: [
    "Cyberpunk is more story-driven and less sandbox-focused than something like Fallout.",
  ],
};

export const HOME_TASTE_PROMPT = "Something like Fallout but darker";

export const HOME_TASTE_SIGNALS = ["Freedom", "Meaningful choices", "Dark tone", "Progression"];

export const HOME_TASTE_WANTS = [
  "Freedom to explore",
  "Meaningful choices",
  "A darker world",
  "Long-term progression",
];

export const HOME_DEAL_ROWS = [
  { ...HOME_DEMO_GAMES.hades, price: "$8.24", store: "Steam" },
  { ...HOME_DEMO_GAMES.hollowKnight, price: "$7.49", store: "Steam" },
  { ...HOME_DEMO_GAMES.stardewValley, price: "$13.49", store: "Steam" },
] as const;

export const HOME_TRACKED_DEALS = [
  {
    ...HOME_DEMO_GAMES.outerWilds,
    wasPrice: "$24.99",
    nowPrice: "$9.99",
    drop: "60% off",
    status: "Watching",
  },
  {
    ...HOME_DEMO_GAMES.hollowKnight,
    wasPrice: "$14.99",
    nowPrice: "$7.49",
    drop: "50% off",
    status: "On your list",
  },
  {
    ...HOME_DEMO_GAMES.stardewValley,
    wasPrice: "$14.99",
    nowPrice: "$13.49",
    drop: "Price drop",
    status: "Saved",
  },
] as const;

export type HomeSteamImportPreviewRow = HomeDemoGameCover & {
  statusLabel: "Owned" | "Played" | "Skip from recommendations";
  statusKey: "owned" | "played" | "skip";
};

/** Static Steam import settings preview (roadmap mockup only). */
export const HOME_STEAM_IMPORT_PREVIEW: HomeSteamImportPreviewRow[] = [
  { ...HOME_DEMO_GAMES.witcher3, statusLabel: "Owned", statusKey: "owned" },
  { ...HOME_DEMO_GAMES.hollowKnight, statusLabel: "Played", statusKey: "played" },
  {
    ...HOME_DEMO_GAMES.stardewValley,
    statusLabel: "Skip from recommendations",
    statusKey: "skip",
  },
];

export const HOME_FLOW_STEPS = [
  {
    step: "1",
    title: "Tell us what you want",
    text: "Describe the mood, games you love, or what you want to avoid — one sentence is enough.",
    icon: "ping" as const,
  },
  {
    step: "2",
    title: "GamePing reads your request",
    text: "It picks up motivations and preferences from what you write — not just genre labels on a store page.",
    icon: "taste" as const,
  },
  {
    step: "3",
    title: "Get personalized matches",
    text: "Up to five picks with fit scores, plain-language reasons, and honest trade-offs.",
    icon: "matches" as const,
  },
  {
    step: "4",
    title: "Play something you love",
    text: "Spend less time searching and more time playing games that actually fit.",
    icon: "play" as const,
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

export type HomeRoadmapItem = {
  id: string;
  label: string;
  detail: string;
  icon: "steam" | "memory" | "ping";
};

export const HOME_ROADMAP_ITEMS: HomeRoadmapItem[] = [
  {
    id: "steam-import",
    label: "Steam Import",
    detail:
      "Connect your Steam library so GamePing understands what you actually play — reading playtime patterns and favorite genres, and skipping games you already own.",
    icon: "steam",
  },
  {
    id: "taste-memory",
    label: "Taste DNA",
    detail:
      "Your personal gaming profile evolves from your library, searches, and saved games — a sharper picture of your taste the more you use GamePing.",
    icon: "memory",
  },
  {
    id: "ping-assistant",
    label: "PING assistant",
    detail:
      "PING will help you refine searches conversationally — narrowing mood, pacing, and mechanics until the results feel right.",
    icon: "ping",
  },
];

/** Steam import roadmap mockup copy (visual only). */
export const HOME_STEAM_IMPORT_ANALYSIS = [
  "Played games",
  "Playtime patterns",
  "Avoid owned games",
] as const;

/** Taste DNA mockup copy (visual only). */
export const HOME_TASTE_MEMORY_SOURCES = [
  { label: "Steam library", soon: false },
  { label: "Searches you make", soon: false },
  { label: "Games you save", soon: false },
  { label: "Steam playtime", soon: false },
] as const;

export const HOME_TASTE_MEMORY_IMPROVES = [
  "Recommendations",
  "Game fit analysis",
  "Discovery alerts",
] as const;

/** PING assistant roadmap mockup (visual only). */
export const HOME_PING_ASSISTANT_DEMO = {
  user: "Not that kind of RPG",
  ping: "Got it — more exploration, less turn-based.",
};

export const HOME_VALUE_PROPS: HomeValueProp[] = [
  {
    id: "beyond-genres",
    label: "Beyond genres",
    detail: "GamePing understands why you love a game.",
  },
  {
    id: "explainable",
    label: "Explainable picks",
    detail: "Every recommendation tells you why it fits.",
  },
  {
    id: "hidden-gems",
    label: "Hidden gems",
    detail: "Find games you would never search for.",
  },
  {
    id: "better-decisions",
    label: "Better decisions",
    detail: "Know before spending your time or money.",
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
