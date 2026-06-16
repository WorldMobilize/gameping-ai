import { steamHeaderImage } from "@/lib/curated/game-links";
import { HOME_DEMO_GAMES } from "@/components/home/home-demo-data";
import type { RecommendResultCardGame } from "@/components/recommend/RecommendResultCardView";

const FIT_META = "Based on this search — not your saved Gaming DNA yet.";

export const HOME_HERO_DEMO_PROMPT = "I want a game I can get lost in for hours";
export const HOME_HERO_DEMO_REFINE = "More relaxing, less combat focused";
export const HOME_HERO_DEMO_FIT_META = FIT_META;

export const HOME_HERO_DEMO_INITIAL_RESULTS: RecommendResultCardGame[] = [
  {
    title: "Elden Ring",
    match: 94,
    matchTier: "best_match",
    matchNote: "Open exploration · Discovery · Challenge",
    reason: "Massive world full of secrets, exploration, and player freedom.",
    image: steamHeaderImage(1245620),
    imagePosition: "center center",
  },
  {
    title: "The Witcher 3: Wild Hunt",
    match: 91,
    matchTier: "best_match",
    matchNote: "Story · Choices · Immersion",
    reason: "A rich world with memorable stories, characters, and long adventures.",
    image: HOME_DEMO_GAMES.witcher3.image,
    imagePosition: "center center",
  },
  {
    title: "The Elder Scrolls V: Skyrim",
    match: 89,
    matchTier: "good_alternative",
    matchNote: "Freedom · Exploration · Roleplay",
    reason: "Freedom to explore, build your character, and create your own journey.",
    image: steamHeaderImage(489830),
    imagePosition: "center center",
  },
  {
    title: "Red Dead Redemption 2",
    match: 87,
    matchTier: "good_alternative",
    matchNote: "Living world · Exploration · Atmosphere",
    reason: "A detailed world built around immersion, discovery, and atmosphere.",
    image: steamHeaderImage(1174180),
    imagePosition: "center 30%",
  },
  {
    title: "Baldur's Gate 3",
    match: 85,
    matchTier: "good_alternative",
    matchNote: "Choices · Roleplay · Characters",
    reason: "Deep roleplaying where decisions shape your adventure.",
    image: steamHeaderImage(1086940),
    imagePosition: "center 30%",
  },
  {
    title: "Cyberpunk 2077",
    match: 83,
    matchTier: "partial_match",
    matchNote: "Player choice · World · Builds",
    reason: "A dense world with quests, builds, and personal stories to uncover.",
    image: HOME_DEMO_GAMES.cyberpunk2077.image,
    imagePosition: "center 20%",
  },
];

export const HOME_HERO_DEMO_REFINED_RESULTS: RecommendResultCardGame[] = [
  {
    title: "Stardew Valley",
    match: 96,
    matchTier: "best_match",
    matchNote: "Relaxing · Progression · Routine",
    reason: "A peaceful world where small daily goals turn into hundreds of hours.",
    image: HOME_DEMO_GAMES.stardewValley.image,
    imagePosition: "center center",
  },
  {
    title: "No Man's Sky",
    match: 92,
    matchTier: "best_match",
    matchNote: "Exploration · Freedom · Discovery",
    reason: "Endless exploration at your own pace across a huge universe.",
    image: steamHeaderImage(275850),
    imagePosition: "center center",
  },
  {
    title: "Subnautica",
    match: 90,
    matchTier: "good_alternative",
    matchNote: "Exploration · Mystery · Immersion",
    reason: "A mysterious world focused on discovery, survival, and curiosity.",
    image: steamHeaderImage(264710),
    imagePosition: "center center",
  },
  {
    title: "Outer Wilds",
    match: 88,
    matchTier: "good_alternative",
    matchNote: "Discovery · Mystery · Exploration",
    reason: "A journey driven by curiosity, secrets, and unforgettable discoveries.",
    image: HOME_DEMO_GAMES.outerWilds.image,
    imagePosition: "center center",
  },
];

/** Stable image set for hero demo preload (homepage only). */
export function collectHomeHeroDemoImageUrls(): string[] {
  const urls = new Set<string>();
  for (const game of [...HOME_HERO_DEMO_INITIAL_RESULTS, ...HOME_HERO_DEMO_REFINED_RESULTS]) {
    if (game.image) urls.add(game.image);
  }
  return [...urls];
}
