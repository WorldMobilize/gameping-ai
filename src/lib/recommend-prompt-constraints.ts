import type { RawgCandidate } from "@/lib/rawg-discovery";

export type PromptGenreIdentity =
  | "rpg"
  | "jrpg"
  | "strategy"
  | "detective"
  | "survival"
  | "management";

export type PromptGameplayRequirement =
  | "player-deduction"
  | "meaningful-choices"
  | "build"
  | "customize"
  | "explore"
  | "accessible"
  | "focused";

export type PromptAvoidRequirement =
  | "grind"
  | "difficult-combat"
  | "overwhelming"
  | "hardcore";

export type PromptConstraints = {
  active: boolean;
  genreIdentity: PromptGenreIdentity[];
  gameplayRequirements: PromptGameplayRequirement[];
  avoidRequirements: PromptAvoidRequirement[];
};

const RPG_GENRE_METADATA_RE =
  /\b(rpg|role-playing|role playing|jrpg|j-rpg|tactical rpg|strategy rpg|action rpg|crpg|turn-based strategy|turn based strategy)\b/i;

const STORY_ONLY_ADVENTURE_NAME_RE =
  /\b(firewatch|life is strange|before the storm|to the moon|what remains of edith finch|the forgotten city|gone home|her story|night in the woods|a normal lost phone|simulacra|telling me|oxenfree|gris|walking simulator|kentucky route zero|as dusk falls|twelve minutes)\b/i;

/** Canonical accessible story RPGs for RPG + story + low-grind / easy-combat prompts. */
const ACCESSIBLE_STORY_RPG_CANON_RE =
  /\b(mass effect|dragon age|disco elysium|witcher|baldur'?s gate|persona|fire emblem|banner saga|pillars of eternity|divinity|outer worlds)\b/i;

const GRIND_HEAVY_FRANCHISE_RE =
  /\b(xenoblade|tales of|final fantasy|ffxiv|ff xi|monster hunter|souls|elden ring|dark souls|bloodborne|sekiro|outward|kenshi|kingdom come|lost ark|black desert|runescape|granblue|gacha)\b/i;

const SURVIVAL_OR_HARDCORE_RPG_RE =
  /\b(survival rpg|survival horror rpg|hardcore rpg|soulslike|permadeath|kenshi|outward|kingdom come deliverance|valheim|subnautica|green hell|the forest|dayz|rust)\b/i;

const PASSIVE_DETECTIVE_NAME_RE =
  /\b(the wolf among us|wolf among us|telltale|batman the telltale|game of thrones telltale|tales from the borderlands|the walking dead telltale|detroit become human|heavy rain|beyond two souls|until dawn)\b/i;

const PLAYER_DEDUCTION_NAME_RE =
  /\b(return of the obra dinn|obra dinn|paradise killer|case of the golden idol|golden idol|ace attorney|phoenix wright|professor layton|l\.?\s*a\.?\s*noire|lacuna|immortality|crimes of the future|the room|heaven'?s vault|chronicle of innsmouth|immortality)\b/i;

const PLAYER_DEDUCTION_METADATA_RE =
  /\b(puzzle|deduction|investigation|logic|clue|detective puzzle|point-and-click|point and click|brain teaser|reasoning)\b/i;

const GRIND_HEAVY_METADATA_RE =
  /\b(mmo|mmorpg|grinding|loot grind|soulslike|roguelike|permadeath|bullet hell|looter shooter|endgame grind|korean mmo)\b/i;

const DIFFICULT_COMBAT_METADATA_RE =
  /\b(soulslike|hardcore|permadeath|bullet hell|punishing|extremely difficult|very challenging combat)\b/i;

const OVERWHELMING_SCOPE_RE =
  /\b(open world survival|survival rpg|hardcore rpg|massively multiplayer|mmorpg|permadeath|soulslike|kingdom come deliverance|outward|kenshi|crpg hardcore)\b/i;

const ACCESSIBLE_RPG_RE =
  /\b(story rich|narrative rpg|action rpg|choice driven|character driven|party based|tactical rpg|western rpg|wrpg)\b/i;

function candidateBlob(candidate: Pick<RawgCandidate, "name" | "genres" | "tags">) {
  const genreText = (candidate.genres ?? []).map((g) => g.name).join(" | ");
  const tagText = (candidate.tags ?? []).map((t) => t.name).join(" | ");
  return `${candidate.name} | ${genreText} | ${tagText}`.toLowerCase();
}

function normalizePromptText(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Explicit genre / gameplay / avoid qualifiers from the user prompt. */
export function extractPromptConstraints(userPrompt: string): PromptConstraints {
  const inactive: PromptConstraints = {
    active: false,
    genreIdentity: [],
    gameplayRequirements: [],
    avoidRequirements: [],
  };

  const n = normalizePromptText(userPrompt);
  if (!n) return inactive;

  const genreIdentity: PromptGenreIdentity[] = [];
  const gameplayRequirements: PromptGameplayRequirement[] = [];
  const avoidRequirements: PromptAvoidRequirement[] = [];

  if (/\bj\.?\s*r\.?\s*p\.?\s*g\.?\s*s?\b|\bjrpgs?\b/i.test(n)) genreIdentity.push("jrpg");
  if (
    (/\b(?:^|\s)rpgs?\b|\brole[\s-]?playing(?:\s+games?)?\b|\bgdr\b/i.test(n) ||
      /\blike\s+(?:the\s+)?witcher\b/i.test(n)) &&
    !genreIdentity.includes("jrpg")
  ) {
    genreIdentity.push("rpg");
  }
  if (/\b(strateg(y|ies)|4x|\brts\b|real[\s-]?time strategy)\b/i.test(n)) {
    genreIdentity.push("strategy");
  }
  if (/\b(detective|mystery|investigation|noir|whodunit|who dunnit)\b/i.test(n)) {
    genreIdentity.push("detective");
  }
  if (/\b(survival|survive|crafting survival)\b/i.test(n) && !/\b(not|no|without)\s+survival\b/i.test(n)) {
    genreIdentity.push("survival");
  }
  if (/\b(management|city builder|colony sim|base manag)\b/i.test(n)) {
    genreIdentity.push("management");
  }

  if (
    /\b(solve(?:\s+(?:the|it))?\s+myself|think\s+and\s+solve|real\s+deduction|figure\s+(?:it|things)\s+out\s+myself|actually\s+(?:have\s+to\s+)?think|player\s+deduction|deduction\s+gameplay|solve\s+the\s+mystery\s+myself|solve\s+mysteries\s+myself)\b/i.test(
      n
    )
  ) {
    gameplayRequirements.push("player-deduction");
  }
  if (/\bchoices?\s+matter|meaningful\s+choices|my\s+choices?\s+matter\b/i.test(n)) {
    gameplayRequirements.push("meaningful-choices");
  }
  if (/\b(build(?:ing)?|base[\s-]?build|construct)\b/i.test(n) && !/\b(not|no|without)\s+build/i.test(n)) {
    gameplayRequirements.push("build");
  }
  if (/\b(customize|customisation|customization|character\s+creat)\b/i.test(n)) {
    gameplayRequirements.push("customize");
  }
  if (/\b(explore|exploration|open\s+world)\b/i.test(n) && !/\b(not|no|without)\s+explor/i.test(n)) {
    gameplayRequirements.push("explore");
  }
  if (
    /\b(smaller|less overwhelming|not overwhelming|easier to approach|more focused|bite[\s-]?sized|compact|manageable|simpler|less systems|fewer systems|easier to get into)\b/i.test(
      n
    ) ||
    (/\blike\s+(?:the\s+)?witcher\b/i.test(n) &&
      /\b(smaller|less|overwhelm|focused|accessible|manageable|simpler)\b/i.test(n))
  ) {
    gameplayRequirements.push("accessible");
    gameplayRequirements.push("focused");
  }

  if (/\b(hate|avoid|no|not|without|dislike|don't like|do not like)\s+(?:grinding|grind)\b|\bno\s+grind\b/i.test(n)) {
    avoidRequirements.push("grind");
  }
  if (
    /\b(hate|avoid|not|no|without|dislike)\s+(?:difficult|hard)\s*(?:combat|fighting|battles)?\b/i.test(
      n
    ) ||
    (/\b(hate|avoid|not|no|without|dislike)\b/i.test(n) &&
      /\bdifficult\s+combat\b/i.test(n))
  ) {
    avoidRequirements.push("difficult-combat");
  }
  if (/\b(less overwhelming|not overwhelming|overwhelming|too big|too huge|too complex)\b/i.test(n)) {
    avoidRequirements.push("overwhelming");
  }
  if (/\b(hardcore|punishing|soulslike|brutal|extreme difficulty)\b/i.test(n) && /\b(not|no|avoid|hate|without|less)\b/i.test(n)) {
    avoidRequirements.push("hardcore");
  }
  if (/\b(relaxing|casual|low pressure|chill)\b/i.test(n) && /\b(combat|rpg|game)\b/i.test(n)) {
    if (!avoidRequirements.includes("difficult-combat")) avoidRequirements.push("difficult-combat");
  }

  const active =
    genreIdentity.length > 0 ||
    gameplayRequirements.length > 0 ||
    (avoidRequirements.length > 0 &&
      (genreIdentity.length > 0 || gameplayRequirements.length > 0));

  if (!active) return inactive;

  return {
    active: true,
    genreIdentity: [...new Set(genreIdentity)],
    gameplayRequirements: [...new Set(gameplayRequirements)],
    avoidRequirements: [...new Set(avoidRequirements)],
  };
}

export function hasRpgGenreMetadata(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  return RPG_GENRE_METADATA_RE.test(candidateBlob(candidate));
}

export function requiresExplicitRpgIdentity(constraints: PromptConstraints): boolean {
  if (!constraints.active) return false;
  return (
    constraints.genreIdentity.includes("rpg") || constraints.genreIdentity.includes("jrpg")
  );
}

function wantsAccessibleStoryRpg(constraints: PromptConstraints): boolean {
  if (!requiresExplicitRpgIdentity(constraints)) return false;
  return (
    constraints.avoidRequirements.includes("grind") ||
    constraints.avoidRequirements.includes("difficult-combat")
  );
}

export function isStoryOnlyAdventureMismatch(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  const name = candidate.name.toLowerCase();
  const genreText = (candidate.genres ?? []).map((g) => g.name).join(" ").toLowerCase();
  const blob = candidateBlob(candidate);

  // Hard reject known story-only adventures even when RAWG tags spurious RPG metadata.
  if (STORY_ONLY_ADVENTURE_NAME_RE.test(name)) return true;

  if (hasRpgGenreMetadata(candidate)) return false;

  const walkingSim = /\b(walking simulator|interactive fiction|visual novel)\b/i.test(blob);
  const adventureOnly =
    /\badventure\b/i.test(genreText) &&
    !/\b(rpg|role-playing|strategy|tactical|jrpg)\b/i.test(genreText);

  return walkingSim || (adventureOnly && /\b(narrative|story|mystery|choices)\b/i.test(blob));
}

export function hasPlayerDeductionGameplay(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  const blob = candidateBlob(candidate);
  const name = candidate.name.toLowerCase();
  if (PLAYER_DEDUCTION_NAME_RE.test(name) || PLAYER_DEDUCTION_NAME_RE.test(blob)) {
    return true;
  }
  if (
    PLAYER_DEDUCTION_METADATA_RE.test(blob) &&
    /\b(detective|mystery|investigation|crime|noir)\b/i.test(blob)
  ) {
    return true;
  }
  return false;
}

export function isPassiveDetectiveExperience(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">
): boolean {
  if (hasPlayerDeductionGameplay(candidate)) return false;
  const blob = candidateBlob(candidate);
  const name = candidate.name.toLowerCase();
  if (PASSIVE_DETECTIVE_NAME_RE.test(name) || PASSIVE_DETECTIVE_NAME_RE.test(blob)) {
    return true;
  }
  if (
    /\b(visual novel|interactive fiction|choose your adventure|cinematic adventure)\b/i.test(
      blob
    ) &&
    /\b(detective|mystery|crime|noir)\b/i.test(blob) &&
    !PLAYER_DEDUCTION_METADATA_RE.test(blob)
  ) {
    return true;
  }
  return false;
}

/** Hard reject when explicit prompt constraints are clearly violated. */
export function violatesPromptConstraints(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">,
  constraints: PromptConstraints
): boolean {
  if (!constraints.active) return false;

  const wantsRpg =
    constraints.genreIdentity.includes("rpg") ||
    constraints.genreIdentity.includes("jrpg");

  if (wantsRpg && isStoryOnlyAdventureMismatch(candidate)) {
    return true;
  }

  if (
    constraints.gameplayRequirements.includes("player-deduction") &&
    constraints.genreIdentity.includes("detective") &&
    isPassiveDetectiveExperience(candidate)
  ) {
    return true;
  }

  return false;
}

/** Scoring nudge: vibe alone must not override explicit mechanics/genre. */
export function scorePromptConstraintBoost(
  candidate: Pick<RawgCandidate, "name" | "genres" | "tags">,
  constraints: PromptConstraints
): number {
  if (!constraints.active) return 0;

  let delta = 0;
  const blob = candidateBlob(candidate);
  const name = candidate.name.toLowerCase();
  const storyOnlyMismatch = isStoryOnlyAdventureMismatch(candidate);

  const wantsRpg =
    constraints.genreIdentity.includes("rpg") ||
    constraints.genreIdentity.includes("jrpg");

  if (wantsRpg) {
    if (storyOnlyMismatch) delta -= 58;
    else if (hasRpgGenreMetadata(candidate)) delta += 16;
    else delta -= 28;
  }

  if (constraints.genreIdentity.includes("detective")) {
    if (/\b(detective|mystery|investigation|crime|noir)\b/i.test(blob)) delta += 8;
  }

  if (constraints.gameplayRequirements.includes("player-deduction")) {
    if (hasPlayerDeductionGameplay(candidate)) delta += 18;
    else if (isPassiveDetectiveExperience(candidate)) delta -= 48;
    else if (/\b(detective|mystery|crime)\b/i.test(blob)) delta -= 12;
  }

  if (
    constraints.gameplayRequirements.includes("accessible") ||
    constraints.gameplayRequirements.includes("focused")
  ) {
    if (ACCESSIBLE_RPG_RE.test(blob) && hasRpgGenreMetadata(candidate)) delta += 12;
    if (OVERWHELMING_SCOPE_RE.test(blob) || OVERWHELMING_SCOPE_RE.test(name)) {
      delta -= 36;
    }
    if (/\boutward\b/i.test(name)) delta -= 42;
  }

  if (wantsAccessibleStoryRpg(constraints) && !storyOnlyMismatch) {
    if (hasRpgGenreMetadata(candidate)) {
      if (ACCESSIBLE_STORY_RPG_CANON_RE.test(name) || ACCESSIBLE_STORY_RPG_CANON_RE.test(blob)) {
        delta += 24;
      }
      if (
        /\b(story rich|narrative|choice driven|choices matter|party based|companions|character driven)\b/i.test(
          blob
        )
      ) {
        delta += 14;
      }
      if (/\b(story mode|easy mode|accessible|casual)\b/i.test(blob)) delta += 8;
    }
    if (GRIND_HEAVY_FRANCHISE_RE.test(name) || GRIND_HEAVY_FRANCHISE_RE.test(blob)) {
      delta -= 38;
    }
    if (SURVIVAL_OR_HARDCORE_RPG_RE.test(name) || SURVIVAL_OR_HARDCORE_RPG_RE.test(blob)) {
      delta -= 42;
    }
  }

  if (constraints.avoidRequirements.includes("grind")) {
    if (GRIND_HEAVY_METADATA_RE.test(blob)) delta -= 32;
    if (
      !storyOnlyMismatch &&
      /\b(story rich|narrative|choice driven)\b/i.test(blob) &&
      wantsRpg
    ) {
      delta += 6;
    }
  }

  if (constraints.avoidRequirements.includes("difficult-combat")) {
    if (DIFFICULT_COMBAT_METADATA_RE.test(blob)) delta -= 34;
    if (
      !storyOnlyMismatch &&
      /\b(story rich|narrative|turn-based|tactical)\b/i.test(blob) &&
      wantsRpg
    ) {
      delta += 8;
    }
  }

  if (constraints.avoidRequirements.includes("overwhelming")) {
    if (OVERWHELMING_SCOPE_RE.test(blob) || OVERWHELMING_SCOPE_RE.test(name)) {
      delta -= 30;
    }
    if (ACCESSIBLE_RPG_RE.test(blob)) delta += 8;
  }

  if (constraints.avoidRequirements.includes("hardcore")) {
    if (/\b(hardcore|soulslike|punishing|permadeath)\b/i.test(blob)) delta -= 28;
  }

  if (constraints.genreIdentity.includes("strategy")) {
    if (/\b(strategy|rts|4x|real-time strategy|tactical)\b/i.test(blob)) delta += 10;
    else if (/\b(walking simulator|visual novel|interactive fiction)\b/i.test(blob)) {
      delta -= 24;
    }
  }

  return delta;
}

export function buildPromptConstraintDisambiguationRules(
  constraints: PromptConstraints
): string[] {
  if (!constraints.active) return [];

  const rules: string[] = [
    "Explicit user constraints (hard requirements — genre/mechanics outrank vibe overlap alone):",
  ];

  if (constraints.genreIdentity.length) {
    rules.push(
      `- Genre identity required: ${constraints.genreIdentity.join(", ")}. Story/narrative vibe alone does NOT replace missing genre identity (e.g. RPG requested → reject story-only adventures like Firewatch, Life is Strange, To the Moon).`
    );
  }
  if (constraints.gameplayRequirements.includes("player-deduction")) {
    rules.push(
      "- Player deduction required: prioritize games where the player solves clues/logic — not passive cinematic detective stories (e.g. The Wolf Among Us, Telltale-style choice adventures without puzzles)."
    );
  }
  if (
    constraints.gameplayRequirements.includes("accessible") ||
    constraints.gameplayRequirements.includes("focused")
  ) {
    rules.push(
      "- Smaller / less overwhelming means focused, approachable scope — NOT hardcore survival RPGs or punishing open-world grinds (e.g. Outward)."
    );
  }
  if (constraints.avoidRequirements.includes("grind")) {
    rules.push("- User explicitly avoids grinding — downrank MMO/grind-heavy loops.");
  }
  if (constraints.avoidRequirements.includes("difficult-combat")) {
    rules.push("- User avoids difficult combat — prefer accessible story RPGs over punishing combat systems.");
  }
  if (wantsAccessibleStoryRpg(constraints)) {
    rules.push(
      "- RPG + story + low grind/easy combat: prioritize accessible story RPGs (Mass Effect, Dragon Age, Disco Elysium, Witcher 3, Baldur's Gate 3, Persona, Fire Emblem, Banner Saga). Reject story-only adventures (Life is Strange, Firewatch, To the Moon) and grind-heavy/hardcore RPGs."
    );
  }

  return rules;
}
