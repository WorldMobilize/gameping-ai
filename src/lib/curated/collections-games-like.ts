import { steamHeaderImage } from "@/lib/curated/game-links";
import type { CuratedCollection } from "@/lib/curated/collections";

/**
 * "Games like X" collections — the SEO workhorse: people search for what to play
 * after a game they loved, and each of these answers one of those searches.
 *
 * Kept in its own file because collections.ts is already long and this list is
 * the one that grows. Every Steam app id below was verified against the Steam
 * API (right game, cover image exists) — a wrong id silently ships a broken
 * cover, or worse, the sequel's art.
 */
export const GAMES_LIKE_COLLECTIONS: CuratedCollection[] = [
  {
    slug: "games-like-minecraft",
    seoTitle: "Games like Minecraft | Sandbox & survival picks | GamePing AI",
    metaDescription:
      "Games like Minecraft: build, mine, and survive in worlds that are yours to shape. Sandbox picks with a reason for each — then get AI matches on GamePing.",
    h1: "Games like Minecraft",
    intro:
      "Minecraft's pull is the blank page: a world with no script, where the goal is whatever you decide to build. These keep that freedom — gather, craft, build, repeat — while each one bends the formula somewhere different.",
    games: [
      {
        title: "Terraria",
        image: steamHeaderImage(105600),
        whyItFits:
          "The same dig-craft-build loop, flattened to 2D and packed with far more bosses and gear to chase.",
      },
      {
        title: "Valheim",
        image: steamHeaderImage(892970),
        whyItFits:
          "Building and survival with real weight — every base you raise has to hold against what comes at night.",
      },
      {
        title: "Satisfactory",
        image: steamHeaderImage(526870),
        whyItFits:
          "For when your Minecraft builds turned into automation projects. Same instinct, industrial scale.",
      },
      {
        title: "Core Keeper",
        image: steamHeaderImage(1621690),
        whyItFits:
          "Mine, farm, and light up an underground world — the cozy end of the sandbox, best with friends.",
      },
      {
        title: "Astroneer",
        image: steamHeaderImage(361420),
        whyItFits:
          "Terraforming as a toy: reshape whole planets with a vacuum gun, with no combat pressure.",
      },
    ],
  },
  {
    slug: "games-like-dark-souls",
    seoTitle: "Games like Dark Souls | Soulslike picks | GamePing AI",
    metaDescription:
      "Games like Dark Souls: deliberate combat, punishing bosses, and worlds that respect you enough to say nothing. With why each one fits.",
    h1: "Games like Dark Souls",
    intro:
      "Dark Souls trades hand-holding for mastery: learn the timing, earn the ground. These carry that contract — heavy, readable combat and a world that rewards paying attention.",
    games: [
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits:
          "FromSoftware's own answer: the same combat language, set loose in an open world.",
      },
      {
        title: "Lies of P",
        image: steamHeaderImage(1627720),
        whyItFits:
          "The closest anyone has come to Souls combat outside FromSoftware — and it earns the comparison.",
      },
      {
        title: "Nioh 2",
        image: steamHeaderImage(1325200),
        whyItFits:
          "Souls difficulty with a much deeper combat system — stances, skills, and loot to build around.",
      },
      {
        title: "Remnant II",
        image: steamHeaderImage(1282100),
        whyItFits:
          "Soulslike pacing and boss design translated to guns, and it holds up in co-op.",
      },
      {
        title: "Mortal Shell",
        image: steamHeaderImage(1110910),
        whyItFits:
          "Short, dense, and grim — the Souls feel without the hundred-hour commitment.",
      },
    ],
  },
  {
    slug: "games-like-fallout-new-vegas",
    seoTitle: "Games like Fallout: New Vegas | RPG picks | GamePing AI",
    metaDescription:
      "Games like Fallout: New Vegas — reactive worlds, real choices, and dialogue that actually matters. Curated picks with why each one fits.",
    h1: "Games like Fallout: New Vegas",
    intro:
      "New Vegas is loved for what it lets you do: talk your way out, take the other faction's side, break the quest in a way the writers anticipated. These respect the player the same way.",
    games: [
      {
        title: "The Outer Worlds",
        image: steamHeaderImage(578650),
        whyItFits:
          "Made by many of the same people — same dry humour, same factions willing to let you betray them.",
      },
      {
        title: "Disco Elysium",
        image: steamHeaderImage(632470),
        whyItFits:
          "The dialogue-first RPG taken to its limit: no combat, and somehow the highest stakes.",
      },
      {
        title: "Fallout 4",
        image: steamHeaderImage(377160),
        whyItFits:
          "Weaker writing, stronger world — the wasteland to wander when you want exploration over dialogue.",
      },
      {
        title: "Wasteland 3",
        image: steamHeaderImage(719040),
        whyItFits:
          "The same moral grey zones and faction politics, played out in turn-based squad combat.",
      },
      {
        title: "S.T.A.L.K.E.R.: Shadow of Chernobyl",
        image: steamHeaderImage(4500),
        whyItFits:
          "A wasteland that doesn't care about you — harsh, atmospheric, and utterly uninterested in guiding you.",
      },
    ],
  },
  {
    slug: "games-like-valheim",
    seoTitle: "Games like Valheim | Co-op survival picks | GamePing AI",
    metaDescription:
      "Games like Valheim: build a base, push into hostile land, come back richer. Co-op survival picks with why each one fits.",
    h1: "Games like Valheim",
    intro:
      "Valheim's rhythm is expedition and homecoming: venture out, nearly die, drag the loot back to a base you actually care about. These keep that loop, with friends in the boat.",
    games: [
      {
        title: "Enshrouded",
        image: steamHeaderImage(1203620),
        whyItFits:
          "The closest match on the list — same survival-plus-building rhythm, with far more freeform construction.",
      },
      {
        title: "V Rising",
        image: steamHeaderImage(1604030),
        whyItFits:
          "Base-building and progression through a hostile world, only you're the monster this time.",
      },
      {
        title: "Grounded",
        image: steamHeaderImage(962130),
        whyItFits:
          "Same survival loop, shrunk to the scale of a back garden — which makes every ant terrifying.",
      },
      {
        title: "Conan Exiles",
        image: steamHeaderImage(440900),
        whyItFits:
          "Building at a scale Valheim can't reach, in a world that punishes you for stepping outside it.",
      },
      {
        title: "Sons of the Forest",
        image: steamHeaderImage(1326470),
        whyItFits:
          "Survival with a horror edge — build, fortify, and dread what shows up after dark.",
      },
    ],
  },
  {
    slug: "games-like-palworld",
    seoTitle: "Games like Palworld | Creature-collecting survival | GamePing AI",
    metaDescription:
      "Games like Palworld: catch creatures, build a base, and put them to work. Survival and monster-taming picks with why each one fits.",
    h1: "Games like Palworld",
    intro:
      "Palworld's trick is the collision: creature collecting bolted onto open-world survival, with an automation layer nobody asked for and everybody liked. These pull on one thread or the other.",
    games: [
      {
        title: "ARK: Survival Evolved",
        image: steamHeaderImage(346110),
        whyItFits:
          "The blueprint Palworld built on — tame creatures, build a base, and let them do the work.",
      },
      {
        title: "Craftopia",
        image: steamHeaderImage(1307550),
        whyItFits:
          "By the same studio, and it shows: survival, automation, and taming thrown in the same blender.",
      },
      {
        title: "Enshrouded",
        image: steamHeaderImage(1203620),
        whyItFits:
          "For the survival-and-building half, done with more polish and no creatures on the payroll.",
      },
      {
        title: "Temtem",
        image: steamHeaderImage(745920),
        whyItFits:
          "The creature-collecting half, played straight — a proper monster-taming RPG built for the long haul.",
      },
      {
        title: "Monster Hunter Rise",
        image: steamHeaderImage(1446780),
        whyItFits:
          "If the creatures were the draw and you'd rather fight them than employ them.",
      },
    ],
  },
  {
    slug: "games-like-gta-5",
    seoTitle: "Games like GTA V | Open-world crime picks | GamePing AI",
    metaDescription:
      "Games like GTA V: dense cities, criminal ambition, and a world that reacts. Open-world picks with why each one fits.",
    h1: "Games like GTA V",
    // "GTA V" scores 0.20 against RAWG's "Grand Theft Auto V" — below the match
    // gate, so the subject resolves to nothing. The h1 keeps the searched name.
    subjectTitle: "Grand Theft Auto V",
    intro:
      "GTA V is a city you can push against and feel it push back. These give you somewhere just as dense to cause trouble in — some serious, some entirely not.",
    games: [
      {
        title: "Cyberpunk 2077",
        image: steamHeaderImage(1091500),
        whyItFits:
          "Night City is the closest thing to Los Santos in scale and density — with an RPG underneath.",
      },
      {
        title: "Watch Dogs 2",
        image: steamHeaderImage(447040),
        whyItFits:
          "A playable San Francisco, and heists you can solve with a drone instead of a shotgun.",
      },
      {
        title: "Mafia: Definitive Edition",
        image: steamHeaderImage(1030840),
        whyItFits:
          "The crime story GTA keeps gesturing at, told straight and with real weight.",
      },
      {
        title: "Sleeping Dogs: Definitive Edition",
        image: steamHeaderImage(307690),
        whyItFits:
          "Hong Kong, undercover, with hand-to-hand combat far better than anything in GTA.",
      },
      {
        title: "Saints Row IV",
        image: steamHeaderImage(206420),
        whyItFits:
          "For when you wanted the chaos and none of the seriousness. It goes considerably further.",
      },
    ],
  },
  {
    slug: "games-like-portal-2",
    seoTitle: "Games like Portal 2 | First-person puzzle picks | GamePing AI",
    metaDescription:
      "Games like Portal 2: clever first-person puzzles that make you feel smart, not stuck. Curated picks with why each one fits.",
    h1: "Games like Portal 2",
    intro:
      "Portal 2 teaches you a rule, then trusts you to break it. That click — when the solution arrives all at once — is what these are chasing.",
    games: [
      {
        title: "The Talos Principle",
        image: steamHeaderImage(257510),
        whyItFits:
          "First-person puzzles of the same calibre, wrapped in philosophy instead of comedy.",
      },
      {
        title: "Superliminal",
        image: steamHeaderImage(1049410),
        whyItFits:
          "Perspective is the mechanic — the closest anyone has come to Portal's 'oh, of course' moment.",
      },
      {
        title: "The Witness",
        image: steamHeaderImage(210970),
        whyItFits:
          "It never explains anything, and that's the point. Harder, quieter, deeply rewarding.",
      },
      {
        title: "Viewfinder",
        image: steamHeaderImage(1382070),
        whyItFits:
          "Place a photograph and it becomes real. Short, generous, and delighted with its own idea.",
      },
      {
        title: "Antichamber",
        image: steamHeaderImage(219890),
        whyItFits:
          "Space itself lies to you. Less playful than Portal, far stranger, and it will not hold your hand.",
      },
    ],
  },
  {
    slug: "games-like-celeste",
    seoTitle: "Games like Celeste | Precision platformer picks | GamePing AI",
    metaDescription:
      "Games like Celeste: tight controls, honest difficulty, and the joy of finally nailing it. Platformer picks with why each one fits.",
    h1: "Games like Celeste",
    intro:
      "Celeste is hard and never unfair — every death is yours, and so is every clear. These platformers keep that bargain, whether they wrap it in warmth or in menace.",
    games: [
      {
        title: "Super Meat Boy",
        image: steamHeaderImage(40800),
        whyItFits:
          "The purest form of the genre: instant restarts, no story between you and the next attempt.",
      },
      {
        title: "Hollow Knight",
        image: steamHeaderImage(367520),
        whyItFits:
          "The same demand for precision, spent exploring a world instead of climbing a mountain.",
      },
      {
        title: "Ori and the Will of the Wisps",
        image: steamHeaderImage(1057090),
        whyItFits:
          "Movement as pure pleasure, with the emotional core Celeste fans tend to be there for.",
      },
      {
        title: "Neon White",
        image: steamHeaderImage(1533420),
        whyItFits:
          "Celeste's speedrun instinct made the whole game — replay each level until it's clean.",
      },
      {
        title: "Cuphead",
        image: steamHeaderImage(268910),
        whyItFits:
          "The same 'one more try' loop, aimed at bosses instead of platforms. Just as fair, just as brutal.",
      },
    ],
  },
  {
    slug: "games-like-monster-hunter-world",
    seoTitle: "Games like Monster Hunter: World | Hunting picks | GamePing AI",
    metaDescription:
      "Games like Monster Hunter: World — long hunts, deep weapons, and gear you earn off the thing you killed. With why each one fits.",
    h1: "Games like Monster Hunter: World",
    intro:
      "Monster Hunter is a game about learning one animal so completely that you beat it before you fight it. These share the patience — and the loot loop that pays for it.",
    games: [
      {
        title: "Monster Hunter Rise",
        image: steamHeaderImage(1446780),
        whyItFits:
          "The same game, faster and lighter on its feet. The obvious next hunt.",
      },
      {
        title: "Wild Hearts",
        image: steamHeaderImage(1938010),
        whyItFits:
          "Monster hunting with building on top — construct your way through a fight, mid-fight.",
      },
      {
        title: "Wo Long: Fallen Dynasty",
        image: steamHeaderImage(1448440),
        whyItFits:
          "For the combat mastery rather than the ecology — same patient learning, no carve at the end.",
      },
      {
        title: "God Eater 3",
        image: steamHeaderImage(899440),
        whyItFits:
          "Faster, anime-flavoured hunting with the same weapon depth and grind.",
      },
      {
        title: "Remnant II",
        image: steamHeaderImage(1282100),
        whyItFits:
          "Boss-focused co-op with build-crafting — the hunt loop, played out with guns.",
      },
    ],
  },
  {
    slug: "games-like-persona-5",
    seoTitle: "Games like Persona 5 | Story-driven JRPG picks | GamePing AI",
    metaDescription:
      "Games like Persona 5: style, social bonds, and turn-based combat with real teeth. JRPG picks with why each one fits.",
    h1: "Games like Persona 5",
    intro:
      "Persona 5 works because of what happens between the dungeons — the calendar, the friendships, the sense that time is spending itself. These understand that the RPG is not just the fighting.",
    games: [
      {
        title: "Metaphor: ReFantazio",
        image: steamHeaderImage(2679460),
        whyItFits:
          "Same team, same DNA: calendar pressure, social bonds, and combat with a hard edge.",
      },
      {
        title: "Like a Dragon: Infinite Wealth",
        image: steamHeaderImage(2072450),
        whyItFits:
          "Turn-based combat and a city full of people worth knowing — funnier and stranger than Persona.",
      },
      {
        title: "Persona 4 Golden",
        image: steamHeaderImage(1113000),
        whyItFits:
          "The one that built the formula. Warmer, smaller, and still one of the best in the series.",
      },
      {
        title: "Sea of Stars",
        image: steamHeaderImage(1244090),
        whyItFits:
          "Turn-based combat that stays engaged with your hands, in a gorgeous throwback package.",
      },
      {
        title: "Chained Echoes",
        image: steamHeaderImage(1229240),
        whyItFits:
          "A sharp, dense JRPG with no grind and a combat system that respects your time.",
      },
    ],
  },
  {
    slug: "games-like-vampire-survivors",
    seoTitle: "Games like Vampire Survivors | Bullet-heaven picks | GamePing AI",
    metaDescription:
      "Games like Vampire Survivors: tiny inputs, absurd power curves, and screens that end up entirely full. With why each one fits.",
    h1: "Games like Vampire Survivors",
    intro:
      "Vampire Survivors gives you one button's worth of decisions and twenty minutes of escalating nonsense. These chase that same slot-machine climb from fragile to unstoppable.",
    games: [
      {
        title: "Brotato",
        image: steamHeaderImage(1942280),
        whyItFits:
          "The same power fantasy compressed into shorter runs, with far more build variety per attempt.",
      },
      {
        title: "Halls of Torment",
        image: steamHeaderImage(2218750),
        whyItFits:
          "The formula rebuilt in the shell of an old-school ARPG — heavier, darker, more to chew on.",
      },
      {
        title: "20 Minutes Till Dawn",
        image: steamHeaderImage(1966900),
        whyItFits:
          "You aim this one. It keeps the escalation but asks for actual hands.",
      },
      {
        title: "Deep Rock Galactic: Survivor",
        image: steamHeaderImage(2321470),
        whyItFits:
          "The same loop with mining and terrain destruction layered in — and it's genuinely funny.",
      },
      {
        title: "Nova Drift",
        image: steamHeaderImage(858210),
        whyItFits:
          "Build escalation aimed at your ship instead of a wizard — Asteroids as a roguelite.",
      },
    ],
  },
  {
    slug: "games-like-deep-rock-galactic",
    seoTitle: "Games like Deep Rock Galactic | Co-op shooter picks | GamePing AI",
    metaDescription:
      "Games like Deep Rock Galactic: four players, one objective, and a lot of things trying to stop you. Co-op picks with why each one fits.",
    h1: "Games like Deep Rock Galactic",
    intro:
      "Deep Rock is co-op as a job: go in with a plan, come out with a story about how it fell apart. These are the other games where the team is the mechanic.",
    games: [
      {
        title: "Helldivers 2",
        image: steamHeaderImage(553850),
        whyItFits:
          "The same co-op chaos and gallows humour, with friendly fire making it much, much worse.",
      },
      {
        title: "Warhammer: Vermintide 2",
        image: steamHeaderImage(552500),
        whyItFits:
          "Four players holding a line against a horde, with melee that has real weight behind it.",
      },
      {
        title: "GTFO",
        image: steamHeaderImage(493520),
        whyItFits:
          "The nightmare version: no rushing, no noise, and total dependence on the other three.",
      },
      {
        title: "Left 4 Dead 2",
        image: steamHeaderImage(550),
        whyItFits:
          "The original that defined the format. Still one of the tightest co-op loops ever built.",
      },
      {
        title: "Risk of Rain 2",
        image: steamHeaderImage(632360),
        whyItFits:
          "Co-op that escalates until the screen breaks — a different kind of run, the same shared panic.",
      },
    ],
  },
  {
    slug: "games-like-no-mans-sky",
    seoTitle: "Games like No Man's Sky | Space exploration picks | GamePing AI",
    metaDescription:
      "Games like No Man's Sky: land on a planet nobody has named, and see what's there. Exploration picks with why each one fits.",
    h1: "Games like No Man's Sky",
    intro:
      "No Man's Sky sells one feeling: you can go there. These keep the horizon open — some vast and lonely, some small and dense, all of them about seeing what's over the ridge.",
    games: [
      {
        title: "Elite Dangerous",
        image: steamHeaderImage(359320),
        whyItFits:
          "The galaxy at 1:1 scale. Colder, harder, and unmatched for the feeling of real distance.",
      },
      {
        title: "Starfield",
        image: steamHeaderImage(1716740),
        whyItFits:
          "Space exploration with a Bethesda RPG underneath — more quests, less seamless flight.",
      },
      {
        title: "Subnautica",
        image: steamHeaderImage(264710),
        whyItFits:
          "The same 'alien world, no map, keep going' pull, aimed downward instead of up.",
      },
      {
        title: "Astroneer",
        image: steamHeaderImage(361420),
        whyItFits:
          "Planet-hopping and base-building with all the menace removed. Pure, cheerful exploration.",
      },
      {
        title: "Outer Wilds",
        image: steamHeaderImage(753640),
        whyItFits:
          "A tiny solar system that rewards curiosity more completely than any galaxy-sized one.",
      },
    ],
  },
  {
    slug: "games-like-satisfactory",
    seoTitle: "Games like Satisfactory | Factory & automation picks | GamePing AI",
    metaDescription:
      "Games like Satisfactory: build the belt, fix the bottleneck, lose the evening. Automation picks with why each one fits.",
    h1: "Games like Satisfactory",
    intro:
      "The factory must grow — and then it must be torn down and rebuilt because you learned something. These are the games that turn engineering into a compulsion.",
    games: [
      {
        title: "Factorio",
        image: steamHeaderImage(427520),
        whyItFits:
          "The genre's masterpiece. Flatter and less pretty, deeper and more demanding by a mile.",
      },
      {
        title: "Dyson Sphere Program",
        image: steamHeaderImage(1366540),
        whyItFits:
          "Automation scaled to an entire star system, and it stays gorgeous the whole way up.",
      },
      {
        title: "Techtonica",
        image: steamHeaderImage(1457320),
        whyItFits:
          "First-person factory building underground — the closest structural match to Satisfactory.",
      },
      {
        title: "Captain of Industry",
        image: steamHeaderImage(1594320),
        whyItFits:
          "Automation with logistics and terrain to fight — for when belts alone stopped being enough.",
      },
      {
        title: "Astroneer",
        image: steamHeaderImage(361420),
        whyItFits:
          "The gentle end of the genre: automation and building with nothing chasing you.",
      },
    ],
  },
  {
    slug: "games-like-doom-eternal",
    seoTitle: "Games like DOOM Eternal | Fast FPS picks | GamePing AI",
    metaDescription:
      "Games like DOOM Eternal: move fast, never stop, keep shooting. Fast-paced FPS picks with why each one fits.",
    h1: "Games like DOOM Eternal",
    intro:
      "DOOM Eternal punishes you for standing still — the arena is a puzzle you solve at a sprint. These shooters share that: speed is the defence.",
    games: [
      {
        title: "ULTRAKILL",
        image: steamHeaderImage(1229490),
        whyItFits:
          "Faster than DOOM, with a style ranking that demands you keep it beautiful as well as lethal.",
      },
      {
        title: "Warhammer 40,000: Boltgun",
        image: steamHeaderImage(2005010),
        whyItFits:
          "DOOM's pace in a 40K skin — bigger guns, heavier hits, no reloading.",
      },
      {
        title: "Prodeus",
        image: steamHeaderImage(964800),
        whyItFits:
          "A modern shooter built on classic DOOM bones — brutally fast, gorgeously gory.",
      },
      {
        title: "DUSK",
        image: steamHeaderImage(519860),
        whyItFits:
          "Nineties FPS movement at its purest, with none of the modern padding.",
      },
      {
        title: "Shadow Warrior 3",
        image: steamHeaderImage(1036890),
        whyItFits:
          "Arena combat with a traversal loop lifted straight from Eternal, plus jokes.",
      },
    ],
  },
  {
    slug: "games-like-sekiro",
    seoTitle: "Games like Sekiro | Deflect-and-parry combat | GamePing AI",
    metaDescription:
      "Games like Sekiro: aggressive, rhythm-driven combat where blocking is attacking. Curated picks with why each one fits.",
    h1: "Games like Sekiro",
    // A bare "Sekiro" matches a rating-0 duplicate entry in RAWG exactly, which
    // beats the real game on score. Ask for the full name.
    subjectTitle: "Sekiro: Shadows Die Twice",
    intro:
      "Sekiro isn't about dodging — it's about standing there and answering. That parry rhythm is rare, and these come closest to it.",
    games: [
      {
        title: "Lies of P",
        image: steamHeaderImage(1627720),
        whyItFits:
          "Perfect-guard combat that clearly studied Sekiro, in a world that studied Bloodborne.",
      },
      {
        title: "Wo Long: Fallen Dynasty",
        image: steamHeaderImage(1448440),
        whyItFits:
          "Deflection is the whole game. The nearest thing to Sekiro's rhythm anyone has managed.",
      },
      {
        title: "Nioh 2",
        image: steamHeaderImage(1325200),
        whyItFits:
          "Aggressive, stance-based combat with far more systems — same demand for precision.",
      },
      {
        title: "Ghostrunner",
        image: steamHeaderImage(1139900),
        whyItFits:
          "One-hit deaths and flow-state movement — Sekiro's precision, played at a run.",
      },
      {
        title: "Elden Ring",
        image: steamHeaderImage(1245620),
        whyItFits:
          "Slower and more forgiving, but the same FromSoftware grammar underneath.",
      },
    ],
  },
  {
    slug: "games-like-civilization-6",
    seoTitle: "Games like Civilization VI | 4X strategy picks | GamePing AI",
    metaDescription:
      "Games like Civilization VI: build an empire, one more turn at a time. 4X and grand strategy picks with why each one fits.",
    h1: "Games like Civilization VI",
    intro:
      "Civ's real mechanic is the clock you don't notice. These all have it — the turn that becomes an evening — while pulling the empire in different directions.",
    games: [
      {
        title: "Humankind",
        image: steamHeaderImage(1124300),
        whyItFits:
          "The most direct challenger: swap cultures each era instead of committing to one civilisation.",
      },
      {
        title: "Old World",
        image: steamHeaderImage(597180),
        whyItFits:
          "Civ crossed with Crusader Kings — your dynasty is mortal, and that changes everything.",
      },
      {
        title: "Endless Legend",
        image: steamHeaderImage(289130),
        whyItFits:
          "4X with genuinely asymmetric factions — each one plays by different rules, not different bonuses.",
      },
      {
        title: "Age of Wonders 4",
        image: steamHeaderImage(1669000),
        whyItFits:
          "Empire building with tactical battles you actually fight, rather than resolve.",
      },
      {
        title: "Stellaris",
        image: steamHeaderImage(281990),
        whyItFits:
          "The same expansion itch, aimed at a galaxy — sprawling, strange, and endlessly moddable.",
      },
    ],
  },
  {
    slug: "games-like-undertale",
    seoTitle: "Games like Undertale | Story-first indie RPG picks | GamePing AI",
    metaDescription:
      "Games like Undertale: small games with enormous hearts, that know exactly what they're doing to you. With why each one fits.",
    h1: "Games like Undertale",
    intro:
      "Undertale is short, cheap-looking, and stays with people for years. These share that: modest on the surface, and quietly aware of every choice you make.",
    games: [
      {
        title: "Deltarune",
        image: steamHeaderImage(1671210),
        whyItFits:
          "The same creator, the same instincts, and no reason at all to look elsewhere first.",
      },
      {
        title: "OMORI",
        image: steamHeaderImage(1150690),
        whyItFits:
          "Cute on the surface, devastating underneath — the Undertale trick, played completely straight.",
      },
      {
        title: "LISA: The Painful",
        image: steamHeaderImage(335670),
        whyItFits:
          "Makes your choices hurt in ways an RPG usually can't. Bleak, funny, unforgettable.",
      },
      {
        title: "CrossCode",
        image: steamHeaderImage(368340),
        whyItFits:
          "For the pixel-art warmth and sharp writing — with far more game underneath it.",
      },
      {
        title: "Chained Echoes",
        image: steamHeaderImage(1229240),
        whyItFits:
          "The indie RPG that earns its scale — tight combat and a story with real ambition.",
      },
    ],
  },
  {
    slug: "games-like-it-takes-two",
    seoTitle: "Games like It Takes Two | Two-player co-op picks | GamePing AI",
    metaDescription:
      "Games like It Takes Two: built from the ground up for exactly two people. Co-op picks with why each one fits.",
    h1: "Games like It Takes Two",
    intro:
      "It Takes Two cannot be played alone, and that's the whole point — every mechanic needs someone on the other end. These are the games worth handing the second controller for.",
    games: [
      {
        title: "A Way Out",
        image: steamHeaderImage(1222700),
        whyItFits:
          "The same studio's first go at it: two players, one story, no single-player mode at all.",
      },
      {
        title: "Portal 2",
        image: steamHeaderImage(620),
        whyItFits:
          "Its co-op campaign is a separate, purpose-built game — and it's still the gold standard.",
      },
      {
        title: "Unravel Two",
        image: steamHeaderImage(1225570),
        whyItFits:
          "Gentle, gorgeous co-op puzzling where you're literally tied to each other.",
      },
      {
        title: "Overcooked! 2",
        image: steamHeaderImage(728880),
        whyItFits:
          "The other side of co-op: pure coordination, and it will test the relationship harder.",
      },
      {
        title: "Grounded",
        image: steamHeaderImage(962130),
        whyItFits:
          "For when you want to keep playing together but with a world to build in, not a story to finish.",
      },
    ],
  },
  {
    slug: "games-like-the-sims-4",
    seoTitle: "Games like The Sims 4 | Life & cozy sim picks | GamePing AI",
    metaDescription:
      "Games like The Sims 4: build a life, decorate a home, and lose track of the hours. Life-sim picks with why each one fits.",
    h1: "Games like The Sims 4",
    intro:
      "The Sims is a dollhouse with rules — you're not winning, you're arranging. These give you somewhere else to make a life, a home, or just a very good kitchen.",
    games: [
      {
        title: "My Time at Portia",
        image: steamHeaderImage(666140),
        whyItFits:
          "Build a workshop, befriend a town, make a life — the Sims' social pull with a purpose attached.",
      },
      {
        title: "Coral Island",
        image: steamHeaderImage(1158160),
        whyItFits:
          "A gorgeous farm-and-community sim where relationships matter as much as the crops.",
      },
      {
        title: "House Flipper",
        image: steamHeaderImage(613100),
        whyItFits:
          "If Build Mode was always the real game, this is Build Mode with nothing else in the way.",
      },
      {
        title: "Two Point Campus",
        image: steamHeaderImage(1649080),
        whyItFits:
          "The management side of the Sims itch, scaled up and played for laughs.",
      },
      {
        title: "Disney Dreamlight Valley",
        image: steamHeaderImage(1401590),
        whyItFits:
          "Cosy life-sim routines — decorate, befriend, potter about — with the Disney cast attached.",
      },
    ],
  },
  {
    slug: "games-like-stray",
    seoTitle: "Games like Stray | Short, atmospheric picks | GamePing AI",
    metaDescription:
      "Games like Stray: a few evenings, a strong mood, and a world you're happy to just be in. With why each one fits.",
    h1: "Games like Stray",
    intro:
      "Stray is small on purpose: a place, a mood, and no filler. These are the other games that say what they came to say and let you go.",
    games: [
      {
        title: "Journey",
        image: steamHeaderImage(638230),
        whyItFits:
          "Two hours, no words, and a stranger beside you. Still the benchmark for this kind of game.",
      },
      {
        title: "ABZU",
        image: steamHeaderImage(384190),
        whyItFits:
          "From Journey's art director — pure movement and colour, downward instead of onward.",
      },
      {
        title: "Firewatch",
        image: steamHeaderImage(383870),
        whyItFits:
          "A short, beautifully written walk through a place that feels genuinely lived in.",
      },
      {
        title: "Little Kitty, Big City",
        image: steamHeaderImage(1177980),
        whyItFits:
          "The literal answer: another cat, another city, and considerably more knocking things off shelves.",
      },
      {
        title: "Outer Wilds",
        image: steamHeaderImage(753640),
        whyItFits:
          "Longer, but the same instinct: a world worth poking at, with no one telling you how.",
      },
    ],
  },
  {
    slug: "games-like-zelda-breath-of-the-wild",
    seoTitle: "Games like Breath of the Wild | Open-world picks | GamePing AI",
    metaDescription:
      "Games like The Legend of Zelda: Breath of the Wild — open worlds that let you wander, climb and solve things your own way. Each pick explained on GamePing AI.",
    h1: "Games like The Legend of Zelda: Breath of the Wild",
    intro:
      "Breath of the Wild's trick is that the map never tells you what to do — it just puts something interesting on the horizon and trusts you to walk there. These keep that quiet, curious kind of freedom.",
    games: [
      {
        title: "Tunic",
        image: steamHeaderImage(553420),
        whyItFits:
          "A little fox, a big secret, and a world that explains nothing. The purest heir to old Zelda's sense of discovery.",
      },
      {
        title: "Death's Door",
        image: steamHeaderImage(894020),
        whyItFits:
          "Tight top-down combat and hub-and-spoke dungeons, with the melancholy charm Zelda saves for its quiet moments.",
      },
      {
        title: "Immortals Fenyx Rising",
        image: steamHeaderImage(2221920),
        whyItFits:
          "The closest structural match: climb anything, glide anywhere, solve open-air puzzle shrines. Greek myth instead of Hyrule.",
      },
      {
        title: "Sable",
        image: steamHeaderImage(757310),
        whyItFits:
          "Exploration with the combat removed entirely — just a desert, a hoverbike, and the pleasure of going to see what that is.",
      },
      {
        title: "Okami HD",
        image: steamHeaderImage(587620),
        whyItFits:
          "A classic Zelda skeleton wrapped in ink-brush art, where your paintbrush is the tool that reshapes the world.",
      },
    ],
  },
  {
    slug: "games-like-animal-crossing",
    seoTitle: "Games like Animal Crossing | Cozy life sim picks | GamePing AI",
    metaDescription:
      "Games like Animal Crossing: New Horizons — cozy, slow, no-pressure life sims where the only deadline is the one you set. Curated picks on GamePing AI.",
    h1: "Games like Animal Crossing: New Horizons",
    intro:
      "Animal Crossing asks almost nothing of you: tend the place, talk to the neighbours, watch the seasons turn. These carry that same low-stakes rhythm, where progress is a side effect of showing up.",
    games: [
      {
        title: "Cozy Grove",
        image: steamHeaderImage(1458100),
        whyItFits:
          "A daily-visit island of gentle chores and bear ghosts. It even paces itself like Animal Crossing — a bit each day, then it lets you go.",
      },
      {
        title: "Dinkum",
        image: steamHeaderImage(1062520),
        whyItFits:
          "Build a town in the Australian outback: same loop of fishing, bug-catching and slowly nice-ifying the place, with more survival to it.",
      },
      {
        title: "Stardew Valley",
        image: steamHeaderImage(413150),
        whyItFits:
          "The other pillar of cozy. More farming and more purpose, but the same seasons, festivals and neighbours worth knowing.",
      },
      {
        title: "My Time at Sandrock",
        image: steamHeaderImage(1084600),
        whyItFits:
          "Small-town life with a workshop attached — craft what the townsfolk need and watch the place grow around your work.",
      },
      {
        title: "Slime Rancher",
        image: steamHeaderImage(433340),
        whyItFits:
          "Pure daytime pottering: collect adorable things, feed them, upgrade the farm. Cheerful, chaotic, impossible to lose.",
      },
    ],
  },
  {
    slug: "games-like-pokemon",
    seoTitle: "Games like Pokémon | Creature-collector picks | GamePing AI",
    metaDescription:
      "Games like Pokémon: catch, train and battle creature teams on PC. Monster-taming picks with a reason for each — then get AI matches on GamePing.",
    h1: "Games like Pokémon",
    // Accents are stripped before matching, so "Pokémon" lands inside "Pokémon
    // Snap" and takes it. The list is generic, so it needs a mainline game to
    // stand for it — Legends: Arceus is the best-rated one RAWG has full data for.
    subjectTitle: "Pokémon Legends: Arceus",
    intro:
      "The Pokémon itch is a specific one: a team you built, levelled and got attached to. These are the PC games that scratch it — some faithful, some gleefully strange.",
    games: [
      {
        title: "Palworld",
        image: steamHeaderImage(1623730),
        whyItFits:
          "Catch creatures, then put them to work in your base. The collecting instinct, crossed with survival crafting and rather more firearms.",
      },
      {
        title: "Cassette Beasts",
        image: steamHeaderImage(1321440),
        whyItFits:
          "Record monsters onto tapes and transform into them yourself. Its type-fusion system is genuinely deeper than the thing it's riffing on.",
      },
      {
        title: "Temtem",
        image: steamHeaderImage(745920),
        whyItFits:
          "The most literal answer: a full creature-collecting adventure built around 2v2 battles, with other trainers actually in the world with you.",
      },
      {
        title: "Monster Sanctuary",
        image: steamHeaderImage(814370),
        whyItFits:
          "Monster-taming folded into a metroidvania — your team both fights for you and unlocks the map.",
      },
      {
        title: "Coromon",
        image: steamHeaderImage(1218210),
        whyItFits:
          "Unashamedly classic: routes, gyms, a rival. It's the Game Boy formula with modern quality-of-life and a real difficulty slider.",
      },
    ],
  },
  {
    slug: "games-like-god-of-war",
    seoTitle: "Games like God of War | Cinematic action picks | GamePing AI",
    metaDescription:
      "Games like God of War: weighty combat, myth-sized spectacle and a story that earns its quiet moments. Curated action picks on GamePing AI.",
    h1: "Games like God of War",
    intro:
      "God of War lands because the fighting has weight and the story has stakes — an axe that thuds, and a father who can barely talk to his son. These pair spectacle with something worth saying.",
    games: [
      {
        title: "Star Wars Jedi: Fallen Order",
        image: steamHeaderImage(1172380),
        whyItFits:
          "The same over-the-shoulder camera and deliberate, parry-led combat, threaded through worlds you climb back into as you unlock more.",
      },
      {
        title: "Hellblade: Senua's Sacrifice",
        image: steamHeaderImage(414340),
        whyItFits:
          "Norse myth from the inside out. Shorter and stranger, but no game does grief-as-a-journey more directly.",
      },
      {
        title: "Assassin's Creed Odyssey",
        image: steamHeaderImage(812140),
        whyItFits:
          "For when you wanted more Greece: a huge mythic playground with an RPG's worth of gear and choices.",
      },
      {
        title: "Devil May Cry 5",
        image: steamHeaderImage(601150),
        whyItFits:
          "Trades the fatherhood for pure showmanship — the combat ceiling here is the highest in the genre.",
      },
      {
        title: "Darksiders III",
        image: steamHeaderImage(606280),
        whyItFits:
          "Apocalyptic myth, a big weapon, and combat that punishes greed. The nearest thing to old-school Kratos.",
      },
    ],
  },
  {
    slug: "games-like-the-last-of-us",
    seoTitle: "Games like The Last of Us | Story survival picks | GamePing AI",
    metaDescription:
      "Games like The Last of Us: narrative survival where the people cost more than the monsters. Each pick explained, then AI matches on GamePing.",
    h1: "Games like The Last of Us",
    intro:
      "The infected were never the point. The Last of Us works because it makes you care about two people and then keeps asking what you'd do for them. These put story first and survival second.",
    games: [
      {
        title: "A Plague Tale: Innocence",
        image: steamHeaderImage(752590),
        whyItFits:
          "Two siblings, one hostile world, and a protective bond that carries the whole game. The closest emotional match on PC.",
      },
      {
        title: "Days Gone",
        image: steamHeaderImage(1259420),
        whyItFits:
          "Post-outbreak America on a motorbike — scavenging, stealth, and hordes that turn a bad plan into a sprint.",
      },
      {
        title: "Metro Exodus",
        image: steamHeaderImage(412020),
        whyItFits:
          "Scarce ammo, improvised gear, and a crew you slowly come to like. Survival where every bullet is a decision.",
      },
      {
        title: "The Walking Dead: The Telltale Definitive Series",
        image: steamHeaderImage(1449690),
        whyItFits:
          "The other great gruff-guardian-and-girl story. Less shooting, more choices you'll regret.",
      },
      {
        title: "Detroit: Become Human",
        image: steamHeaderImage(1222140),
        whyItFits:
          "Cinematic to its bones, with branching paths where characters you're attached to can simply not make it.",
      },
    ],
  },
  {
    slug: "games-like-horizon-zero-dawn",
    seoTitle: "Games like Horizon Zero Dawn | Open-world hunt picks | GamePing AI",
    metaDescription:
      "Games like Horizon Zero Dawn: open worlds, big beasts and hunts you plan before you fight. Curated picks with reasons, on GamePing AI.",
    h1: "Games like Horizon Zero Dawn",
    intro:
      "Horizon is a hunting game wearing an open world: study the machine, spot the weak point, set the trap, then loose an arrow. These deliver either the hunt or the world — the best deliver both.",
    games: [
      {
        title: "Monster Hunter: World",
        image: steamHeaderImage(582010),
        whyItFits:
          "The hunt, distilled. Track a beast, learn its tells, break its parts, wear it. The purest version of what Horizon does best.",
      },
      {
        title: "Assassin's Creed Odyssey",
        image: steamHeaderImage(812140),
        whyItFits:
          "The same open-world grammar — viewpoints, gear tiers, a bow you'll live on — across an enormous Greece.",
      },
      {
        title: "The Witcher 3: Wild Hunt",
        image: steamHeaderImage(292030),
        whyItFits:
          "Monster contracts with real preparation, in an open world whose side stories outclass most main ones.",
      },
      {
        title: "Far Cry Primal",
        image: steamHeaderImage(371660),
        whyItFits:
          "Bow, beasts and no guns at all. Prehistory as a stealth-and-survival playground.",
      },
      {
        title: "Days Gone",
        image: steamHeaderImage(1259420),
        whyItFits:
          "Open-world survival with a similar rhythm: scout the camp, plan the approach, and improvise when it all goes loud.",
      },
    ],
  },
  {
    slug: "games-like-ghost-of-tsushima",
    seoTitle: "Games like Ghost of Tsushima | Samurai action picks | GamePing AI",
    metaDescription:
      "Games like Ghost of Tsushima: samurai duels, stances and stealth in beautiful worlds. Curated picks with a reason each, on GamePing AI.",
    h1: "Games like Ghost of Tsushima",
    intro:
      "Ghost of Tsushima is two games in a coat: a swordsman who wants an honourable duel, and a ghost who does what wins. These take one side or the other — and the swordplay is the point in all of them.",
    games: [
      {
        title: "Sekiro: Shadows Die Twice",
        image: steamHeaderImage(814380),
        whyItFits:
          "The duel, perfected. Deflect, posture-break, kill. Far harder than Tsushima, and the finest sword combat there is.",
      },
      {
        title: "Nioh 2",
        image: steamHeaderImage(1325200),
        whyItFits:
          "Sengoku Japan with stances, demons and loot. The stance system is Tsushima's, given a hundred more layers.",
      },
      {
        title: "Rise of the Ronin",
        image: steamHeaderImage(1340990),
        whyItFits:
          "The most direct swap: an open-world Japan, a horse, factions to choose between, and combat that rewards the counter.",
      },
      {
        title: "Sifu",
        image: steamHeaderImage(2138710),
        whyItFits:
          "No sword, same lesson — mastery through repetition, until a fight you kept losing becomes one you dance through.",
      },
      {
        title: "Trek to Yomi",
        image: steamHeaderImage(1370050),
        whyItFits:
          "Kurosawa mode as an entire game: black-and-white, side-on, and short enough to finish in an evening.",
      },
    ],
  },
  {
    slug: "games-like-hogwarts-legacy",
    seoTitle: "Games like Hogwarts Legacy | Magic RPG picks | GamePing AI",
    metaDescription:
      "Games like Hogwarts Legacy: spellcasting, secrets and open-world fantasy to lose a weekend in. Curated RPG picks on GamePing AI.",
    h1: "Games like Hogwarts Legacy",
    intro:
      "Hogwarts Legacy sells a fantasy older than the castle: you can do magic, and there's a whole world that wants poking at. These give you the spellbook and the open door.",
    games: [
      {
        title: "The Elder Scrolls V: Skyrim",
        image: steamHeaderImage(489830),
        whyItFits:
          "The open-world fantasy everything else is measured against. Go anywhere, be a mage, ignore the plot for eighty hours.",
      },
      {
        title: "Avowed",
        image: steamHeaderImage(2457220),
        whyItFits:
          "First-person spellcasting with real punch — a wand in one hand, a sword in the other, in a world with its own politics.",
      },
      {
        title: "Dragon Age: Inquisition",
        image: steamHeaderImage(1222690),
        whyItFits:
          "For the other half of the appeal: a party of companions with opinions about you, and a fortress that becomes yours.",
      },
      {
        title: "Tiny Tina's Wonderlands",
        image: steamHeaderImage(1286680),
        whyItFits:
          "Fantasy with the seriousness taken out. Spells on cooldown, guns in both hands, loot everywhere.",
      },
      {
        title: "Immortals Fenyx Rising",
        image: steamHeaderImage(2221920),
        whyItFits:
          "The lightest, breeziest open world of the lot — mythic powers, puzzle vaults, and a map that keeps handing you things.",
      },
    ],
  },
  {
    slug: "games-like-diablo-4",
    seoTitle: "Games like Diablo 4 | Action RPG & loot picks | GamePing AI",
    metaDescription:
      "Games like Diablo IV: click, kill, loot, respec, repeat. The best action RPGs on PC, each with a reason it earns its spot. GamePing AI.",
    h1: "Games like Diablo IV",
    intro:
      "The loop is the whole religion: a screen full of enemies, a floor full of loot, and a build you keep tuning. These are the ARPGs worth pouring a season into.",
    games: [
      {
        title: "Path of Exile",
        image: steamHeaderImage(238960),
        whyItFits:
          "The deep end. A skill tree the size of a galaxy and an economy to match — free, and endless if you let it be.",
      },
      {
        title: "Last Epoch",
        image: steamHeaderImage(899770),
        whyItFits:
          "The sweet spot between Diablo's readability and Path of Exile's depth, with the friendliest crafting in the genre.",
      },
      {
        title: "Grim Dawn",
        image: steamHeaderImage(219990),
        whyItFits:
          "Dual-class builds and a grim, grounded world. Old-school in the best way, and enormous once it gets going.",
      },
      {
        title: "Torchlight II",
        image: steamHeaderImage(200710),
        whyItFits:
          "Brighter, faster and unfussy — the ARPG to play when you want the loot without the second job.",
      },
      {
        title: "Titan Quest Anniversary Edition",
        image: steamHeaderImage(475150),
        whyItFits:
          "The mythological classic, still generous: mix two masteries and carve through the ancient world.",
      },
    ],
  },
  {
    slug: "games-like-dead-cells",
    seoTitle: "Games like Dead Cells | Roguelite action picks | GamePing AI",
    metaDescription:
      "Games like Dead Cells: fast 2D combat, permadeath and a build you rediscover every run. Curated roguelite picks on GamePing AI.",
    h1: "Games like Dead Cells",
    intro:
      "Dead Cells is a fighting game that resets: every run hands you different weapons and dares you to make them work. These keep the speed, the death, and the itch to go once more.",
    games: [
      {
        title: "Rogue Legacy 2",
        image: steamHeaderImage(1253920),
        whyItFits:
          "Die, pass the castle to your (weird) heir, come back stronger. The most generous progression curve in the genre.",
      },
      {
        title: "Skul: The Hero Slayer",
        image: steamHeaderImage(1147560),
        whyItFits:
          "Swap skulls, swap movesets — the same run-to-run reinvention Dead Cells gets from its weapon drops.",
      },
      {
        title: "Curse of the Dead Gods",
        image: steamHeaderImage(1123770),
        whyItFits:
          "Heavier and darker: take the cursed shortcut and pay for it later. Combat with real weight behind each swing.",
      },
      {
        title: "Blasphemous",
        image: steamHeaderImage(774361),
        whyItFits:
          "Not a roguelite, but the same brutal 2D precision, wrapped in the most striking art you'll see all year.",
      },
      {
        title: "Hollow Knight",
        image: steamHeaderImage(367520),
        whyItFits:
          "If what you loved was the movement and the map, this is the peak of it — one huge world instead of a hundred runs.",
      },
    ],
  },
  {
    slug: "games-like-binding-of-isaac",
    seoTitle: "Games like The Binding of Isaac | Roguelike picks | GamePing AI",
    metaDescription:
      "Games like The Binding of Isaac: run-based roguelikes where the item combos break the game in the best way. Curated picks on GamePing AI.",
    h1: "Games like The Binding of Isaac",
    intro:
      "Isaac's magic is the pile-up: two harmless items collide and suddenly you're firing lasers through walls. These are the roguelikes that build a run out of accidents.",
    games: [
      {
        title: "Enter the Gungeon",
        image: steamHeaderImage(311690),
        whyItFits:
          "The obvious next run: rooms, dodge-rolls and hundreds of guns, some of which are jokes that still shoot.",
      },
      {
        title: "Nuclear Throne",
        image: steamHeaderImage(242680),
        whyItFits:
          "Faster and meaner. Runs last minutes, mutations stack fast, and death is always your own fault.",
      },
      {
        title: "Cult of the Lamb",
        image: steamHeaderImage(1313140),
        whyItFits:
          "The same top-down run structure, with a village of devoted followers to come home to between crusades.",
      },
      {
        title: "Risk of Rain 2",
        image: steamHeaderImage(632360),
        whyItFits:
          "Item stacking taken to absurdity in 3D — by minute forty you are a god, and the game is still winning.",
      },
      {
        title: "Noita",
        image: steamHeaderImage(881100),
        whyItFits:
          "Every pixel simulated, every wand craftable. No game rewards reckless experimentation — or punishes it — like this.",
      },
    ],
  },
  {
    slug: "games-like-rust",
    seoTitle: "Games like Rust | Survival PvP picks | GamePing AI",
    metaDescription:
      "Games like Rust: raid, build, betray. Hardcore multiplayer survival where other players are the real threat. Curated picks on GamePing AI.",
    h1: "Games like Rust",
    intro:
      "Rust isn't really about the hunger bar. It's about the moment someone knocks on your base wall. These are the survival games where other players are the weather.",
    games: [
      {
        title: "DayZ",
        image: steamHeaderImage(221100),
        whyItFits:
          "The original tense stranger-meeting simulator. Slower than Rust, and the fear of a voice on the road is unmatched.",
      },
      {
        title: "ARK: Survival Evolved",
        image: steamHeaderImage(346110),
        whyItFits:
          "Same base-building and raiding, plus tamed dinosaurs — which changes what an attack on your walls looks like.",
      },
      {
        title: "7 Days to Die",
        image: steamHeaderImage(251570),
        whyItFits:
          "Build for the horde night, not the neighbours. The best pure fortification game in survival.",
      },
      {
        title: "SCUM",
        image: steamHeaderImage(513710),
        whyItFits:
          "Survival with the dials turned to simulation — metabolism, gear condition, and PvP that punishes sloppiness.",
      },
      {
        title: "Sons Of The Forest",
        image: steamHeaderImage(1326470),
        whyItFits:
          "Co-op survival with a genuinely frightening enemy AI and building that's a pleasure rather than a chore.",
      },
    ],
  },
  {
    slug: "games-like-ark-survival-evolved",
    seoTitle: "Games like ARK | Taming & survival picks | GamePing AI",
    metaDescription:
      "Games like ARK: Survival Evolved — tame creatures, raise a base, survive the world. Curated survival-crafting picks on GamePing AI.",
    h1: "Games like ARK: Survival Evolved",
    intro:
      "ARK's hook is ownership: the creature you tamed, the base you raised, the gear you'd hate to lose. These give you a wild place and the tools to make it yours.",
    games: [
      {
        title: "Palworld",
        image: steamHeaderImage(1623730),
        whyItFits:
          "Taming as the core system, but the creatures also run your base. ARK's loop with far less friction.",
      },
      {
        title: "Conan Exiles",
        image: steamHeaderImage(440900),
        whyItFits:
          "The building is the best in the genre — and thralls fill the role your dinos did, guarding what you've raised.",
      },
      {
        title: "Valheim",
        image: steamHeaderImage(892970),
        whyItFits:
          "Co-op survival with real craft to it: sail, tame, build a hall, and go die to the next boss together.",
      },
      {
        title: "Enshrouded",
        image: steamHeaderImage(1203620),
        whyItFits:
          "Voxel building plus a genuine action-RPG combat layer — the closest thing to ARK with a good sword.",
      },
      {
        title: "Icarus",
        image: steamHeaderImage(1149460),
        whyItFits:
          "Survival with a countdown: drop, build, complete the job, get out. Same systems, sharper stakes.",
      },
    ],
  },
  {
    slug: "games-like-lethal-company",
    seoTitle: "Games like Lethal Company | Co-op horror picks | GamePing AI",
    metaDescription:
      "Games like Lethal Company: co-op horror where the funniest thing that happens is your friend dying. Curated picks on GamePing AI.",
    h1: "Games like Lethal Company",
    intro:
      "Lethal Company understood something: horror with friends is comedy with a body count. Proximity chat, a quota, and someone always splitting off alone. These are the games that get it.",
    games: [
      {
        title: "Content Warning",
        image: steamHeaderImage(2881650),
        whyItFits:
          "The same joke, aimed at fame instead of profit: film the monster, get the views, lose a friend to the thing in the dark.",
      },
      {
        title: "Phasmophobia",
        image: steamHeaderImage(739630),
        whyItFits:
          "Straighter horror, same shape — four people, one haunted building, and a plan that lasts thirty seconds.",
      },
      {
        title: "GTFO",
        image: steamHeaderImage(493520),
        whyItFits:
          "The serious version. Whispering, stealth, and cooperation that actually has to work or everyone dies.",
      },
      {
        title: "DEVOUR",
        image: steamHeaderImage(1274570),
        whyItFits:
          "Cheap, nasty and brilliant with four people: complete the ritual while something hunts the house.",
      },
      {
        title: "Deep Rock Galactic",
        image: steamHeaderImage(548430),
        whyItFits:
          "The friendliest of the bunch: dig, hit quota, get extracted. Rock and Stone instead of screaming.",
      },
    ],
  },
  {
    slug: "games-like-phasmophobia",
    seoTitle: "Games like Phasmophobia | Ghost-hunting co-op | GamePing AI",
    metaDescription:
      "Games like Phasmophobia: co-op ghost hunts, evidence gathering and the nerve to stay in the room. Curated horror picks on GamePing AI.",
    h1: "Games like Phasmophobia",
    intro:
      "It's an investigation game that happens to be terrifying: gather evidence, name the thing, get out before it names you. These keep the equipment, the dark, and the friend who won't stop talking.",
    games: [
      {
        title: "Demonologist",
        image: steamHeaderImage(1929610),
        whyItFits:
          "The most direct successor — same tools, same evidence loop, prettier houses and a nastier entity.",
      },
      {
        title: "DEVOUR",
        image: steamHeaderImage(1274570),
        whyItFits:
          "Less investigation, more running. A ritual to finish while a possessed host chases you through the farmhouse.",
      },
      {
        title: "Lethal Company",
        image: steamHeaderImage(1966720),
        whyItFits:
          "Co-op horror that turned into comedy. Proximity chat, a quota, and total chaos when the plan fails.",
      },
      {
        title: "Forewarned",
        image: steamHeaderImage(1562420),
        whyItFits:
          "Ghost hunting in Egyptian tombs: identify the mejai from the evidence, loot the place, leave before it finds you.",
      },
      {
        title: "The Mortuary Assistant",
        image: steamHeaderImage(1295920),
        whyItFits:
          "Solo, and all the scarier for it. Embalm the bodies, spot what's wrong, and know the demon is watching you work.",
      },
    ],
  },
  {
    slug: "games-like-resident-evil-4",
    seoTitle: "Games like Resident Evil 4 | Survival horror picks | GamePing AI",
    metaDescription:
      "Games like Resident Evil 4: over-the-shoulder horror, scarce ammo and monsters worth the bullets. Curated picks on GamePing AI.",
    h1: "Games like Resident Evil 4",
    intro:
      "RE4 invented the modern action-horror rhythm: aim, hesitate, count your bullets, swing anyway. These pick up where the village left off.",
    games: [
      {
        title: "Resident Evil 2",
        image: steamHeaderImage(883710),
        whyItFits:
          "The remake that got the balance right: tighter, more frightening, and Mr X never stops walking.",
      },
      {
        title: "Dead Space",
        image: steamHeaderImage(1693980),
        whyItFits:
          "Same over-the-shoulder tension in space, with dismemberment as the core mechanic rather than a flourish.",
      },
      {
        title: "The Evil Within 2",
        image: steamHeaderImage(601430),
        whyItFits:
          "From RE4's own director. Semi-open areas, scavenged ammo, and a monster or two you won't forget.",
      },
      {
        title: "The Callisto Protocol",
        image: steamHeaderImage(1544020),
        whyItFits:
          "The most brutal of the lot — melee-led, gory, and best played with the lights off and expectations set to spectacle.",
      },
      {
        title: "Resident Evil Village",
        image: steamHeaderImage(1196590),
        whyItFits:
          "The direct sequel in spirit: a village, a merchant, and a set of houses that each try a different way to scare you.",
      },
    ],
  },
  {
    slug: "games-like-bioshock",
    seoTitle: "Games like BioShock | Immersive sim picks | GamePing AI",
    metaDescription:
      "Games like BioShock: powers in one hand, a gun in the other, and a world with something to say. Curated immersive-sim picks on GamePing AI.",
    h1: "Games like BioShock",
    intro:
      "BioShock is a shooter you remember for the place, not the guns: a broken city that explains itself through audio logs and architecture. These give you a world worth reading, and the tools to break it.",
    games: [
      {
        title: "Prey",
        image: steamHeaderImage(480490),
        whyItFits:
          "The truest heir: a station full of systems, alien powers instead of plasmids, and total freedom in how you solve a room.",
      },
      {
        title: "Dishonored",
        image: steamHeaderImage(205100),
        whyItFits:
          "Same designers' lineage. Powers you combine creatively, in a city with more story in its streets than its cutscenes.",
      },
      {
        title: "System Shock",
        image: steamHeaderImage(482400),
        whyItFits:
          "BioShock's own ancestor, rebuilt. SHODAN is still the best AI villain games have produced.",
      },
      {
        title: "Atomic Heart",
        image: steamHeaderImage(668580),
        whyItFits:
          "A retro-futurist utopia gone wrong, gloved hand full of powers. The most literal BioShock riff on the list.",
      },
      {
        title: "Deus Ex: Human Revolution",
        image: steamHeaderImage(238010),
        whyItFits:
          "Augment yourself, then choose the vent, the hack, or the front door. Choice as the whole design.",
      },
    ],
  },
  {
    slug: "games-like-mass-effect",
    seoTitle: "Games like Mass Effect | Sci-fi RPG picks | GamePing AI",
    metaDescription:
      "Games like Mass Effect: a ship, a crew, and choices that stick. Curated sci-fi RPG picks with a reason each, on GamePing AI.",
    h1: "Games like Mass Effect",
    intro:
      "Nobody finishes Mass Effect talking about the shooting. It's the crew — the ones you talked to on the ship, and the ones the ending took from you. These build a story out of the people in it.",
    games: [
      {
        title: "The Outer Worlds",
        image: steamHeaderImage(578650),
        whyItFits:
          "A ship, companions with agendas, and corporate satire in place of Reapers. Made by people who wrote a lot of the classics.",
      },
      {
        title: "Star Wars: Knights of the Old Republic",
        image: steamHeaderImage(32370),
        whyItFits:
          "The same studio's blueprint for all of it: a party, a galaxy, and the best twist BioWare ever wrote.",
      },
      {
        title: "Starfield",
        image: steamHeaderImage(1716740),
        whyItFits:
          "The biggest version of the fantasy: your ship, your crew, and a thousand planets to be busy on.",
      },
      {
        title: "Dragon Age: Inquisition",
        image: steamHeaderImage(1222690),
        whyItFits:
          "Mass Effect's structure in fantasy dress — a base, a war table, and companions who'll fall out with you.",
      },
      {
        title: "Cyberpunk 2077",
        image: steamHeaderImage(1091500),
        whyItFits:
          "For the other half: dialogue that changes things, a city with weight, and an ending that costs you something.",
      },
    ],
  },
  {
    slug: "games-like-divinity-original-sin-2",
    seoTitle: "Games like Divinity: Original Sin 2 | Party CRPG picks | GamePing AI",
    metaDescription:
      "Games like Divinity: Original Sin 2 — turn-based parties, absurd tactical freedom, choices that matter. Curated CRPG picks on GamePing AI.",
    h1: "Games like Divinity: Original Sin 2",
    intro:
      "Original Sin 2's genius is that it says yes: teleport the enemy into the lava, rain on the fire, poison the surface you're standing on. These are the CRPGs that let you think sideways.",
    games: [
      {
        title: "Baldur's Gate 3",
        image: steamHeaderImage(1086940),
        whyItFits:
          "The same studio, refined. D&D rules, a companion cast people fall in love with, and the same freedom to solve it wrong.",
      },
      {
        title: "Pathfinder: Wrath of the Righteous",
        image: steamHeaderImage(1184370),
        whyItFits:
          "The deepest character builder in the genre, with mythic paths that genuinely rewrite the campaign.",
      },
      {
        title: "Wasteland 3",
        image: steamHeaderImage(719040),
        whyItFits:
          "Turn-based squad tactics with a mean streak, in a frozen Colorado where nobody is quite the good guy.",
      },
      {
        title: "Solasta: Crown of the Magister",
        image: steamHeaderImage(1096530),
        whyItFits:
          "The most faithful tabletop feel — real 5e rules, verticality, and combat that respects the dice.",
      },
      {
        title: "Pillars of Eternity",
        image: steamHeaderImage(291650),
        whyItFits:
          "For the writing above all. Slower, denser, and the best-written world of the modern CRPG revival.",
      },
    ],
  },
  {
    slug: "games-like-xcom-2",
    seoTitle: "Games like XCOM 2 | Turn-based tactics picks | GamePing AI",
    metaDescription:
      "Games like XCOM 2: squads you name, missions you lose them on, and a 95% shot that misses. Curated tactics picks on GamePing AI.",
    h1: "Games like XCOM 2",
    intro:
      "XCOM's cruelty is the point: you name the rookie, she survives four missions, and then a 95% shot misses. These are the tactics games that make every turn cost something.",
    games: [
      {
        title: "Phoenix Point",
        image: steamHeaderImage(839770),
        whyItFits:
          "From XCOM's original creator. Free aiming and targeted limbs make each shot a decision rather than a dice roll.",
      },
      {
        title: "Mutant Year Zero: Road to Eden",
        image: steamHeaderImage(760060),
        whyItFits:
          "Real-time stealth to set up an ambush, then XCOM combat. It fixes the part of XCOM where you walk into the room blind.",
      },
      {
        title: "Jagged Alliance 3",
        image: steamHeaderImage(1084160),
        whyItFits:
          "Mercenaries with personalities and pay demands, a country to liberate, and tactical layers XCOM never had.",
      },
      {
        title: "Gears Tactics",
        image: steamHeaderImage(1184050),
        whyItFits:
          "Faster and more aggressive — no timers, more actions, and executions that feed the squad. XCOM with the brakes off.",
      },
      {
        title: "Into the Breach",
        image: steamHeaderImage(590380),
        whyItFits:
          "Perfect information, no misses, tiny grids. All the tactics, none of the dice — and somehow just as tense.",
      },
    ],
  },
  {
    slug: "games-like-cities-skylines",
    seoTitle: "Games like Cities: Skylines | City-builder picks | GamePing AI",
    metaDescription:
      "Games like Cities: Skylines — zoning, traffic, and a skyline you built by hand. Curated city-builder and management picks on GamePing AI.",
    h1: "Games like Cities: Skylines",
    intro:
      "Every city builder is really a traffic game, and Cities: Skylines is the one that admits it. These give you a map, a budget, and the slow satisfaction of a system that finally flows.",
    games: [
      {
        title: "Cities: Skylines II",
        image: steamHeaderImage(949230),
        whyItFits:
          "The sequel: deeper economy, better roads, bigger maps. The obvious next step once you've solved the first one.",
      },
      {
        title: "Anno 1800",
        image: steamHeaderImage(916440),
        whyItFits:
          "City building crossed with supply chains — beautiful, dense, and the best production-chain puzzle in the genre.",
      },
      {
        title: "Tropico 6",
        image: steamHeaderImage(492720),
        whyItFits:
          "The same building, plus politics: rig the election, please the factions, pocket the aid money.",
      },
      {
        title: "Manor Lords",
        image: steamHeaderImage(1363080),
        whyItFits:
          "Medieval and organic — no grid, real terrain, and a village that grows the way a village actually would.",
      },
      {
        title: "Workers & Resources: Soviet Republic",
        image: steamHeaderImage(784150),
        whyItFits:
          "The hardcore end: simulate every brick, every bus route, every worker. Unforgiving, and deeply rewarding.",
      },
    ],
  },
  {
    slug: "games-like-dont-starve",
    seoTitle: "Games like Don't Starve | Survival crafting picks | GamePing AI",
    metaDescription:
      "Games like Don't Starve: hostile worlds, thin margins and a first winter that kills you. Curated survival picks on GamePing AI.",
    h1: "Games like Don't Starve",
    intro:
      "Don't Starve is survival as a puzzle you fail at until you don't: learn the season, learn the monster, die, come back knowing. These punish the same way, and teach the same way.",
    games: [
      {
        title: "The Long Dark",
        image: steamHeaderImage(305620),
        whyItFits:
          "No monsters at all — just cold, calories and distance. The purest survival game on the list, and the loneliest.",
      },
      {
        title: "Green Hell",
        image: steamHeaderImage(815370),
        whyItFits:
          "The Amazon, with wounds you have to treat and a mind that comes apart. Survival that reads as genuinely dangerous.",
      },
      {
        title: "Grounded",
        image: steamHeaderImage(962130),
        whyItFits:
          "Shrunk to insect size in a back garden. Cheerful on the surface, and then a spider comes over the grass.",
      },
      {
        title: "Subnautica",
        image: steamHeaderImage(264710),
        whyItFits:
          "Same crafting-under-pressure loop, underwater, where the dark below you is the real hunger meter.",
      },
      {
        title: "Project Zomboid",
        image: steamHeaderImage(108600),
        whyItFits:
          "This is how you died. A survival sim that assumes your defeat and makes the run there fascinating.",
      },
    ],
  },
  {
    slug: "games-like-balatro",
    seoTitle: "Games like Balatro | Deckbuilder roguelike picks | GamePing AI",
    metaDescription:
      "Games like Balatro: deckbuilders and number-breaking roguelikes you meant to play for ten minutes. Curated picks on GamePing AI.",
    h1: "Games like Balatro",
    intro:
      "Balatro is a slot machine for people who like maths: a deck, a joker, and a score that suddenly has too many digits. These are the run-based games that end with you saying just one more.",
    games: [
      {
        title: "Slay the Spire",
        image: steamHeaderImage(646570),
        whyItFits:
          "The blueprint for all of it. Build a deck up a mountain and watch a single relic turn it into an engine.",
      },
      {
        title: "Inscryption",
        image: steamHeaderImage(1092790),
        whyItFits:
          "A card game that keeps refusing to stay one. Play it knowing nothing — that's the whole point.",
      },
      {
        title: "Monster Train",
        image: steamHeaderImage(1102190),
        whyItFits:
          "Deckbuilding with a board attached, and combos that break the numbers even harder than Balatro's do.",
      },
      {
        title: "Luck be a Landlord",
        image: steamHeaderImage(1404850),
        whyItFits:
          "The other slot-machine roguelike: build synergies on the reels to make rent. Grimly funny and horribly moreish.",
      },
      {
        title: "Dungeons & Degenerate Gamblers",
        image: steamHeaderImage(2400510),
        whyItFits:
          "Blackjack as a combat system, with cards that cheat. The closest thing to Balatro's love of a broken rule.",
      },
    ],
  },
  {
    slug: "games-like-forza-horizon-5",
    seoTitle: "Games like Forza Horizon 5 | Open-world racing picks | GamePing AI",
    metaDescription:
      "Games like Forza Horizon 5: open roads, fast cars and no penalty for going the scenic way. Curated racing picks on GamePing AI.",
    h1: "Games like Forza Horizon 5",
    intro:
      "Horizon is a driving game that never nags: no fuel, no tyre wear, just a beautiful map and a car that wants to be sideways in it. These keep the road open.",
    games: [
      {
        title: "The Crew Motorfest",
        image: steamHeaderImage(2698940),
        whyItFits:
          "The most direct alternative — an open island, themed playlists, and an unreasonable amount of car.",
      },
      {
        title: "Need for Speed Heat",
        image: steamHeaderImage(1222680),
        whyItFits:
          "Same arcade handling, plus night races, cops and a customisation menu you'll lose an hour to.",
      },
      {
        title: "Burnout Paradise Remastered",
        image: steamHeaderImage(1238080),
        whyItFits:
          "The ancestor of open-world arcade racing, and still the most joyful thing to do with a car and a wall.",
      },
      {
        title: "art of rally",
        image: steamHeaderImage(550320),
        whyItFits:
          "Stripped to the drive itself: top-down, stylised, and pure flow once the drifts start to click.",
      },
      {
        title: "DIRT 5",
        image: steamHeaderImage(1038250),
        whyItFits:
          "The loudest, muddiest option. Arcade off-road racing that's happiest when the track has stopped being one.",
      },
    ],
  },
  {
    slug: "games-like-among-us",
    seoTitle: "Games like Among Us | Social deduction picks | GamePing AI",
    metaDescription:
      "Games like Among Us: lie to your friends, accuse the wrong one, do it again. Curated social-deduction picks on GamePing AI.",
    h1: "Games like Among Us",
    intro:
      "Among Us is a lying game with chores attached, and the chores are just there to give you an alibi. These put a group of friends in a room and hand one of them a secret.",
    games: [
      {
        title: "Goose Goose Duck",
        image: steamHeaderImage(1568590),
        whyItFits:
          "The most direct successor — same shape, far more roles, and proximity chat that makes every accusation live.",
      },
      {
        title: "Project Winter",
        image: steamHeaderImage(774861),
        whyItFits:
          "Survival social deduction: the cold will kill you if the traitor doesn't, so you have to cooperate with a suspect.",
      },
      {
        title: "First Class Trouble",
        image: steamHeaderImage(953880),
        whyItFits:
          "A luxury spaceliner, an AI to shut down, and two Personoids among you. Voice chat turns it into pure theatre.",
      },
      {
        title: "Unfortunate Spacemen",
        image: steamHeaderImage(408900),
        whyItFits:
          "The shapeshifter version: the impostor is a monster in disguise, and paranoia scales with the body count.",
      },
      {
        title: "Town of Salem 2",
        image: steamHeaderImage(2140510),
        whyItFits:
          "For the ones who came for the meetings, not the tasks. Roles, claims and argument as the entire game.",
      },
    ],
  },
];
