import {
  PERSONAL_GAME_FIT_TIERS,
  type PersonalGameFit,
  type PersonalGameFitTier,
} from "@/lib/personal-game-fit/types";

const MAX_HEADLINE_CHARS = 160;
const MAX_BULLET_CHARS = 280;
const MAX_BULLETS = 4;

function trimText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trim()}…` : trimmed;
}

function trimBulletList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const value of values) {
    const bullet = trimText(value, MAX_BULLET_CHARS);
    if (!bullet) continue;
    out.push(bullet);
    if (out.length >= MAX_BULLETS) break;
  }
  return out;
}

function parseFitTier(value: unknown): PersonalGameFitTier | null {
  if (typeof value !== "string") return null;
  return PERSONAL_GAME_FIT_TIERS.includes(value as PersonalGameFitTier)
    ? (value as PersonalGameFitTier)
    : null;
}

function parseFitScore(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function parsePersonalGameFit(value: unknown): PersonalGameFit | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const fitTier = parseFitTier(record.fitTier);
  const fitScore = parseFitScore(record.fitScore);
  const headline = trimText(record.headline, MAX_HEADLINE_CHARS);

  if (!fitTier || fitScore === null || !headline) return null;

  return {
    fitTier,
    fitScore,
    headline,
    whyYouMayLike: trimBulletList(record.whyYouMayLike),
    potentialConcerns: trimBulletList(record.potentialConcerns),
  };
}

export function buildOwnedPersonalGameFit(gameTitle: string): PersonalGameFit {
  return {
    fitTier: "owned",
    fitScore: 100,
    headline: "Already in your Steam library",
    whyYouMayLike: [
      `You already own ${gameTitle} on Steam, so it clearly matched your taste at some point.`,
    ],
    potentialConcerns: [],
  };
}
