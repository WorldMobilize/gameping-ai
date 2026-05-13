import { steamHeaderImage } from "@/lib/curated/game-links";

export type CuratedCollectionGame = {
  title: string;
  image: string;
  whyItFits: string;
};

export type CuratedCollection = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  games: CuratedCollectionGame[];
};

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    slug: "games-like-hades",
    seoTitle: "Games like Hades | Fast roguelike picks | GamePing AI",
    metaDescription:
      "Discover games like Hades: stylish action, mythic flair, and satisfying roguelike runs. Curated angles for fans of Supergiant’s hit—then get your own AI matches on GamePing.",
    h1: "Games like Hades",
    intro:
      "If you love Hades for its fast combat, build variety, and “one more run” pacing, these titles echo that energy—tight action, meaningful progression, and strong style. Use them as a starting point, then ask GamePing for picks tuned to your exact mood and budget.",
    games: [
      {
        title: "Hades",
        image: steamHeaderImage(1145360),
        whyItFits:
          "The blueprint: fluid combat, godly boons, and a loop that stays fresh run after run.",
      },
      {
        title: "Dead Cells",
        image: steamHeaderImage(588650),
        whyItFits:
          "Snappy melee, aggressive movement, and rogue-lite upgrades that change how each run feels.",
      },
      {
        title: "Hollow Knight",
        image: steamHeaderImage(367520),
        whyItFits:
          "Demanding combat and exploration—less roguelike, but the same love of skillful timing.",
      },
      {
        title: "Risk of Rain 2",
        image: steamHeaderImage(632360),
        whyItFits:
          "Escalating chaos, build synergy, and co-op energy when you want variety beyond single-player runs.",
      },
      {
        title: "Cult of the Lamb",
        image: steamHeaderImage(1354830),
        whyItFits:
          "Action runs paired with light management—another stylish take on repeat visits and growth.",
      },
    ],
  },
  {
    slug: "games-like-disco-elysium",
    seoTitle: "Games like Disco Elysium | Narrative RPGs | GamePing AI",
    metaDescription:
      "Story-heavy RPGs and dialogue-driven games for Disco Elysium fans—choices, tone, and memorable writing. Explore curated examples, then personalize recommendations on GamePing.",
    h1: "Games like Disco Elysium",
    intro:
      "Disco Elysium rewards readers and decision-makers: branching dialogue, voice, and consequence. These games lean into narrative craft, character drama, and player agency—perfect companions while you hunt for your next obsession.",
    games: [
      {
        title: "Disco Elysium",
        image: steamHeaderImage(632470),
        whyItFits:
          "Unmatched prose and skill-check storytelling—still the gold standard for dialogue-first RPGs.",
      },
      {
        title: "Life is Strange",
        image: steamHeaderImage(319630),
        whyItFits:
          "Episodic choices with emotional weight—small decisions that ripple through relationships.",
      },
      {
        title: "What Remains of Edith Finch",
        image: steamHeaderImage(501300),
        whyItFits:
          "A short, literary experience where story and environment carry every beat.",
      },
      {
        title: "Night in the Woods",
        image: steamHeaderImage(481510),
        whyItFits:
          "Sharp writing and grounded themes—character drama over combat fantasy.",
      },
      {
        title: "To the Moon",
        image: steamHeaderImage(206440),
        whyItFits:
          "Pushes narrative forward with minimal mechanics—pure emotional storytelling.",
      },
    ],
  },
  {
    slug: "best-cozy-games",
    seoTitle: "Best cozy games | Relaxing picks | GamePing AI",
    metaDescription:
      "Low-stress, wholesome games: farming, gentle loops, and comforting vibes. A curated cozy starter list—then ask GamePing for cozy picks that fit your platform and budget.",
    h1: "Best cozy games",
    intro:
      "Cozy doesn’t mean boring—it means rhythm you can settle into: tending crops, gentle exploration, or quiet stories without pressure. These games are known comfort-food experiences; mix and match with your own taste using AI recommendations.",
    games: [
      {
        title: "Stardew Valley",
        image: steamHeaderImage(413150),
        whyItFits:
          "The cozy blueprint—farming, friendships, and seasons at your own pace.",
      },
      {
        title: "Unpacking",
        image: steamHeaderImage(1135690),
        whyItFits:
          "Meditative puzzle-box storytelling—no timers, just tactile calm.",
      },
      {
        title: "Coffee Talk",
        image: steamHeaderImage(1398590),
        whyItFits:
          "Late-night conversations and warm drinks—a literal cozy atmosphere.",
      },
      {
        title: "A Short Hike",
        image: steamHeaderImage(1055540),
        whyItFits:
          "Small open world, breezy exploration, and charming characters.",
      },
      {
        title: "Terraria",
        image: steamHeaderImage(105600),
        whyItFits:
          "Sandbox creativity—cozy when you build at your speed, exciting when you want more.",
      },
    ],
  },
  {
    slug: "best-emotional-story-games",
    seoTitle: "Best emotional story games | Narrative picks | GamePing AI",
    metaDescription:
      "Story-first games that hit hard: memorable characters, tough choices, and lasting moments. Curated examples for narrative fans—then personalize your next picks with GamePing.",
    h1: "Best emotional story games",
    intro:
      "These games put feelings front and center—through writing, performance, or the spaces between scenes. They’re not all sad, but they’re all sincere. Use this list as inspiration, then describe what you want to feel next on GamePing.",
    games: [
      {
        title: "Life is Strange",
        image: steamHeaderImage(319630),
        whyItFits:
          "Friendship, regret, and choice—an episodic format built around emotional beats.",
      },
      {
        title: "Disco Elysium",
        image: steamHeaderImage(632470),
        whyItFits:
          "A masterclass in character interiority and moral fog.",
      },
      {
        title: "What Remains of Edith Finch",
        image: steamHeaderImage(501300),
        whyItFits:
          "Each chapter a distinct tone—grief, wonder, and family myth in one walk.",
      },
      {
        title: "To the Moon",
        image: steamHeaderImage(206440),
        whyItFits:
          "A lean RPG framework in service of a single, heartfelt arc.",
      },
      {
        title: "Night in the Woods",
        image: steamHeaderImage(481510),
        whyItFits:
          "Coming-of-age honesty with humor and ache in equal measure.",
      },
    ],
  },
  {
    slug: "best-underwater-exploration-games",
    seoTitle: "Best underwater exploration games | Ocean & diving picks | GamePing AI",
    metaDescription:
      "Explore oceans, wrecks, and alien seas—curated underwater games for discovery fans. See examples, then get tailored exploration picks from GamePing AI.",
    h1: "Best underwater exploration games",
    intro:
      "There’s something distinct about blue-space exploration—vertical movement, bioluminescence, and the hush of pressure. These games lean into that fantasy, from survival crafting to artful swimming journeys.",
    games: [
      {
        title: "Subnautica",
        image: steamHeaderImage(264710),
        whyItFits:
          "The flagship underwater survival experience—fear and wonder in equal measure.",
      },
      {
        title: "Abzu",
        image: steamHeaderImage(384190),
        whyItFits:
          "Art-forward diving—more pilgrimage than survival, pure motion and mood.",
      },
      {
        title: "Stranded Deep",
        image: steamHeaderImage(313120),
        whyItFits:
          "Island survival with serious ocean hazard—exploration with stakes.",
      },
    ],
  },
  {
    slug: "best-island-survival-games",
    seoTitle: "Best island survival games | Crafting & stranded picks | GamePing AI",
    metaDescription:
      "Stranded on an island: crafting, shelter, and survival loops curated for fans of deserted-beach fantasy. Sample games listed—then ask GamePing for matches to your style.",
    h1: "Best island survival games",
    intro:
      "Island survival is about improvisation—fire, food, shelter, and slowly turning chaos into a home. These games emphasize crafting, exploration, and tension between calm shores and dangerous nights.",
    games: [
      {
        title: "Stranded Deep",
        image: steamHeaderImage(313120),
        whyItFits:
          "Lean into the premise—small-scale survival with ocean travel and crafting.",
      },
      {
        title: "The Forest",
        image: steamHeaderImage(242760),
        whyItFits:
          "Forest island horror—survival crafting with a terrifying twist.",
      },
      {
        title: "Raft",
        image: steamHeaderImage(648800),
        whyItFits:
          "Floating base-building—turn driftwood into a mobile island of your own.",
      },
      {
        title: "Subnautica",
        image: steamHeaderImage(264710),
        whyItFits:
          "Water-world survival—different biome, same stranded ingenuity.",
      },
    ],
  },
];

export function getCollectionBySlug(slug: string): CuratedCollection | undefined {
  return CURATED_COLLECTIONS.find((c) => c.slug === slug);
}

export function getAllCollectionSlugs(): string[] {
  return CURATED_COLLECTIONS.map((c) => c.slug);
}
