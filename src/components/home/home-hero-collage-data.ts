import { steamPortraitImage } from "@/lib/curated/game-links";

/**
 * Static placeholder artwork for the hero discovery collage.
 *
 * NOTE: This is intentionally static. The shape (columns of items) is structured
 * so a future data source (e.g. RAWG trending covers) could replace
 * `HOME_HERO_COLLAGE_COLUMNS` without changing the presentational component.
 * Do NOT add dynamic fetching here.
 */

export type HeroCollageItem = {
  title: string;
  image: string;
  /** Subtle rotation for a natural, hand-placed feel. */
  rotateClass: string;
};

export type HeroCollageColumn = {
  /** Vertical offset so columns stagger like a discovery queue. */
  offsetClass: string;
  items: HeroCollageItem[];
};

export const HOME_HERO_COLLAGE_COLUMNS: HeroCollageColumn[] = [
  {
    offsetClass: "",
    items: [
      { title: "Hades", image: steamPortraitImage(1145360), rotateClass: "-rotate-2" },
      { title: "Hollow Knight", image: steamPortraitImage(367520), rotateClass: "rotate-1" },
      { title: "Stardew Valley", image: steamPortraitImage(413150), rotateClass: "-rotate-1" },
    ],
  },
  {
    offsetClass: "mt-6 sm:mt-8",
    items: [
      { title: "Elden Ring", image: steamPortraitImage(1245620), rotateClass: "rotate-1" },
      { title: "Disco Elysium", image: steamPortraitImage(632470), rotateClass: "-rotate-1" },
      { title: "Celeste", image: steamPortraitImage(504230), rotateClass: "rotate-2" },
    ],
  },
  {
    offsetClass: "mt-3 sm:mt-4",
    items: [
      { title: "The Witcher 3", image: steamPortraitImage(292030), rotateClass: "rotate-2" },
      { title: "Cyberpunk 2077", image: steamPortraitImage(1091500), rotateClass: "-rotate-2" },
      { title: "Outer Wilds", image: steamPortraitImage(753640), rotateClass: "rotate-1" },
    ],
  },
];
