import type { RecommendResultCardGame } from "@/components/recommend/RecommendResultCardView"

/** Homepage hero preview cards (same copy as `src/app/page.tsx`). */
export const PREVIEW_GAMES_HOME = [
  {
    title: "Hades",
    match: "96%",
    reason: "Fast combat, roguelite loop, perfect for short sessions",
    price: "$8.24",
  },
  {
    title: "Disco Elysium",
    match: "91%",
    reason: "Story-rich, deep choices, unforgettable writing",
    price: "$8.88",
  },
  {
    title: "Hollow Knight",
    match: "89%",
    reason: "Dark atmosphere, exploration, challenge",
    price: "$7.49",
  },
] as const

/** How it works steps (`src/app/page.tsx`). */
export const HOW_IT_WORKS_FEATURES = [
  {
    label: "01",
    title: "Describe your taste",
    text: "Write one sentence or pick a few tags. GamePing understands mood, genres, budget, and platform.",
  },
  {
    label: "02",
    title: "Get smarter picks",
    text: "Get picks with a match score, a clear reason, and real prices found online.",
  },
  {
    label: "03",
    title: "Track better deals",
    text: "Save a recommendation run to your dashboard for deal alerts. Follow one game’s price from its game page.",
  },
] as const

export const RECOMMEND_PROMPT =
  "Cozy roguelike with short runs — like Hades but slower-paced and less punishing"

export const REFINE_INPUT = "less famous, more story, not multiplayer"

export const HADES_HEADER_IMAGE =
  "https://media.rawg.io/media/games/baf/baf9905270314e07e6850cffdb51df41.jpg"

export const MOCK_RECOMMEND_GAMES: RecommendResultCardGame[] = [
  {
    title: "Hades",
    match: 96,
    matchTier: "best_match",
    reason:
      "Fast combat and roguelite runs match your vibe; great for short sessions without losing depth.",
    image: HADES_HEADER_IMAGE,
    budgetNote: "Often around $8–15 on sale",
  },
  {
    title: "Cult of the Lamb",
    match: 91,
    matchTier: "good_alternative",
    matchNote: "Cozy base-building with roguelite combat loops",
    reason:
      "Cute aesthetic but still has bite — base management plus dungeon runs for evening sessions.",
    image: "https://media.rawg.io/media/games/51c/51c430f1795c79b78f863a9f22dc422d.jpg",
    budgetNote: "Frequently under $20",
  },
]

/** After refine — second pick promoted as improved match. */
export const MOCK_REFINED_GAME: RecommendResultCardGame = {
  title: "Disco Elysium",
  match: 94,
  matchTier: "best_match",
  matchNote: "Story-forward RPG — matches your refine request",
  reason:
    "Deep narrative and player choice over combat grind; less famous than mainstream RPGs but highly regarded for story.",
  image: "https://media.rawg.io/media/games/34e/34e100b1f648de99f32d477065f04653.jpg",
  budgetNote: "Often around $10–20 on sale",
}
