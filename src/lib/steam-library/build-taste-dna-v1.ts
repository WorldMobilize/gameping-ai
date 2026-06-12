import { normalizeSteamGameTitle } from "@/lib/steam-library/title-norm";
import {
  MIN_SIGNAL_PLAYTIME_MIN,
  TASTE_DNA_V1_VERSION,
  type TasteDnaGameInput,
  type TasteDnaV1,
} from "@/lib/steam-library/taste-dna-types";

type TagWeights = Record<string, number>;

const MAX_LIKES = 5;
const MAX_FAVORITE_SIGNALS = 5;

function playtimeWeight(minutes: number): number {
  return Math.sqrt(Math.max(0, minutes));
}

function accumulateTags(
  scores: Map<string, number>,
  tags: TagWeights,
  weight: number
): void {
  for (const [tag, mult] of Object.entries(tags)) {
    scores.set(tag, (scores.get(tag) ?? 0) + mult * weight);
  }
}

function mergeTagWeight(tags: TagWeights, tag: string, weight: number): void {
  tags[tag] = Math.max(tags[tag] ?? 0, weight);
}

function inferTagsForTitle(norm: string): TagWeights {
  const tags: TagWeights = {};

  if (norm.includes("7 days to die")) {
    mergeTagWeight(tags, "Survival progression", 5);
    mergeTagWeight(tags, "Sandbox systems", 4);
    mergeTagWeight(tags, "Exploration", 2);
    mergeTagWeight(tags, "Long-term progression", 3);
  }
  if (norm.includes("fallout")) {
    mergeTagWeight(tags, "Open world RPGs", 5);
    mergeTagWeight(tags, "Player freedom", 4);
    mergeTagWeight(tags, "Story rich", 3);
    mergeTagWeight(tags, "Exploration", 2);
  }
  if (norm.includes("farming simulator")) {
    mergeTagWeight(tags, "Simulation", 5);
    mergeTagWeight(tags, "Management", 4);
  }
  if (norm.includes("phasmophobia")) {
    mergeTagWeight(tags, "Horror", 5);
    mergeTagWeight(tags, "Co-op", 4);
  }
  if (norm.includes("the sims")) {
    mergeTagWeight(tags, "Simulation", 4);
    mergeTagWeight(tags, "Sandbox systems", 3);
    mergeTagWeight(tags, "Cozy", 3);
    mergeTagWeight(tags, "Management", 2);
  }

  if (/\bsurvival\b|\bzombie\b|\bcraft(?:ing)?\b|\bpost[- ]apoc/.test(norm)) {
    mergeTagWeight(tags, "Survival progression", 2);
  }
  if (/\brpg\b|\brole[- ]playing\b/.test(norm)) {
    mergeTagWeight(tags, "Open world RPGs", 2);
  }
  if (/\bopen world\b|\bsandbox\b/.test(norm)) {
    mergeTagWeight(tags, "Sandbox systems", 2);
    mergeTagWeight(tags, "Player freedom", 2);
  }
  if (/\bstrateg/.test(norm)) {
    mergeTagWeight(tags, "Strategy", 2);
  }
  if (/\bhorror\b|\bscary\b|\bfear\b/.test(norm)) {
    mergeTagWeight(tags, "Horror", 2);
  }
  if (/\bsimulat|\bsimulator\b|\btycoon\b/.test(norm)) {
    mergeTagWeight(tags, "Simulation", 2);
    mergeTagWeight(tags, "Management", 1);
  }
  if (/\bco[- ]?op\b|\bmultiplayer\b/.test(norm)) {
    mergeTagWeight(tags, "Co-op", 2);
  }
  if (/\bexplor/.test(norm)) {
    mergeTagWeight(tags, "Exploration", 2);
  }
  if (/\bstory\b|\bnarrative\b|\bchoice\b/.test(norm)) {
    mergeTagWeight(tags, "Story rich", 2);
    mergeTagWeight(tags, "Player choice", 2);
  }
  if (/\bcozy\b|\brelax/.test(norm)) {
    mergeTagWeight(tags, "Cozy", 2);
  }

  return tags;
}

/** Legacy v1 builder — flat genre-style tags. */
export function buildTasteDnaV1(
  games: TasteDnaGameInput[],
  computedAt: string = new Date().toISOString()
): TasteDnaV1 {
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

  const tagScores = new Map<string, number>();

  for (const game of playedGames) {
    const norm = normalizeSteamGameTitle(game.title);
    const inferred = inferTagsForTitle(norm);
    if (Object.keys(inferred).length === 0) continue;
    accumulateTags(tagScores, inferred, playtimeWeight(game.playtimeForever));
  }

  const likes = [...tagScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LIKES)
    .map(([tag]) => tag);

  const favoriteSignals = [...playedGames]
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, MAX_FAVORITE_SIGNALS)
    .map((game) => game.title);

  return {
    version: TASTE_DNA_V1_VERSION,
    computedAt,
    likes,
    favoriteSignals,
    ownedTitleNorms,
    stats: {
      ownedCount: games.length,
      playedCount: playedGames.length,
      totalPlaytimeMin,
    },
  };
}
