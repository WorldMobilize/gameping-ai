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
      {
        title: "Bastion",
        image: steamHeaderImage(107100),
        whyItFits:
          "Supergiant lineage—tight narration and reactive combat before the roguelike loop took center stage.",
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
  {
    slug: "games-like-hollow-knight",
    seoTitle: "Games like Hollow Knight | Metroidvania picks | GamePing AI",
    metaDescription:
      "Tight combat, moody worlds, and rewarding exploration for Hollow Knight fans. Curated metroidvania-style picks—then personalize matches on GamePing.",
    h1: "Games like Hollow Knight",
    intro:
      "Hollow Knight nails deliberate combat, interconnected maps, and atmosphere you feel in every room. These games share that mix of skill, discovery, and quiet dread—without copying the same mold.",
    games: [
      {
        title: "Ori and the Will of the Wisps",
        image: steamHeaderImage(1057090),
        whyItFits: "Fluid platforming, emotional tone, and ability-gated paths through a luminous world.",
      },
      {
        title: "Dead Cells",
        image: steamHeaderImage(588650),
        whyItFits: "Fast rooms and build variety when you want combat-forward runs instead of slow mapping.",
      },
      {
        title: "Celeste",
        image: steamHeaderImage(504230),
        whyItFits: "Precision platforming with heart—challenge as character study, not just difficulty.",
      },
      {
        title: "Blasphemous",
        image: steamHeaderImage(774361),
        whyItFits: "Dark religious art direction and punishing melee—exploration with ritual weight.",
      },
      {
        title: "Rain World",
        image: steamHeaderImage(312520),
        whyItFits: "Harsh ecosystem fantasy—stealth, timing, and memorable environmental storytelling.",
      },
    ],
  },
  {
    slug: "games-like-stardew-valley",
    seoTitle: "Games like Stardew Valley | Cozy farming picks | GamePing AI",
    metaDescription:
      "Farming loops, gentle progression, and town life for Stardew fans. Curated cozy sims and sandboxes—then get tailored picks from GamePing AI.",
    h1: "Games like Stardew Valley",
    intro:
      "Stardew is rhythm: plant, chat, explore, repeat—without punishing the clock. These games offer similar comfort through farming, crafting, or low-pressure worlds you can grow at your pace.",
    games: [
      {
        title: "Slime Rancher",
        image: steamHeaderImage(433340),
        whyItFits: "Gather, upgrade, and wander—satisfying collection loops with sunny exploration.",
      },
      {
        title: "Spiritfarer",
        image: steamHeaderImage(972660),
        whyItFits: "Management with emotional stakes—caring for passengers while you sail and craft.",
      },
      {
        title: "Dredge",
        image: steamHeaderImage(1562430),
        whyItFits: "Daily fishing routes and town upgrades—cozy structure with a subtle mystery undertow.",
      },
      {
        title: "My Time at Portia",
        image: steamHeaderImage(666140),
        whyItFits: "Workshop crafting and friendly quests—Stardew energy in a 3D frontier town.",
      },
      {
        title: "Terraria",
        image: steamHeaderImage(105600),
        whyItFits: "When you want more action between harvests—building, bosses, and co-op sandbox freedom.",
      },
    ],
  },
  {
    slug: "games-like-terraria",
    seoTitle: "Games like Terraria | Sandbox crafting picks | GamePing AI",
    metaDescription:
      "2D sandbox adventures with crafting, bosses, and co-op for Terraria fans. Explore curated picks—then ask GamePing for matches to your vibe.",
    h1: "Games like Terraria",
    intro:
      "Terraria is dig-fight-build-repeat on a huge canvas. These games scratch the same itch: procedural worlds, gear progression, and friends optional but welcome.",
    games: [
      {
        title: "Starbound",
        image: steamHeaderImage(211820),
        whyItFits: "Spacefaring sandbox—planets to colonize and gear tiers to chase with friends.",
      },
      {
        title: "Core Keeper",
        image: steamHeaderImage(1621690),
        whyItFits: "Underground biomes and base building—lighter tone, same co-op mining energy.",
      },
      {
        title: "Valheim",
        image: steamHeaderImage(892970),
        whyItFits: "3D survival crafting with mythic bosses—building big when you outgrow side-scroll.",
      },
      {
        title: "Minecraft",
        image: steamHeaderImage(1672970),
        whyItFits: "The ultimate block canvas—creative mode or survival, mods, and endless projects.",
      },
      {
        title: "Don't Starve Together",
        image: steamHeaderImage(322330),
        whyItFits: "Seasons, crafting trees, and quirky danger—survival sandbox with strong personality.",
      },
    ],
  },
  {
    slug: "games-like-elden-ring",
    seoTitle: "Games like Elden Ring | Open-world action RPGs | GamePing AI",
    metaDescription:
      "Expansive worlds, tough combat, and build variety for Elden Ring fans. Curated soulslikes and action RPGs—personalize your next hunt on GamePing.",
    h1: "Games like Elden Ring",
    intro:
      "Elden Ring blends open exploration with punishing encounters and build freedom. These games offer similar tension between wonder, dread, and mastery—on foot, on horseback, or through different mythic lenses.",
    games: [
      {
        title: "Dark Souls III",
        image: steamHeaderImage(374320),
        whyItFits: "Tighter legacy dungeons—methodical combat and interconnected level design.",
      },
      {
        title: "Sekiro: Shadows Die Twice",
        image: steamHeaderImage(814380),
        whyItFits: "Posture duels and vertical arenas—skill expression without heavy RPG clutter.",
      },
      {
        title: "Lies of P",
        image: steamHeaderImage(1627720),
        whyItFits: "Soulslike structure with parry-forward combat and a dark fairy-tale city.",
      },
      {
        title: "NieR:Automata",
        image: steamHeaderImage(524220),
        whyItFits: "Stylish action and philosophical arcs—combat variety with narrative ambition.",
      },
      {
        title: "Ghost of Tsushima DIRECTOR'S CUT",
        image: steamHeaderImage(2215430),
        whyItFits: "Open fields and duel rhythm—exploration-first samurai fantasy with strong flow.",
      },
    ],
  },
  {
    slug: "games-like-skyrim",
    seoTitle: "Games like Skyrim | Open-world RPG picks | GamePing AI",
    metaDescription:
      "Wander, quest, and build a character your way—games like Skyrim for open-world RPG fans. Curated examples, then AI-tailored recommendations on GamePing.",
    h1: "Games like Skyrim",
    intro:
      "Skyrim is the fantasy road trip: go anywhere, pick a build, stumble into stories. These RPGs emphasize exploration, faction quests, and playing your character—not a single critical path.",
    games: [
      {
        title: "The Witcher 3: Wild Hunt",
        image: steamHeaderImage(292030),
        whyItFits: "Monster contracts and political drama—mature writing with a lived-in open map.",
      },
      {
        title: "Fallout: New Vegas",
        image: steamHeaderImage(22380),
        whyItFits: "Faction reputation and reactive quests—RPG systems that remember your choices.",
      },
      {
        title: "Baldur's Gate 3",
        image: steamHeaderImage(1086940),
        whyItFits: "Party-driven storytelling—tactical depth when you want companions in the loop.",
      },
      {
        title: "Kingdom Come: Deliverance",
        image: steamHeaderImage(379430),
        whyItFits: "Grounded medieval sim—training, travel, and consequence without dragons everywhere.",
      },
      {
        title: "Horizon Zero Dawn Complete Edition",
        image: steamHeaderImage(1151640),
        whyItFits: "Machine hunting across vibrant biomes—action RPG exploration with a strong lead.",
      },
    ],
  },
  {
    slug: "games-like-subnautica",
    seoTitle: "Games like Subnautica | Underwater survival picks | GamePing AI",
    metaDescription:
      "Ocean dread, base building, and discovery for Subnautica fans. Curated underwater and survival picks—then personalize on GamePing AI.",
    h1: "Games like Subnautica",
    intro:
      "Subnautica turns the sea into a character—beauty, pressure, and things you should not meet. These games echo exploration, crafting, and the pull of what is just beyond your lights.",
    games: [
      {
        title: "No Man's Sky",
        image: steamHeaderImage(275850),
        whyItFits: "Planet hopping and base modules—sci-fi exploration when you want sky instead of depth.",
      },
      {
        title: "Stranded Deep",
        image: steamHeaderImage(313120),
        whyItFits: "Island-to-island survival—shallower waters, same improvisational crafting loop.",
      },
      {
        title: "Raft",
        image: steamHeaderImage(648800),
        whyItFits: "Floating home expansion—ocean debris turned into a drifting base.",
      },
      {
        title: "Abzu",
        image: steamHeaderImage(384190),
        whyItFits: "Meditative swimming—mood and motion when you want less inventory management.",
      },
      {
        title: "Dave the Diver",
        image: steamHeaderImage(1868140),
        whyItFits: "Day dives and evening restaurant—lighter ocean loops with charming progression.",
      },
    ],
  },
  {
    slug: "games-like-rimworld",
    seoTitle: "Games like RimWorld | Colony sim picks | GamePing AI",
    metaDescription:
      "Story-generating colony sims for RimWorld fans—crafting, survival, and emergent drama. Curated picks, then AI matches on GamePing.",
    h1: "Games like RimWorld",
    intro:
      "RimWorld is watching plans collide with chaos—colonists, moods, and accidents that become legends. These games emphasize systems, survival, and stories you did not script.",
    games: [
      {
        title: "Project Zomboid",
        image: steamHeaderImage(108600),
        whyItFits: "Long-term survival sandbox—base fortification and quiet dread in suburbs.",
      },
      {
        title: "Kenshi",
        image: steamHeaderImage(233860),
        whyItFits: "Squad simulation in a harsh open world—no chosen hero, just persistent struggle.",
      },
      {
        title: "Factorio",
        image: steamHeaderImage(427520),
        whyItFits: "Automation obsession—when your colony fantasy is really about perfect throughput.",
      },
      {
        title: "Frostpunk",
        image: steamHeaderImage(323190),
        whyItFits: "City survival under pressure—morale laws and heat as resources.",
      },
      {
        title: "They Are Billions",
        image: steamHeaderImage(644930),
        whyItFits: "RTS colony defense—waves that punish a sprawling base plan.",
      },
    ],
  },
  {
    slug: "games-like-factorio",
    seoTitle: "Games like Factorio | Factory automation picks | GamePing AI",
    metaDescription:
      "Belts, ratios, and satisfying factory builds for Factorio fans. Curated automation games—then find your next obsession on GamePing.",
    h1: "Games like Factorio",
    intro:
      "Factorio is clarity emerging from spaghetti—every bottleneck a puzzle. These games reward planning, throughput, and the joy of a line that finally works.",
    games: [
      {
        title: "Satisfactory",
        image: steamHeaderImage(526870),
        whyItFits: "3D factories on alien cliffs—vertical building and exploration between builds.",
      },
      {
        title: "Dyson Sphere Program",
        image: steamHeaderImage(1366540),
        whyItFits: "Interstellar scale logistics—powering a star when one planet is not enough.",
      },
      {
        title: "RimWorld",
        image: steamHeaderImage(294100),
        whyItFits: "Human drama between production goals—automation with personalities attached.",
      },
      {
        title: "Shapez 2",
        image: steamHeaderImage(2183900),
        whyItFits: "Pure shape pipelines—minimalist zen when you want puzzles without combat.",
      },
      {
        title: "Mindustry",
        image: steamHeaderImage(1127400),
        whyItFits: "Tower defense meets conveyor belts—factory brain with wave pressure.",
      },
    ],
  },
  {
    slug: "games-like-project-zomboid",
    seoTitle: "Games like Project Zomboid | Zombie survival picks | GamePing AI",
    metaDescription:
      "Hardcore survival and base building for Project Zomboid fans. Curated zombie and sandbox picks—personalize on GamePing AI.",
    h1: "Games like Project Zomboid",
    intro:
      "Project Zomboid treats the apocalypse as a long campaign—skills, loot, and bases that remember your mistakes. These games lean into survival stakes, crafting, and creeping dread.",
    games: [
      {
        title: "7 Days to Die",
        image: steamHeaderImage(251570),
        whyItFits: "Horde nights and voxel destruction—action-forward zombie weeks.",
      },
      {
        title: "State of Decay 2",
        image: steamHeaderImage(495420),
        whyItFits: "Community management—permadeath heroes and base upgrades between runs.",
      },
      {
        title: "They Are Billions",
        image: steamHeaderImage(644930),
        whyItFits: "RTS wave defense—planning a colony layout before the swarm arrives.",
      },
      {
        title: "RimWorld",
        image: steamHeaderImage(294100),
        whyItFits: "Colony stories without zombies—same emergent survival storytelling.",
      },
      {
        title: "Valheim",
        image: steamHeaderImage(892970),
        whyItFits: "Co-op building and bosses—Norse survival when you want melee over guns.",
      },
    ],
  },
  {
    slug: "games-like-slay-the-spire",
    seoTitle: "Games like Slay the Spire | Deckbuilder roguelikes | GamePing AI",
    metaDescription:
      "Card combos and run-based strategy for Slay the Spire fans. Curated deckbuilders—then get tailored roguelike picks on GamePing.",
    h1: "Games like Slay the Spire",
    intro:
      "Slay the Spire is one more floor because your deck might finally click. These roguelikes focus on synergies, risk, and readable decisions—turn-based or otherwise.",
    games: [
      {
        title: "Inscryption",
        image: steamHeaderImage(1092790),
        whyItFits: "Deck duels with unsettling framing—mechanics and narrative braid together.",
      },
      {
        title: "Monster Train",
        image: steamHeaderImage(1102190),
        whyItFits: "Multi-lane defense deckbuilding—clans that reward distinct strategies.",
      },
      {
        title: "Vault of the Void",
        image: steamHeaderImage(1144810),
        whyItFits: "Tactical grid positioning—deeper combat when you want more board geometry.",
      },
      {
        title: "Griftlands",
        image: steamHeaderImage(601840),
        whyItFits: "Negotiation and combat decks—social stakes between fights.",
      },
      {
        title: "Vampire Survivors",
        image: steamHeaderImage(1794680),
        whyItFits: "Auto-battler chaos—when you want buildcraft without stopping to think every card.",
      },
    ],
  },
  {
    slug: "games-like-outer-wilds",
    seoTitle: "Games like Outer Wilds | Exploration mystery picks | GamePing AI",
    metaDescription:
      "Curiosity-driven exploration and story reveals for Outer Wilds fans. Curated mystery worlds—personalize picks on GamePing AI.",
    h1: "Games like Outer Wilds",
    intro:
      "Outer Wilds rewards questions—every launch a chance to connect clues across space and time. These games emphasize discovery, wonder, and stories that unfold through exploration.",
    games: [
      {
        title: "Return of the Obra Dinn",
        image: steamHeaderImage(504750),
        whyItFits: "Deduction aboard a ghost ship—one memorable investigation with a distinct visual hook.",
      },
      {
        title: "The Witness",
        image: steamHeaderImage(210970),
        whyItFits: "Island of line puzzles—environment teaches language without explicit tutorials.",
      },
      {
        title: "Firewatch",
        image: steamHeaderImage(383870),
        whyItFits: "Walking, radio banter, and Wyoming smoke—human mystery on a smaller map.",
      },
      {
        title: "Journey",
        image: steamHeaderImage(638230),
        whyItFits: "Wordless travel through dunes—awe and connection in under two hours.",
      },
      {
        title: "Stanley Parable: Ultra Deluxe",
        image: steamHeaderImage(221830),
        whyItFits: "Meta narrative corridors—choices that comment on choice itself.",
      },
    ],
  },
  {
    slug: "games-like-baldurs-gate-3",
    seoTitle: "Games like Baldur's Gate 3 | Party CRPG picks | GamePing AI",
    metaDescription:
      "Deep party RPGs with choices and tactics for Baldur's Gate 3 fans. Curated CRPGs—then AI recommendations on GamePing.",
    h1: "Games like Baldur's Gate 3",
    intro:
      "Baldur's Gate 3 is campfire politics plus tactical fights—companions you care about and rolls that sting. These CRPGs emphasize party banter, branching quests, and crunchy combat.",
    games: [
      {
        title: "Divinity: Original Sin 2",
        image: steamHeaderImage(435150),
        whyItFits: "Elemental surfaces and co-op chaos—tactical freedom with strong character arcs.",
      },
      {
        title: "Pathfinder: Wrath of the Righteous",
        image: steamHeaderImage(1184370),
        whyItFits: "Mythic paths and army layers—epic scope when you want more systems.",
      },
      {
        title: "Pillars of Eternity II: Deadfire",
        image: steamHeaderImage(560130),
        whyItFits: "Naval CRPG exploration—factions and ship combat between isometric dungeons.",
      },
      {
        title: "Mass Effect Legendary Edition",
        image: steamHeaderImage(1328670),
        whyItFits: "Squad loyalty across a trilogy—relationships with sci-fi spectacle.",
      },
      {
        title: "Wasteland 3",
        image: steamHeaderImage(719040),
        whyItFits: "Tactical post-apocalypse—morally gray quests with co-op option.",
      },
    ],
  },
  {
    slug: "games-like-cyberpunk-2077",
    seoTitle: "Games like Cyberpunk 2077 | Sci-fi RPG picks | GamePing AI",
    metaDescription:
      "Neon cities, build variety, and story-driven action for Cyberpunk 2077 fans. Curated sci-fi RPGs—personalize on GamePing.",
    h1: "Games like Cyberpunk 2077",
    intro:
      "Cyberpunk 2077 sells Night City attitude—chrome, gigs, and relationships in a dense urban sandbox. These games mix futuristic settings with action RPG progression and strong side content.",
    games: [
      {
        title: "Deus Ex: Mankind Divided",
        image: steamHeaderImage(337000),
        whyItFits: "Immersive sim stealth—augments and multiple routes through Prague districts.",
      },
      {
        title: "Prey",
        image: steamHeaderImage(480490),
        whyItFits: "Space station paranoia—powers and environmental puzzles in one looping map.",
      },
      {
        title: "Mass Effect Legendary Edition",
        image: steamHeaderImage(1328670),
        whyItFits: "Galaxy-scale relationships—squad banter with cinematic missions.",
      },
      {
        title: "Watch Dogs 2",
        image: steamHeaderImage(447040),
        whyItFits: "Open-world hacking fantasy—lighter tone, similar urban sandbox energy.",
      },
      {
        title: "The Witcher 3: Wild Hunt",
        image: steamHeaderImage(292030),
        whyItFits: "Monster-hunting open world—mature quests when you want fantasy instead of chrome.",
      },
    ],
  },
  {
    slug: "games-like-the-witcher-3",
    seoTitle: "Games like The Witcher 3 | Open-world fantasy RPGs | GamePing AI",
    metaDescription:
      "Monster contracts, moral grey choices, and big maps for Witcher 3 fans. Curated fantasy RPGs—then GamePing AI recommendations.",
    h1: "Games like The Witcher 3",
    intro:
      "The Witcher 3 is road stories with teeth—preparation, consequence, and a world that feels tired in a believable way. These RPGs offer sprawling maps, side quests with bite, and characters who remember you.",
    games: [
      {
        title: "Red Dead Redemption 2",
        image: steamHeaderImage(1174180),
        whyItFits: "Slow-burn open world—camp life and honor in a cinematic western.",
      },
      {
        title: "The Elder Scrolls V: Skyrim Special Edition",
        image: steamHeaderImage(489830),
        whyItFits: "Go-anywhere fantasy—mods and guild quests for endless wandering.",
      },
      {
        title: "Kingdom Come: Deliverance",
        image: steamHeaderImage(379430),
        whyItFits: "Historical realism—training and reputation in a grounded medieval map.",
      },
      {
        title: "Assassin's Creed Odyssey",
        image: steamHeaderImage(812140),
        whyItFits: "Mediterranean exploration—naval travel and mythic side content.",
      },
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits: "Fantasy on foot and Torrent—tough combat when you want mystery over dialogue trees.",
      },
    ],
  },
  {
    slug: "games-like-red-dead-redemption-2",
    seoTitle: "Games like Red Dead Redemption 2 | Cinematic open worlds | GamePing AI",
    metaDescription:
      "Story-rich open worlds for Red Dead 2 fans—travel, tone, and memorable characters. Curated picks on GamePing AI.",
    h1: "Games like Red Dead Redemption 2",
    intro:
      "Red Dead 2 is patience rewarded—camp rhythm, stunning vistas, and tragedy you see coming but cannot stop. These games emphasize atmosphere, character drama, and worlds worth riding through.",
    games: [
      {
        title: "Ghost of Tsushima DIRECTOR'S CUT",
        image: steamHeaderImage(2215430),
        whyItFits: "Samurai open fields—wind-guided exploration and duel poetry.",
      },
      {
        title: "The Witcher 3: Wild Hunt",
        image: steamHeaderImage(292030),
        whyItFits: "Monster-hunting roads—mature fantasy with consequential side quests.",
      },
      {
        title: "Horizon Zero Dawn Complete Edition",
        image: steamHeaderImage(1151640),
        whyItFits: "Tribal sci-fi frontier—machine hunts across striking biomes.",
      },
      {
        title: "Death Stranding Director's Cut",
        image: steamHeaderImage(1850570),
        whyItFits: "Lonely delivery routes—strange beauty and asynchronous connection.",
      },
      {
        title: "The Last of Us Part I",
        image: steamHeaderImage(1888930),
        whyItFits: "Linear cinematic survival—relationship focus when you want a tighter arc.",
      },
    ],
  },
  {
    slug: "relaxing-games-after-work",
    seoTitle: "Relaxing games after work | Low-stress picks | GamePing AI",
    metaDescription:
      "Unwind with low-pressure games after a long day—cozy loops, gentle exploration, and calm pacing. Curated picks, then personalize on GamePing.",
    h1: "Relaxing games after work",
    intro:
      "After work you want something that meets you where you are—no homework, no raid timers. These games are easy to dip into: short sessions, forgiving failure, and vibes that help you decompress.",
    games: [
      {
        title: "Stardew Valley",
        image: steamHeaderImage(413150),
        whyItFits: "Twenty minutes of watering still feels like progress.",
      },
      {
        title: "A Short Hike",
        image: steamHeaderImage(1055540),
        whyItFits: "Finish a gentle climb in one sitting—pure breeze.",
      },
      {
        title: "Unpacking",
        image: steamHeaderImage(1135690),
        whyItFits: "Tactile sorting with no fail state—meditative and quiet.",
      },
      {
        title: "Euro Truck Simulator 2",
        image: steamHeaderImage(227300),
        whyItFits: "Highway hypnosis—radio on, routes simple, stress low.",
      },
      {
        title: "Slime Rancher",
        image: steamHeaderImage(433340),
        whyItFits: "Bright colors and collection—satisfying without urgency.",
      },
    ],
  },
  {
    slug: "atmospheric-exploration-games",
    seoTitle: "Atmospheric exploration games | Mood & discovery | GamePing AI",
    metaDescription:
      "Explore worlds built on mood, sound, and discovery—not checklists. Curated atmospheric games for GamePing fans.",
    h1: "Atmospheric exploration games",
    intro:
      "Some games are about how a place feels—fog, score, and silence between discoveries. These picks prioritize atmosphere and wandering over constant combat or UI noise.",
    games: [
      {
        title: "Firewatch",
        image: steamHeaderImage(383870),
        whyItFits: "Wyoming towers and radio companionship—small map, strong tone.",
      },
      {
        title: "Journey",
        image: steamHeaderImage(638230),
        whyItFits: "Wordless dunes—music swells that land without exposition.",
      },
      {
        title: "Inside",
        image: steamHeaderImage(304430),
        whyItFits: "Side-scrolling dread—environment tells the story.",
      },
      {
        title: "Abzu",
        image: steamHeaderImage(384190),
        whyItFits: "Underwater pilgrimage—color and motion as meditation.",
      },
      {
        title: "Outer Wilds",
        image: steamHeaderImage(753640),
        whyItFits: "Curiosity loop across a pocket solar system—wonder with stakes.",
      },
    ],
  },
  {
    slug: "games-for-rainy-nights",
    seoTitle: "Games for rainy nights | Cozy & moody picks | GamePing AI",
    metaDescription:
      "Perfect games for rainy evenings—warm interiors, noir moods, and gentle stories. Curated picks, then AI matches on GamePing.",
    h1: "Games for rainy nights",
    intro:
      "Rain on the window pairs with certain games: lamplight interiors, slow dialogue, or soft exploration. These titles match that mood without demanding hyperfocus.",
    games: [
      {
        title: "Coffee Talk",
        image: steamHeaderImage(1398590),
        whyItFits: "Late-night chats and warm drinks—literal rainy ambience.",
      },
      {
        title: "Night in the Woods",
        image: steamHeaderImage(481510),
        whyItFits: "Small-town autumn—humor, anxiety, and guitar in empty streets.",
      },
      {
        title: "Disco Elysium",
        image: steamHeaderImage(632470),
        whyItFits: "Noir introspection—one detective, many voices in your head.",
      },
      {
        title: "What Remains of Edith Finch",
        image: steamHeaderImage(501300),
        whyItFits: "Short family tales—melancholy with flashes of magic.",
      },
      {
        title: "Spiritfarer",
        image: steamHeaderImage(972660),
        whyItFits: "Ferry between souls—gentle crafting on quiet seas.",
      },
    ],
  },
  {
    slug: "beautiful-indie-games",
    seoTitle: "Beautiful indie games | Art-forward picks | GamePing AI",
    metaDescription:
      "Indie games with standout art direction—hand-drawn, painterly, and memorable visuals. Curated beauty-first picks on GamePing AI.",
    h1: "Beautiful indie games",
    intro:
      "These indies lead with craft—color, animation, or composition that sticks with you after you quit. Gameplay varies, but each one is worth showing someone who cares about visual design.",
    games: [
      {
        title: "Gris",
        image: steamHeaderImage(683320),
        whyItFits: "Watercolor platforming—grief expressed through palette shifts.",
      },
      {
        title: "Ori and the Will of the Wisps",
        image: steamHeaderImage(1057090),
        whyItFits: "Luminous forests and fluid motion—animated spectacle.",
      },
      {
        title: "Cuphead",
        image: steamHeaderImage(268910),
        whyItFits: "Rubber-hose boss rush—hand-drawn frames with jazz energy.",
      },
      {
        title: "Hollow Knight",
        image: steamHeaderImage(367520),
        whyItFits: "Gothic insect cathedrals—detail in every background layer.",
      },
      {
        title: "Tunic",
        image: steamHeaderImage(553420),
        whyItFits: "Isometric Zelda-like—manual discovery and pastel ruins.",
      },
    ],
  },
  {
    slug: "relaxing-survival-games",
    seoTitle: "Relaxing survival games | Low-stress crafting | GamePing AI",
    metaDescription:
      "Survival without constant panic—building, exploring, and gentle stakes. Curated relaxing survival picks on GamePing.",
    h1: "Relaxing survival games",
    intro:
      "Survival does not have to mean terror every night. These games keep crafting and exploration but dial back jump scares—good for players who want progress without dread.",
    games: [
      {
        title: "Minecraft",
        image: steamHeaderImage(1672970),
        whyItFits: "Peaceful mode or creative—survival tools without threats.",
      },
      {
        title: "Slime Rancher",
        image: steamHeaderImage(433340),
        whyItFits: "Ranch chores on a bright planet—collection over combat.",
      },
      {
        title: "Raft",
        image: steamHeaderImage(648800),
        whyItFits: "Co-op ocean expansion—shark tension you can manage together.",
      },
      {
        title: "Valheim",
        image: steamHeaderImage(892970),
        whyItFits: "Mead halls and sailing—Norse survival with cozy camp moments.",
      },
      {
        title: "No Man's Sky",
        image: steamHeaderImage(275850),
        whyItFits: "Relaxed exploration mode—base building among gentle planets.",
      },
    ],
  },
  {
    slug: "games-with-deep-stories",
    seoTitle: "Games with deep stories | Narrative-heavy picks | GamePing AI",
    metaDescription:
      "Story-first games with rich characters and consequential writing. Curated narrative picks—personalize on GamePing AI.",
    h1: "Games with deep stories",
    intro:
      "These games treat writing as the main attraction—branching dialogue, slow reveals, or novels disguised as play. Ideal when you want something to think about between sessions.",
    games: [
      {
        title: "Disco Elysium",
        image: steamHeaderImage(632470),
        whyItFits: "Skill-check prose—politics, pain, and humor in one city.",
      },
      {
        title: "Baldur's Gate 3",
        image: steamHeaderImage(1086940),
        whyItFits: "Companion arcs you feel—choices that echo across acts.",
      },
      {
        title: "Mass Effect Legendary Edition",
        image: steamHeaderImage(1328670),
        whyItFits: "Trilogy-length relationships—sci-fi opera with agency.",
      },
      {
        title: "The Last of Us Part I",
        image: steamHeaderImage(1888930),
        whyItFits: "Cinematic pacing—bonds under pressure in a broken world.",
      },
      {
        title: "Planescape: Torment",
        image: steamHeaderImage(466300),
        whyItFits: "Philosophical CRPG—dialogue as the primary weapon.",
      },
    ],
  },
  {
    slug: "games-to-get-lost-in",
    seoTitle: "Games to get lost in | Immersive worlds | GamePing AI",
    metaDescription:
      "Big worlds and immersive loops you can sink hours into. Curated get-lost-in-it games—then AI picks on GamePing.",
    h1: "Games to get lost in",
    intro:
      "The best time sinks give you direction without rushing you—maps that unfold, systems that click, and always one more thing to see. These games are built for long evenings and weekend marathons.",
    games: [
      {
        title: "The Elder Scrolls V: Skyrim Special Edition",
        image: steamHeaderImage(489830),
        whyItFits: "Guild rabbit holes and mod rabbit holes—classic wander fuel.",
      },
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits: "Vertical continents of secrets—discovery with combat mastery.",
      },
      {
        title: "No Man's Sky",
        image: steamHeaderImage(275850),
        whyItFits: "Galaxy of bases—always another planet color palette.",
      },
      {
        title: "RimWorld",
        image: steamHeaderImage(294100),
        whyItFits: "Colony sagas—one more season before bed.",
      },
      {
        title: "Factorio",
        image: steamHeaderImage(427520),
        whyItFits: "Factory brain—hours disappear into throughput graphs.",
      },
    ],
  },
  {
    slug: "emotional-indie-games",
    seoTitle: "Emotional indie games | Small-team stories | GamePing AI",
    metaDescription:
      "Indie games that hit emotionally—intimate stories and memorable characters. Curated picks separate from big-budget narrative lists.",
    h1: "Emotional indie games",
    intro:
      "Smaller teams often take bigger emotional swings—these indies focus on personal stakes, grief, friendship, or hope without blockbuster spectacle. Different from our broader emotional story roundup.",
    games: [
      {
        title: "Spiritfarer",
        image: steamHeaderImage(972660),
        whyItFits: "Farewells on a boat—management as metaphor for letting go.",
      },
      {
        title: "Gris",
        image: steamHeaderImage(683320),
        whyItFits: "Color as emotion—platforming through depression and return.",
      },
      {
        title: "To the Moon",
        image: steamHeaderImage(206440),
        whyItFits: "Retro framing, modern ache—memory and regret in pixel form.",
      },
      {
        title: "Undertale",
        image: steamHeaderImage(391540),
        whyItFits: "Choice and mercy—humor that turns sharp when you pay attention.",
      },
      {
        title: "Celeste",
        image: steamHeaderImage(504230),
        whyItFits: "Anxiety as a mountain—mechanics mirror the theme.",
      },
    ],
  },
  {
    slug: "games-with-amazing-worlds",
    seoTitle: "Games with amazing worlds | Worldbuilding picks | GamePing AI",
    metaDescription:
      "Memorable settings and worldbuilding—fantasy, sci-fi, and surreal spaces worth visiting. Curated on GamePing AI.",
    h1: "Games with amazing worlds",
    intro:
      "These games sell a place first—architecture, ecology, history you infer from ruins. Combat and quests matter, but you keep playing to see what is over the next ridge.",
    games: [
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits: "Interconnected myth—environmental storytelling at scale.",
      },
      {
        title: "Horizon Zero Dawn Complete Edition",
        image: steamHeaderImage(1151640),
        whyItFits: "Tribal future against machine fauna—distinct biomes and lore tablets.",
      },
      {
        title: "BioShock Infinite",
        image: steamHeaderImage(8870),
        whyItFits: "Columbia in the clouds—art deco absurdity with narrative bite.",
      },
      {
        title: "Ghost of Tsushima DIRECTOR'S CUT",
        image: steamHeaderImage(2215430),
        whyItFits: "Feudal Japan fields—guiding wind and cinematic horizons.",
      },
      {
        title: "Subnautica",
        image: steamHeaderImage(264710),
        whyItFits: "Alien ocean ecology—depth as worldbuilding.",
      },
    ],
  },
  {
    slug: "cozy-games-for-long-nights",
    seoTitle: "Cozy games for long nights | Comfort gaming | GamePing AI",
    metaDescription:
      "Settle in for long cozy sessions—farming, crafting, and gentle stories without a hard stop. Distinct from quick cozy lists on GamePing.",
    h1: "Cozy games for long nights",
    intro:
      "Some cozy games are snacks; these are slow meals—systems that deepen the longer you stay: seasons, relationships, or bases that grow while you chat with friends.",
    games: [
      {
        title: "Stardew Valley",
        image: steamHeaderImage(413150),
        whyItFits: "Year-one to year-three arcs—community and farm long games.",
      },
      {
        title: "Spiritfarer",
        image: steamHeaderImage(972660),
        whyItFits: "Full passenger stories—emotional nights on the water.",
      },
      {
        title: "Slime Rancher 2",
        image: steamHeaderImage(1657630),
        whyItFits: "Ranch expansion and exploration—bright marathon-friendly loop.",
      },
      {
        title: "Terraria",
        image: steamHeaderImage(105600),
        whyItFits: "Boss gates and builds—cozy becomes epic at your pace.",
      },
      {
        title: "Cities: Skylines",
        image: steamHeaderImage(255710),
        whyItFits: "Traffic zen—watch a city breathe under streetlights.",
      },
    ],
  },
  {
    slug: "best-roguelike-games",
    seoTitle: "Best roguelike games | Run-based picks | GamePing AI",
    metaDescription:
      "Roguelikes and roguelites with strong runs, builds, and replay—curated evergreen list for discovery on GamePing.",
    h1: "Best roguelike games",
    intro:
      "Roguelikes are built on repetition with surprise—new maps, synergies, and lessons carried between runs. This list spans deckbuilders, action, and twin-stick angles beyond any single hit.",
    games: [
      {
        title: "Hades",
        image: steamHeaderImage(1145360),
        whyItFits: "Narrative roguelike—relationships that advance between deaths.",
      },
      {
        title: "Dead Cells",
        image: steamHeaderImage(588650),
        whyItFits: "Fast rooms and weapons—skill growth with meta unlocks.",
      },
      {
        title: "Slay the Spire",
        image: steamHeaderImage(646570),
        whyItFits: "Deck synergy textbook—risk/reward on every path choice.",
      },
      {
        title: "Risk of Rain 2",
        image: steamHeaderImage(632360),
        whyItFits: "Co-op scaling chaos—items that rewrite runs mid-fight.",
      },
      {
        title: "The Binding of Isaac: Rebirth",
        image: steamHeaderImage(250900),
        whyItFits: "Item combo madness—dark humor and absurd synergies.",
      },
    ],
  },
  {
    slug: "best-open-world-games",
    seoTitle: "Best open-world games | Exploration picks | GamePing AI",
    metaDescription:
      "Large maps, side content, and freedom to roam—curated open-world games for high-intent searches on GamePing.",
    h1: "Best open-world games",
    intro:
      "Open-world games promise horizon bait—quests sprinkled across terrain you choose how to cross. These are reliable starting points before you ask GamePing to narrow by platform, tone, or budget.",
    games: [
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits: "Vertical discovery—secrets without constant waypoint noise.",
      },
      {
        title: "Red Dead Redemption 2",
        image: steamHeaderImage(1174180),
        whyItFits: "Living frontier—camp life and environmental detail.",
      },
      {
        title: "The Witcher 3: Wild Hunt",
        image: steamHeaderImage(292030),
        whyItFits: "Contract structure—dense writing across regions.",
      },
      {
        title: "Assassin's Creed Odyssey",
        image: steamHeaderImage(812140),
        whyItFits: "Mediterranean scale—naval layers and mythic zones.",
      },
      {
        title: "Ghost of Tsushima DIRECTOR'S CUT",
        image: steamHeaderImage(2215430),
        whyItFits: "Guided wind exploration—samurai fantasy with strong flow.",
      },
    ],
  },
  {
    slug: "best-soulslike-games",
    seoTitle: "Best soulslike games | Challenging action RPGs | GamePing AI",
    metaDescription:
      "Challenging combat and deliberate pacing—curated soulslike games for players who want mastery loops on GamePing.",
    h1: "Best soulslike games",
    intro:
      "Soulslikes reward learning—pattern recognition, stamina discipline, and the satisfaction of a boss finally falling. These are the modern staples players search for when they want fair but firm combat.",
    games: [
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits: "Open souls formula—build variety and co-op optional.",
      },
      {
        title: "Dark Souls III",
        image: steamHeaderImage(374320),
        whyItFits: "Tight legacy dungeons—foundational dodge-and-punish rhythm.",
      },
      {
        title: "Sekiro: Shadows Die Twice",
        image: steamHeaderImage(814380),
        whyItFits: "Deflect-focused duels—different skill ceiling, same respect for learning.",
      },
      {
        title: "Lies of P",
        image: steamHeaderImage(1627720),
        whyItFits: "Pinocchio gothic—parry windows with flexible weapon arms.",
      },
      {
        title: "NieR:Automata",
        image: steamHeaderImage(524220),
        whyItFits: "Hybrid combat—dodge-heavy fights with RPG systems and story swings.",
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

/**
 * Manually curated "related" slugs per collection. Replaces the old behavior of
 * showing the first 4 array items (which were often unrelated). Only references
 * existing slugs; self is filtered out at lookup. Any slug not listed falls back
 * to the previous first-N behavior — no collection is ever orphaned.
 */
const RELATED_COLLECTION_SLUGS: Record<string, string[]> = {
  "games-like-hades": ["best-roguelike-games", "games-like-slay-the-spire", "games-like-hollow-knight", "best-soulslike-games"],
  "games-like-disco-elysium": ["games-with-deep-stories", "best-emotional-story-games", "games-like-baldurs-gate-3"],
  "best-cozy-games": ["cozy-games-for-long-nights", "relaxing-games-after-work", "games-like-stardew-valley", "games-for-rainy-nights"],
  "best-emotional-story-games": ["games-with-deep-stories", "emotional-indie-games", "games-like-disco-elysium"],
  "best-underwater-exploration-games": ["games-like-subnautica", "best-island-survival-games", "atmospheric-exploration-games"],
  "best-island-survival-games": ["relaxing-survival-games", "games-like-subnautica", "best-underwater-exploration-games"],
  "games-like-hollow-knight": ["games-like-hades", "beautiful-indie-games", "best-soulslike-games"],
  "games-like-stardew-valley": ["best-cozy-games", "cozy-games-for-long-nights", "relaxing-games-after-work"],
  "games-like-terraria": ["relaxing-survival-games", "games-like-stardew-valley", "best-island-survival-games"],
  "games-like-elden-ring": ["best-soulslike-games", "games-like-the-witcher-3", "best-open-world-games"],
  "games-like-skyrim": ["games-like-the-witcher-3", "best-open-world-games", "games-like-elden-ring", "games-like-baldurs-gate-3"],
  "games-like-subnautica": ["best-underwater-exploration-games", "best-island-survival-games", "relaxing-survival-games"],
  "games-like-rimworld": ["games-like-factorio", "games-like-project-zomboid", "relaxing-survival-games"],
  "games-like-factorio": ["games-like-rimworld", "games-like-project-zomboid"],
  "games-like-project-zomboid": ["games-like-rimworld", "relaxing-survival-games", "best-island-survival-games"],
  "games-like-slay-the-spire": ["best-roguelike-games", "games-like-hades"],
  "games-like-outer-wilds": ["atmospheric-exploration-games", "games-with-deep-stories", "games-with-amazing-worlds"],
  "games-like-baldurs-gate-3": ["games-like-disco-elysium", "games-with-deep-stories", "games-like-skyrim"],
  "games-like-cyberpunk-2077": ["games-like-the-witcher-3", "best-open-world-games", "games-with-deep-stories"],
  "games-like-the-witcher-3": ["games-like-skyrim", "best-open-world-games", "games-like-red-dead-redemption-2", "games-like-elden-ring"],
  "games-like-red-dead-redemption-2": ["best-open-world-games", "games-like-the-witcher-3", "games-with-amazing-worlds"],
  "relaxing-games-after-work": ["best-cozy-games", "cozy-games-for-long-nights", "relaxing-survival-games"],
  "atmospheric-exploration-games": ["games-like-outer-wilds", "beautiful-indie-games", "games-with-amazing-worlds"],
  "games-for-rainy-nights": ["best-cozy-games", "best-emotional-story-games", "games-with-deep-stories"],
  "beautiful-indie-games": ["emotional-indie-games", "atmospheric-exploration-games", "games-like-hollow-knight"],
  "relaxing-survival-games": ["best-island-survival-games", "games-like-subnautica", "games-like-terraria"],
  "games-with-deep-stories": ["best-emotional-story-games", "games-like-disco-elysium", "games-like-baldurs-gate-3"],
  "games-to-get-lost-in": ["best-open-world-games", "games-with-amazing-worlds", "games-like-skyrim"],
  "emotional-indie-games": ["beautiful-indie-games", "best-emotional-story-games", "games-with-deep-stories"],
  "games-with-amazing-worlds": ["best-open-world-games", "atmospheric-exploration-games", "games-like-elden-ring"],
  "cozy-games-for-long-nights": ["best-cozy-games", "relaxing-games-after-work", "games-like-stardew-valley"],
  "best-roguelike-games": ["games-like-hades", "games-like-slay-the-spire", "best-soulslike-games"],
  "best-open-world-games": ["games-like-skyrim", "games-like-elden-ring", "games-like-the-witcher-3", "games-like-red-dead-redemption-2"],
  "best-soulslike-games": ["games-like-elden-ring", "best-open-world-games", "best-roguelike-games"],
};

/**
 * Related collections for a given slug: manual mappings first, then a fallback
 * to the previous "first N other collections" behavior so nothing is orphaned.
 */
export function getRelatedCollections(slug: string, limit = 4): CuratedCollection[] {
  const manual = (RELATED_COLLECTION_SLUGS[slug] ?? [])
    .filter((s) => s !== slug)
    .map((s) => getCollectionBySlug(s))
    .filter((c): c is CuratedCollection => Boolean(c))
    .slice(0, limit);

  if (manual.length > 0) return manual;

  return CURATED_COLLECTIONS.filter((c) => c.slug !== slug).slice(0, limit);
}
