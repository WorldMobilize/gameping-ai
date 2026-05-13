import { steamHeaderImage } from "@/lib/curated/game-links";

export type HomeGamePick = {
  title: string;
  /** Short genre or vibe label */
  tag: string;
  image: string;
};

/**
 * Curated picks for the homepage carousel only — no API calls.
 * Images: Steam store headers (stable CDN URLs).
 */
export const HOME_CAROUSEL_PICKS: HomeGamePick[] = [
  {
    title: "Hades",
    tag: "Roguelike · Mythic action",
    image: steamHeaderImage(1145360),
  },
  {
    title: "Stardew Valley",
    tag: "Cozy · Farming sim",
    image: steamHeaderImage(413150),
  },
  {
    title: "Hollow Knight",
    tag: "Metroidvania · Atmospheric",
    image: steamHeaderImage(367520),
  },
  {
    title: "Disco Elysium",
    tag: "Narrative RPG · Choices",
    image: steamHeaderImage(632470),
  },
  {
    title: "Dead Cells",
    tag: "Roguelite · Fast combat",
    image: steamHeaderImage(588650),
  },
  {
    title: "Subnautica",
    tag: "Survival · Underwater",
    image: steamHeaderImage(264710),
  },
  {
    title: "Life is Strange",
    tag: "Story-driven · Emotional",
    image: steamHeaderImage(319630),
  },
  {
    title: "Terraria",
    tag: "Sandbox · Crafting",
    image: steamHeaderImage(105600),
  },
  {
    title: "The Forest",
    tag: "Survival · Horror",
    image: steamHeaderImage(242760),
  },
  {
    title: "Stranded Deep",
    tag: "Survival · Island",
    image: steamHeaderImage(313120),
  },
];

/** Alphabetical directory listing (static seed list). */
export const DIRECTORY_GAMES: HomeGamePick[] = [...HOME_CAROUSEL_PICKS].sort((a, b) =>
  a.title.localeCompare(b.title)
);
