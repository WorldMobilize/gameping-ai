import "server-only";

import { isBlockedTitle } from "@/lib/discovery/live-discovery";
import type {
  HiddenGemsRotationData,
  RotationType,
  WeeklyRotationData,
} from "@/lib/discovery/rotation-store";
import type {
  HiddenGemPick,
  WeeklyGamePick,
} from "@/lib/discovery/curated-picks";

/**
 * Pre-publish validation for a generated rotation. A rotation must clear this
 * before it can replace the live published one — if it fails, the caller records
 * a failed status and the previous published rotation stays active.
 *
 * Rules (drop the item if any fail):
 *   - title + slug/id + image
 *   - Hidden Gems: not a blocked/too-famous title
 *   - required editorial fields are non-empty:
 *       Hidden Gems     → hook, whyHidden, whoFor, discoveryTag, confidence
 *       Games of Week   → hook, whyThisWeek, reasonType, whoFor, confidence
 *   - no duplicate titles (keep first)
 * Then require at least MIN_ITEMS usable picks (incl. featured).
 *
 * Soft signals are surfaced as `warnings` (generic copy, low reasonType variety)
 * and dropped items as `rejected` — both admin/cron-only QA aids, never public.
 */

const MIN_ITEMS = 6;
const MAX_REJECTED_EXAMPLES = 10;

// Generic filler that doesn't justify a pick. Warned, not hard-failed, so the
// deterministic fallback copy can still publish if the AI is unavailable.
const GENERIC_PHRASES = [
  "worth a look",
  "worth checking out",
  "great gameplay",
  "fans will enjoy",
  "a must-play",
  "must play",
  "something for everyone",
  "great game",
  "good game",
  "you'll love it",
];

// --- GOTW quality tightening ----------------------------------------------
// Huge franchises / hyped IPs that must NOT ride on hype: a weekly pick from one
// of these is only justified by a concrete this-week reason (date/update/deal/
// event). Substring match on the normalized title (catches sequels/subtitles).
const WEEKLY_HUGE_FRANCHISES = [
  "resident evil", "final fantasy", "life is strange", "call of duty", "zelda",
  "grand theft auto", "gta", "assassins creed", "elder scrolls", "fallout",
  "god of war", "halo", "the last of us", "spider man", "spider-man", "mario",
  "pokemon", "metroid", "far cry", "dragon age", "mass effect", "diablo",
  "elden ring", "the witcher", "horizon", "ghost of", "cyberpunk", "battlefield",
  "star wars", "metal gear", "silent hill", "monster hunter", "dragon quest",
  "kingdom hearts", "persona", "tomb raider", "forza", "gran turismo",
];

// A concrete, datable this-week reason. If a huge-franchise pick has NONE of
// these signals in its "why this week" copy, it's hype-driven → reject.
const CONCRETE_REASON_RE =
  /\b(releas|launch|out now|available now|drop|update|patch|hotfix|dlc|expansion|season|deal|sale|discount|free|early access|anniversar|event|remaster|remake|return|today|this week|this month|now playable|new content)\w*\b/i;
const DATE_HINT_RE =
  /\b(20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

// Marketing hype with no substance — flagged when it's the whole pitch.
const HYPE_PHRASES = [
  "most anticipated",
  "highly anticipated",
  "hotly anticipated",
  "long-awaited",
  "long awaited",
  "can't wait",
  "cannot wait",
  "biggest release",
  "biggest game",
  "blockbuster",
  "fans are hyped",
  "everyone is talking about",
  "game of the year contender",
  "epic adventure",
];

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isHugeFranchise(title: string): boolean {
  const n = normalizeTitle(title);
  return WEEKLY_HUGE_FRANCHISES.some((f) => n.includes(normalizeTitle(f)));
}

function hasConcreteReason(text: string | undefined): boolean {
  if (!text) return false;
  return CONCRETE_REASON_RE.test(text) || DATE_HINT_RE.test(text);
}

function looksHype(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return HYPE_PHRASES.some((p) => t.includes(p));
}

export type RejectedExample = { title: string; reason: string };

export type ValidationResult<T> =
  | {
      ok: true;
      data: { featured: T; picks: T[] };
      warnings: string[];
      rejected: RejectedExample[];
    }
  | { ok: false; errors: string[]; warnings: string[]; rejected: RejectedExample[] };

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function looksGeneric(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return GENERIC_PHRASES.some((p) => t.includes(p));
}

/** Reason this hidden-gem pick is unusable, or null if it passes. */
function hiddenGemReject(p: HiddenGemPick): string | null {
  if (!hasText(p.title)) return "missing title";
  if (!(hasText(p.slug) || typeof p.gameId === "number" || hasText(p.id)))
    return "missing slug/id";
  if (!hasText(p.image)) return "missing image";
  if (isBlockedTitle(p.title)) return "blocked/too-famous title";
  if (!hasText(p.hook)) return "empty hook";
  if (!hasText(p.whyHidden)) return "empty whyHidden";
  if (!hasText(p.whoFor)) return "empty whoFor";
  if (!hasText(p.discoveryTag)) return "empty discoveryTag";
  if (!hasNumber(p.confidence)) return "missing confidence";
  return null;
}

/** Reason this weekly pick is unusable, or null if it passes. */
function weeklyReject(p: WeeklyGamePick): string | null {
  if (!hasText(p.title)) return "missing title";
  if (!(hasText(p.slug) || typeof p.gameId === "number" || hasText(p.id)))
    return "missing slug/id";
  if (!hasText(p.image)) return "missing image";
  if (!hasText(p.category)) return "missing category";
  if (!hasText(p.hook)) return "empty hook";
  if (!hasText(p.whyThisWeek)) return "empty whyThisWeek";
  if (!hasText(p.reasonType)) return "empty reasonType";
  if (!hasText(p.whoFor)) return "empty whoFor";
  if (!hasNumber(p.confidence)) return "missing confidence";
  return null;
}

function dedupeByTitle<T extends { title: string }>(
  items: T[],
  rejected: RejectedExample[]
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      pushRejected(rejected, item.title, "duplicate title");
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

function pushRejected(rejected: RejectedExample[], title: string, reason: string) {
  if (rejected.length >= MAX_REJECTED_EXAMPLES) return;
  rejected.push({ title: title?.trim() || "(untitled)", reason });
}

export function validateRotation(
  type: "hidden_gems",
  data: HiddenGemsRotationData
): ValidationResult<HiddenGemPick>;
export function validateRotation(
  type: "games_of_the_week",
  data: WeeklyRotationData
): ValidationResult<WeeklyGamePick>;
export function validateRotation(
  type: RotationType,
  data: HiddenGemsRotationData | WeeklyRotationData
): ValidationResult<HiddenGemPick> | ValidationResult<WeeklyGamePick> {
  const warnings: string[] = [];
  const rejected: RejectedExample[] = [];

  if (type === "hidden_gems") {
    const d = data as HiddenGemsRotationData;
    const all = [d.featured, ...d.picks].filter(Boolean) as HiddenGemPick[];

    const passing: HiddenGemPick[] = [];
    for (const p of all) {
      const reason = hiddenGemReject(p);
      if (reason) pushRejected(rejected, p.title, reason);
      else passing.push(p);
    }
    const usable = dedupeByTitle(passing, rejected);

    const genericCount = usable.filter((p) => looksGeneric(p.whyHidden)).length;
    if (genericCount > 0) warnings.push(`${genericCount} hidden-gem pick(s) have generic copy`);
    if (rejected.length > 0) warnings.push(`${rejected.length} hidden-gem item(s) rejected`);

    if (usable.length < MIN_ITEMS) {
      return {
        ok: false,
        errors: [`Only ${usable.length} valid hidden-gem picks (need ${MIN_ITEMS}).`],
        warnings,
        rejected,
      };
    }
    return {
      ok: true,
      data: { featured: usable[0], picks: usable.slice(1) },
      warnings,
      rejected,
    };
  }

  const d = data as WeeklyRotationData;
  const all = [d.featured, ...d.picks].filter(Boolean) as WeeklyGamePick[];

  const passing: WeeklyGamePick[] = [];
  for (const p of all) {
    const reason = weeklyReject(p);
    if (reason) {
      pushRejected(rejected, p.title, reason);
      continue;
    }
    // GOTW tightening: a huge-franchise / hyped IP with no concrete this-week
    // reason (date/update/deal/event) is hype-driven filler → drop it.
    if (isHugeFranchise(p.title) && !hasConcreteReason(p.whyThisWeek)) {
      pushRejected(rejected, p.title, "huge franchise with no concrete this-week reason");
      continue;
    }
    passing.push(p);
  }
  const usable = dedupeByTitle(passing, rejected);

  const genericCount = usable.filter((p) => looksGeneric(p.whyThisWeek)).length;
  if (genericCount > 0) warnings.push(`${genericCount} weekly pick(s) have generic "why this week" copy`);

  // Hype copy: concrete-reason-free marketing language is a soft signal.
  const hypeCount = usable.filter((p) => looksHype(p.whyThisWeek) && !hasConcreteReason(p.whyThisWeek)).length;
  if (hypeCount > 0) warnings.push(`${hypeCount} weekly pick(s) read as marketing hype, not a concrete weekly reason`);

  // Reason-type variety: warn if one reasonType dominates the mix.
  const counts = new Map<string, number>();
  for (const p of usable) {
    const key = (p.reasonType ?? "unknown").toString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const topReason = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topReason && usable.length >= 4 && topReason[1] > Math.ceil(usable.length * 0.6)) {
    warnings.push(`low reasonType variety: ${topReason[1]}/${usable.length} are "${topReason[0]}"`);
  }

  // Upcoming-watch dominance: a weekly mix that's mostly unreleased titles is too
  // hype/wishlist-driven. Warn past ~one third of the list.
  const upcomingCount = counts.get("upcoming-watch") ?? 0;
  if (usable.length >= 4 && upcomingCount > Math.ceil(usable.length / 3)) {
    warnings.push(`too many "upcoming-watch" picks: ${upcomingCount}/${usable.length} are unreleased/watch items`);
  }

  if (rejected.length > 0) warnings.push(`${rejected.length} weekly item(s) rejected`);

  if (usable.length < MIN_ITEMS) {
    return {
      ok: false,
      errors: [`Only ${usable.length} valid weekly picks (need ${MIN_ITEMS}).`],
      warnings,
      rejected,
    };
  }
  return {
    ok: true,
    data: { featured: usable[0], picks: usable.slice(1) },
    warnings,
    rejected,
  };
}
