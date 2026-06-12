export const TASTE_DNA_V1_VERSION = 1;
export const TASTE_DNA_V2_VERSION = 2;

/** Games below this playtime are ignored for taste signals. */
export const MIN_SIGNAL_PLAYTIME_MIN = 30;

export type TasteDnaGameInput = {
  title: string;
  playtimeForever: number;
};

export type TasteDnaStats = {
  ownedCount: number;
  playedCount: number;
  totalPlaytimeMin: number;
};

export type TasteDnaV1 = {
  version: typeof TASTE_DNA_V1_VERSION;
  computedAt: string;
  likes: string[];
  favoriteSignals: string[];
  ownedTitleNorms: string[];
  stats: TasteDnaStats;
};

export type TasteDnaMotivation = {
  trait: string;
  confidence: number;
  evidence: string[];
  reason: string;
};

export type TasteDnaV2 = {
  version: typeof TASTE_DNA_V2_VERSION;
  computedAt: string;
  playerArchetype: string;
  summary: string;
  coreMotivations: TasteDnaMotivation[];
  likes: string[];
  avoidLikely: string[];
  recommendationHints: string[];
  favoriteSignals: string[];
  ownedTitleNorms: string[];
  stats: TasteDnaStats;
  enrichedByAi?: boolean;
};

export type TasteDna = TasteDnaV1 | TasteDnaV2;

export function isTasteDnaV1(value: unknown): value is TasteDnaV1 {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const stats = record.stats;
  if (!stats || typeof stats !== "object") return false;
  const statsRecord = stats as Record<string, unknown>;

  return (
    record.version === TASTE_DNA_V1_VERSION &&
    typeof record.computedAt === "string" &&
    Array.isArray(record.likes) &&
    record.likes.every((item) => typeof item === "string") &&
    Array.isArray(record.favoriteSignals) &&
    record.favoriteSignals.every((item) => typeof item === "string") &&
    Array.isArray(record.ownedTitleNorms) &&
    record.ownedTitleNorms.every((item) => typeof item === "string") &&
    typeof statsRecord.ownedCount === "number" &&
    typeof statsRecord.playedCount === "number" &&
    typeof statsRecord.totalPlaytimeMin === "number"
  );
}

export function isTasteDnaV2(value: unknown): value is TasteDnaV2 {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const stats = record.stats;
  if (!stats || typeof stats !== "object") return false;
  const statsRecord = stats as Record<string, unknown>;

  if (
    record.version !== TASTE_DNA_V2_VERSION ||
    typeof record.computedAt !== "string" ||
    typeof record.playerArchetype !== "string" ||
    typeof record.summary !== "string" ||
    !Array.isArray(record.coreMotivations) ||
    !Array.isArray(record.likes) ||
    !Array.isArray(record.avoidLikely) ||
    !Array.isArray(record.recommendationHints) ||
    !Array.isArray(record.favoriteSignals) ||
    !Array.isArray(record.ownedTitleNorms)
  ) {
    return false;
  }

  for (const motivation of record.coreMotivations) {
    if (!motivation || typeof motivation !== "object") return false;
    const m = motivation as Record<string, unknown>;
    if (
      typeof m.trait !== "string" ||
      typeof m.confidence !== "number" ||
      typeof m.reason !== "string" ||
      !Array.isArray(m.evidence) ||
      !m.evidence.every((item) => typeof item === "string")
    ) {
      return false;
    }
  }

  return (
    typeof statsRecord.ownedCount === "number" &&
    typeof statsRecord.playedCount === "number" &&
    typeof statsRecord.totalPlaytimeMin === "number"
  );
}

export function isTasteDna(value: unknown): value is TasteDna {
  return isTasteDnaV1(value) || isTasteDnaV2(value);
}
