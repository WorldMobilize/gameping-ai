import { normalizeSteamGameTitle } from "@/lib/steam-library/title-norm";
import { buildTasteDnaV1 } from "@/lib/steam-library/build-taste-dna-v1";
import {
  MIN_SIGNAL_PLAYTIME_MIN,
  TASTE_DNA_V2_VERSION,
  type TasteDna,
  type TasteDnaGameInput,
  type TasteDnaMotivation,
  type TasteDnaV1,
  type TasteDnaV2,
} from "@/lib/steam-library/taste-dna-types";

export {
  MIN_SIGNAL_PLAYTIME_MIN,
  TASTE_DNA_V1_VERSION,
  TASTE_DNA_V2_VERSION,
  isTasteDna,
  isTasteDnaV1,
  isTasteDnaV2,
  type TasteDna,
  type TasteDnaGameInput,
  type TasteDnaMotivation,
  type TasteDnaStats,
  type TasteDnaV1,
  type TasteDnaV2,
} from "@/lib/steam-library/taste-dna-types";

export { buildTasteDnaV1 } from "@/lib/steam-library/build-taste-dna-v1";

type MotivationId =
  | "player_freedom"
  | "sandbox_systems"
  | "emergent_gameplay"
  | "long_term_progression"
  | "meaningful_choices"
  | "exploration"
  | "survival_progression"
  | "character_progression"
  | "story_rich"
  | "simulation_systems"
  | "cooperative_play"
  | "horror_tension"
  | "cozy_relaxation";

type MotivationMeta = {
  trait: string;
  reason: string;
  likePhrases: string[];
};

const MOTIVATION_META: Record<MotivationId, MotivationMeta> = {
  player_freedom: {
    trait: "Player freedom",
    reason:
      "You spend time in games that allow different approaches and emergent situations.",
    likePhrases: ["open-ended worlds", "player agency"],
  },
  sandbox_systems: {
    trait: "Sandbox systems",
    reason:
      "You enjoy building, experimenting, and shaping systems instead of following a fixed path.",
    likePhrases: ["sandbox freedom", "systems-driven play"],
  },
  emergent_gameplay: {
    trait: "Emergent gameplay",
    reason:
      "Your playtime clusters around games where unplanned moments and player-driven outcomes matter.",
    likePhrases: ["emergent situations", "player-driven outcomes"],
  },
  long_term_progression: {
    trait: "Long-term progression",
    reason:
      "You stick with games that reward sustained investment and gradual mastery over time.",
    likePhrases: ["long-term progression", "sustained mastery"],
  },
  meaningful_choices: {
    trait: "Meaningful choices",
    reason:
      "You gravitate toward games where decisions shape outcomes, builds, or story branches.",
    likePhrases: ["meaningful choices", "branching consequences"],
  },
  exploration: {
    trait: "Exploration",
    reason:
      "You spend hours discovering spaces, secrets, and routes at your own pace.",
    likePhrases: ["exploration", "discovery at your own pace"],
  },
  survival_progression: {
    trait: "Survival progression",
    reason:
      "You enjoy surviving, crafting, and pushing forward through hostile or resource-scarce worlds.",
    likePhrases: ["survival loops", "crafting and resilience"],
  },
  character_progression: {
    trait: "Character progression",
    reason:
      "You like growing stronger, unlocking abilities, and refining builds over many sessions.",
    likePhrases: ["character progression", "build customization"],
  },
  story_rich: {
    trait: "Story-rich worlds",
    reason:
      "You invest in games with strong narrative framing, factions, or memorable quest lines.",
    likePhrases: ["story-rich worlds", "memorable quest lines"],
  },
  simulation_systems: {
    trait: "Simulation depth",
    reason:
      "You enjoy managing routines, economies, or realistic systems that unfold over time.",
    likePhrases: ["simulation depth", "management loops"],
  },
  cooperative_play: {
    trait: "Cooperative play",
    reason:
      "You often play games built around shared sessions and teamwork with others.",
    likePhrases: ["cooperative sessions", "team-based play"],
  },
  horror_tension: {
    trait: "Horror tension",
    reason:
      "You spend meaningful time in tense, scary, or high-stakes atmospheric games.",
    likePhrases: ["horror tension", "high-stakes atmosphere"],
  },
  cozy_relaxation: {
    trait: "Cozy relaxation",
    reason:
      "You unwind in slower, comforting games with low-pressure goals and familiar loops.",
    likePhrases: ["cozy pacing", "low-pressure goals"],
  },
};

type MotivationWeights = Partial<Record<MotivationId, number>>;

const MAX_MOTIVATIONS = 4;
const MAX_LIKES = 5;
const MAX_FAVORITE_SIGNALS = 5;
const MAX_AVOID = 3;
const MAX_HINTS = 4;

function playtimeWeight(minutes: number): number {
  return Math.sqrt(Math.max(0, minutes));
}

function mergeMotivationWeight(
  weights: MotivationWeights,
  id: MotivationId,
  weight: number
): void {
  weights[id] = Math.max(weights[id] ?? 0, weight);
}

function inferMotivationsForTitle(norm: string): MotivationWeights {
  const weights: MotivationWeights = {};

  if (norm.includes("7 days to die")) {
    mergeMotivationWeight(weights, "survival_progression", 5);
    mergeMotivationWeight(weights, "sandbox_systems", 4);
    mergeMotivationWeight(weights, "emergent_gameplay", 4);
    mergeMotivationWeight(weights, "long_term_progression", 3);
    mergeMotivationWeight(weights, "exploration", 2);
  }
  if (norm.includes("fallout")) {
    mergeMotivationWeight(weights, "player_freedom", 5);
    mergeMotivationWeight(weights, "meaningful_choices", 4);
    mergeMotivationWeight(weights, "exploration", 3);
    mergeMotivationWeight(weights, "character_progression", 3);
    mergeMotivationWeight(weights, "story_rich", 3);
    mergeMotivationWeight(weights, "long_term_progression", 2);
  }
  if (norm.includes("farming simulator")) {
    mergeMotivationWeight(weights, "simulation_systems", 5);
    mergeMotivationWeight(weights, "long_term_progression", 3);
  }
  if (norm.includes("phasmophobia")) {
    mergeMotivationWeight(weights, "horror_tension", 5);
    mergeMotivationWeight(weights, "cooperative_play", 4);
  }
  if (norm.includes("the sims")) {
    mergeMotivationWeight(weights, "simulation_systems", 4);
    mergeMotivationWeight(weights, "sandbox_systems", 3);
    mergeMotivationWeight(weights, "cozy_relaxation", 3);
  }

  if (/\bsurvival\b|\bzombie\b|\bcraft(?:ing)?\b|\bpost[- ]apoc/.test(norm)) {
    mergeMotivationWeight(weights, "survival_progression", 2);
    mergeMotivationWeight(weights, "emergent_gameplay", 2);
  }
  if (/\brpg\b|\brole[- ]playing\b/.test(norm)) {
    mergeMotivationWeight(weights, "character_progression", 2);
    mergeMotivationWeight(weights, "meaningful_choices", 2);
  }
  if (/\bopen world\b|\bsandbox\b/.test(norm)) {
    mergeMotivationWeight(weights, "sandbox_systems", 2);
    mergeMotivationWeight(weights, "player_freedom", 2);
    mergeMotivationWeight(weights, "exploration", 2);
  }
  if (/\bhorror\b|\bscary\b|\bfear\b/.test(norm)) {
    mergeMotivationWeight(weights, "horror_tension", 2);
  }
  if (/\bsimulat|\bsimulator\b|\btycoon\b/.test(norm)) {
    mergeMotivationWeight(weights, "simulation_systems", 2);
  }
  if (/\bco[- ]?op\b|\bmultiplayer\b/.test(norm)) {
    mergeMotivationWeight(weights, "cooperative_play", 2);
  }
  if (/\bexplor/.test(norm)) {
    mergeMotivationWeight(weights, "exploration", 2);
  }
  if (/\bstory\b|\bnarrative\b|\bchoice\b/.test(norm)) {
    mergeMotivationWeight(weights, "story_rich", 2);
    mergeMotivationWeight(weights, "meaningful_choices", 2);
  }
  if (/\bcozy\b|\brelax/.test(norm)) {
    mergeMotivationWeight(weights, "cozy_relaxation", 2);
  }

  return weights;
}

function roundConfidence(score: number, maxScore: number): number {
  if (maxScore <= 0 || score <= 0) return 0;
  const ratio = score / maxScore;
  return Math.round(Math.min(0.95, 0.58 + ratio * 0.37) * 100) / 100;
}

function pickArchetype(topIds: MotivationId[]): string {
  const set = new Set(topIds);

  if (
    set.has("player_freedom") &&
    (set.has("sandbox_systems") || set.has("emergent_gameplay"))
  ) {
    return "The Sandbox Explorer";
  }
  if (set.has("meaningful_choices") && set.has("story_rich")) {
    return "The Story Shaper";
  }
  if (set.has("simulation_systems") && set.has("long_term_progression")) {
    return "The Systems Builder";
  }
  if (set.has("survival_progression") && set.has("emergent_gameplay")) {
    return "The Survivor Tinkerer";
  }
  if (set.has("cooperative_play")) {
    return "The Co-op Main Character";
  }
  if (set.has("horror_tension")) {
    return "The Tension Seeker";
  }
  if (set.has("cozy_relaxation")) {
    return "The Cozy Optimizer";
  }
  if (set.has("character_progression")) {
    return "The Build Crafter";
  }

  return "The Curious Explorer";
}

function buildSummary(topIds: MotivationId[]): string {
  const phrases: string[] = [];

  if (
    topIds.includes("player_freedom") ||
    topIds.includes("sandbox_systems") ||
    topIds.includes("emergent_gameplay")
  ) {
    phrases.push("freedom");
  }
  if (topIds.includes("exploration")) {
    phrases.push("exploration");
  }
  if (topIds.includes("long_term_progression") || topIds.includes("character_progression")) {
    phrases.push("long-term progression");
  }
  if (topIds.includes("meaningful_choices") || topIds.includes("story_rich")) {
    phrases.push("meaningful choices");
  }
  if (topIds.includes("simulation_systems")) {
    phrases.push("deep systems");
  }
  if (topIds.includes("survival_progression")) {
    phrases.push("survival mastery");
  }
  if (topIds.includes("cozy_relaxation")) {
    phrases.push("low-pressure comfort");
  }

  const unique = [...new Set(phrases)];
  if (unique.length === 0) {
    return "You enjoy discovering games that match how you actually play, not just broad genre labels.";
  }
  if (unique.length === 1) {
    return `You prefer games built around ${unique[0]}.`;
  }
  const last = unique.pop();
  return `You prefer games where you create your own stories through ${unique.join(", ")}, and ${last}.`;
}

function buildAvoidLikely(topIds: MotivationId[], allScores: Map<MotivationId, number>): string[] {
  const avoid = new Set<string>();
  const set = new Set(topIds);

  if (
    set.has("player_freedom") ||
    set.has("sandbox_systems") ||
    set.has("emergent_gameplay")
  ) {
    avoid.add("very linear progression");
    avoid.add("heavily scripted paths");
  }
  if (set.has("survival_progression") && !set.has("horror_tension")) {
    avoid.add("pure jump-scare horror");
  }
  if (set.has("cozy_relaxation")) {
    avoid.add("high-pressure competitive grind");
  }
  if (set.has("meaningful_choices") && !set.has("cooperative_play")) {
    avoid.add("multiplayer-only dependencies");
  }

  const lowSimulation =
    (allScores.get("simulation_systems") ?? 0) < (allScores.get("player_freedom") ?? 0) * 0.35;
  if (set.has("player_freedom") && lowSimulation) {
    avoid.add("management-heavy micromanagement");
  }

  return [...avoid].slice(0, MAX_AVOID);
}

function buildRecommendationHints(topIds: MotivationId[]): string[] {
  const hints = new Set<string>();
  const set = new Set(topIds);

  if (set.has("player_freedom") || set.has("emergent_gameplay")) {
    hints.add("prioritize player agency over genre matching");
    hints.add("look for emergent gameplay");
  }
  if (set.has("meaningful_choices") || set.has("story_rich")) {
    hints.add("weight narrative consequence and player decisions");
  }
  if (set.has("sandbox_systems") || set.has("simulation_systems")) {
    hints.add("favor systems players can bend over time");
  }
  if (set.has("long_term_progression") || set.has("character_progression")) {
    hints.add("prefer games with durable progression arcs");
  }
  if (set.has("exploration")) {
    hints.add("surface worlds worth wandering without a checklist");
  }
  if (set.has("cooperative_play")) {
    hints.add("consider shared-session multiplayer fit");
  }

  if (hints.size === 0) {
    hints.add("match motivations behind playtime, not franchise clones");
  }

  return [...hints].slice(0, MAX_HINTS);
}

function collectLikes(topIds: MotivationId[]): string[] {
  const likes = new Set<string>();
  const phraseLists = topIds.map((id) => MOTIVATION_META[id].likePhrases);

  for (let round = 0; round < 2 && likes.size < MAX_LIKES; round += 1) {
    for (const phrases of phraseLists) {
      const phrase = phrases[round];
      if (!phrase) continue;
      likes.add(phrase);
      if (likes.size >= MAX_LIKES) return [...likes];
    }
  }

  return [...likes];
}

/** Deterministic Taste DNA v2 — motivation-level player profile. */
export function buildTasteDna(
  games: TasteDnaGameInput[],
  computedAt: string = new Date().toISOString()
): TasteDnaV2 {
  const ownedTitleNorms = games
    .map((game) => normalizeSteamGameTitle(game.title))
    .filter((norm) => norm.length > 0);

  const totalPlaytimeMin = games.reduce(
    (sum, game) => sum + Math.max(0, game.playtimeForever),
    0
  );
  const playedGames = games.filter(
    (game) => game.playtimeForever >= MIN_SIGNAL_PLAYTIME_MIN
  );

  const motivationScores = new Map<MotivationId, number>();
  const motivationEvidence = new Map<MotivationId, Map<string, number>>();

  for (const game of playedGames) {
    const norm = normalizeSteamGameTitle(game.title);
    const inferred = inferMotivationsForTitle(norm);
    const weight = playtimeWeight(game.playtimeForever);
    if (Object.keys(inferred).length === 0) continue;

    for (const [id, mult] of Object.entries(inferred) as [MotivationId, number][]) {
      const contribution = mult * weight;
      motivationScores.set(id, (motivationScores.get(id) ?? 0) + contribution);

      const evidenceMap = motivationEvidence.get(id) ?? new Map<string, number>();
      evidenceMap.set(game.title, (evidenceMap.get(game.title) ?? 0) + contribution);
      motivationEvidence.set(id, evidenceMap);
    }
  }

  const rankedMotivations = [...motivationScores.entries()].sort((a, b) => b[1] - a[1]);
  const maxScore = rankedMotivations[0]?.[1] ?? 0;
  const significantIds = rankedMotivations
    .filter(([, score]) => score >= maxScore * 0.55)
    .map(([id]) => id);
  const topIds = rankedMotivations
    .slice(0, MAX_MOTIVATIONS)
    .map(([id]) => id)
    .filter((id) => (motivationScores.get(id) ?? 0) > 0);
  const archetypeIds =
    significantIds.length > 0
      ? significantIds.slice(0, 6)
      : topIds;

  const coreMotivations: TasteDnaMotivation[] = topIds.map((id) => {
    const evidenceEntries = [...(motivationEvidence.get(id)?.entries() ?? [])].sort(
      (a, b) => b[1] - a[1]
    );
    return {
      trait: MOTIVATION_META[id].trait,
      confidence: roundConfidence(motivationScores.get(id) ?? 0, maxScore),
      evidence: evidenceEntries.slice(0, 3).map(([title]) => title),
      reason: MOTIVATION_META[id].reason,
    };
  });

  const favoriteSignals = [...playedGames]
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, MAX_FAVORITE_SIGNALS)
    .map((game) => game.title);

  return {
    version: TASTE_DNA_V2_VERSION,
    computedAt,
    playerArchetype: pickArchetype(archetypeIds),
    summary: buildSummary(topIds),
    coreMotivations,
    likes: collectLikes(archetypeIds.length > 0 ? archetypeIds : topIds),
    avoidLikely: buildAvoidLikely(topIds, motivationScores),
    recommendationHints: buildRecommendationHints(topIds),
    favoriteSignals,
    ownedTitleNorms,
    stats: {
      ownedCount: games.length,
      playedCount: playedGames.length,
      totalPlaytimeMin,
    },
  };
}
