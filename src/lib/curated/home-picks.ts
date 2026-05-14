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

/**
 * Extra directory-only entries (well-known Steam titles; RAWG search usually resolves).
 * Merged with carousel picks for /games — deduped by title.
 */
const EXTRA_DIRECTORY_GAMES: HomeGamePick[] = [
  { title: "Alan Wake 2", tag: "Survival horror · Narrative", image: steamHeaderImage(1597180) },
  { title: "American Truck Simulator", tag: "Driving sim · Relaxation", image: steamHeaderImage(270880) },
  { title: "Among Us", tag: "Social deduction · Party", image: steamHeaderImage(945360) },
  { title: "ARK: Survival Evolved", tag: "Survival · Dinosaurs", image: steamHeaderImage(346110) },
  { title: "Assassin's Creed Odyssey", tag: "Open world · Action RPG", image: steamHeaderImage(812140) },
  { title: "Baldur's Gate 3", tag: "CRPG · Party choices", image: steamHeaderImage(1086940) },
  { title: "BioShock Infinite", tag: "FPS · Narrative steampunk", image: steamHeaderImage(8870) },
  { title: "Celeste", tag: "Precision platformer · Indie", image: steamHeaderImage(504230) },
  { title: "Control", tag: "Third-person · Paranormal", image: steamHeaderImage(870780) },
  { title: "Cuphead", tag: "Run-and-gun · Boss rush", image: steamHeaderImage(268910) },
  { title: "Cyberpunk 2077", tag: "Sci-fi RPG · Open world", image: steamHeaderImage(1091500) },
  { title: "Dark Souls III", tag: "Action RPG · Soulslike", image: steamHeaderImage(374320) },
  { title: "Dave the Diver", tag: "Adventure · Restaurant sim", image: steamHeaderImage(1868140) },
  { title: "Death Stranding Director's Cut", tag: "Open world · Delivery", image: steamHeaderImage(1850570) },
  { title: "Deep Rock Galactic", tag: "Co-op FPS · Mining", image: steamHeaderImage(548430) },
  { title: "Devil May Cry 5", tag: "Stylish action · Hack and slash", image: steamHeaderImage(601150) },
  { title: "DOOM Eternal", tag: "Fast FPS · Heavy metal", image: steamHeaderImage(782330) },
  { title: "DREDGE", tag: "Fishing adventure · Cosmic horror", image: steamHeaderImage(1562430) },
  { title: "Elden Ring", tag: "Open world · Soulslike", image: steamHeaderImage(1245620) },
  { title: "Euro Truck Simulator 2", tag: "Driving sim · Relaxation", image: steamHeaderImage(227300) },
  { title: "Factorio", tag: "Automation · Factory sim", image: steamHeaderImage(427520) },
  { title: "Fallout: New Vegas", tag: "Open-world RPG · Post-apoc", image: steamHeaderImage(22380) },
  { title: "Firewatch", tag: "Walking sim · Mystery", image: steamHeaderImage(383870) },
  { title: "Ghost of Tsushima DIRECTOR'S CUT", tag: "Open world · Samurai", image: steamHeaderImage(2215430) },
  { title: "God of War", tag: "Action-adventure · Norse myth", image: steamHeaderImage(1593500) },
  { title: "Grand Theft Auto V", tag: "Open world · Action", image: steamHeaderImage(271590) },
  { title: "Half-Life 2", tag: "Classic FPS · Narrative", image: steamHeaderImage(220) },
  { title: "HELLDIVERS 2", tag: "Co-op shooter · Sci-fi", image: steamHeaderImage(553850) },
  { title: "Hogwarts Legacy", tag: "Open-world · Wizard RPG", image: steamHeaderImage(990080) },
  { title: "Horizon Zero Dawn Complete Edition", tag: "Open world · Action RPG", image: steamHeaderImage(1151640) },
  { title: "Left 4 Dead 2", tag: "Co-op · Zombie shooter", image: steamHeaderImage(550) },
  { title: "Lethal Company", tag: "Co-op horror · Scavenging", image: steamHeaderImage(1966720) },
  { title: "Mass Effect Legendary Edition", tag: "Sci-fi RPG trilogy", image: steamHeaderImage(1328670) },
  { title: "Minecraft", tag: "Sandbox · Survival creative", image: steamHeaderImage(1672970) },
  { title: "Monster Hunter: World", tag: "Action · Co-op hunts", image: steamHeaderImage(582010) },
  { title: "NieR:Automata", tag: "Action RPG · Hack and slash", image: steamHeaderImage(524220) },
  { title: "No Man's Sky", tag: "Exploration · Survival", image: steamHeaderImage(275850) },
  { title: "Outer Wilds", tag: "Exploration puzzle · Sci-fi", image: steamHeaderImage(753640) },
  { title: "Ori and the Will of the Wisps", tag: "Metroidvania · Platformer", image: steamHeaderImage(1057090) },
  { title: "Palworld", tag: "Survival crafting · Creatures", image: steamHeaderImage(1623730) },
  { title: "Persona 5 Royal", tag: "JRPG · Turn-based", image: steamHeaderImage(1687950) },
  { title: "Phasmophobia", tag: "Co-op horror · Investigation", image: steamHeaderImage(739630) },
  { title: "Portal 2", tag: "Puzzle · Comedy", image: steamHeaderImage(620) },
  { title: "Project Zomboid", tag: "Survival · Zombie sandbox", image: steamHeaderImage(108600) },
  { title: "Raft", tag: "Co-op survival · Ocean", image: steamHeaderImage(648800) },
  { title: "Red Dead Redemption 2", tag: "Open world · Western", image: steamHeaderImage(1174180) },
  { title: "Resident Evil 4", tag: "Survival horror · Remake", image: steamHeaderImage(2050650) },
  { title: "Risk of Rain 2", tag: "Co-op roguelike · Third person", image: steamHeaderImage(632360) },
  { title: "RimWorld", tag: "Colony sim · Story generator", image: steamHeaderImage(294100) },
  { title: "Rust", tag: "Survival multiplayer · PvP", image: steamHeaderImage(252490) },
  { title: "Sea of Thieves", tag: "Pirate sandbox · Co-op", image: steamHeaderImage(1172620) },
  { title: "Sekiro: Shadows Die Twice", tag: "Action · Stealth soulslike", image: steamHeaderImage(814380) },
  { title: "Slay the Spire", tag: "Roguelike deckbuilder", image: steamHeaderImage(646570) },
  { title: "Slime Rancher", tag: "Cute farming · Exploration", image: steamHeaderImage(433340) },
  { title: "Slime Rancher 2", tag: "Sequel · Cozy exploration", image: steamHeaderImage(1657630) },
  { title: "Spiritfarer", tag: "Cozy management · Emotional", image: steamHeaderImage(972660) },
  { title: "Starfield", tag: "Sci-fi RPG · Exploration", image: steamHeaderImage(1716740) },
  { title: "The Binding of Isaac: Rebirth", tag: "Roguelike · Twin-stick", image: steamHeaderImage(250900) },
  { title: "The Elder Scrolls V: Skyrim Special Edition", tag: "Open-world RPG", image: steamHeaderImage(489830) },
  { title: "The Last of Us Part I", tag: "Cinematic action-adventure", image: steamHeaderImage(1888930) },
  { title: "The Witcher 3: Wild Hunt", tag: "Open-world RPG · Fantasy", image: steamHeaderImage(292030) },
  { title: "Titanfall 2", tag: "FPS campaign · Parkour", image: steamHeaderImage(1237970) },
  { title: "Two Point Hospital", tag: "Management sim · Comedy", image: steamHeaderImage(535930) },
  { title: "Undertale", tag: "Indie RPG · Quirky", image: steamHeaderImage(391540) },
  { title: "Valheim", tag: "Survival · Co-op Viking", image: steamHeaderImage(892970) },
  { title: "Vampire Survivors", tag: "Bullet heaven · Roguelike", image: steamHeaderImage(1794680) },
  { title: "Cities: Skylines", tag: "City builder · Management", image: steamHeaderImage(255710) },
];

function mergeDirectoryGamesUniqueSorted(
  primary: HomeGamePick[],
  extra: HomeGamePick[]
): HomeGamePick[] {
  const byKey = new Map<string, HomeGamePick>();
  for (const g of primary) {
    byKey.set(g.title.trim().toLowerCase(), g);
  }
  for (const g of extra) {
    const k = g.title.trim().toLowerCase();
    if (!byKey.has(k)) byKey.set(k, g);
  }
  return [...byKey.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Alphabetical directory for /games — carousel picks plus curated extras.
 * Detail links use `gameDetailPath(title)` (RAWG resolves by search on first load).
 */
export const DIRECTORY_GAMES: HomeGamePick[] = mergeDirectoryGamesUniqueSorted(
  HOME_CAROUSEL_PICKS,
  EXTRA_DIRECTORY_GAMES
);
