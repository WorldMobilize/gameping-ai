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
 * Rules:
 *   - at least MIN_ITEMS usable picks (incl. featured)
 *   - every pick has a title + slug/id + image
 *   - no duplicate titles (deduped, keeping first)
 *   - Hidden Gems: drop any blocked obvious/famous title
 *   - core editorial text fields are non-empty
 */

const MIN_ITEMS = 6;

export type ValidationResult<T> =
  | { ok: true; data: { featured: T; picks: T[] }; warnings: string[] }
  | { ok: false; errors: string[] };

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hiddenGemUsable(p: HiddenGemPick): boolean {
  return (
    hasText(p.title) &&
    (hasText(p.slug) || typeof p.gameId === "number" || hasText(p.id)) &&
    hasText(p.image) &&
    hasText(p.reason) &&
    hasText(p.bestFor) &&
    !isBlockedTitle(p.title)
  );
}

function weeklyUsable(p: WeeklyGamePick): boolean {
  return (
    hasText(p.title) &&
    (hasText(p.slug) || typeof p.gameId === "number" || hasText(p.id)) &&
    hasText(p.image) &&
    hasText(p.whyThisWeek) &&
    hasText(p.category)
  );
}

function dedupeByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
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
):
  | ValidationResult<HiddenGemPick>
  | ValidationResult<WeeklyGamePick> {
  const warnings: string[] = [];

  if (type === "hidden_gems") {
    const d = data as HiddenGemsRotationData;
    const all = [d.featured, ...d.picks].filter(Boolean) as HiddenGemPick[];
    const usable = dedupeByTitle(all.filter(hiddenGemUsable));
    const dropped = all.length - usable.length;
    if (dropped > 0) warnings.push(`${dropped} hidden-gem item(s) dropped (invalid/blocked/duplicate)`);
    if (usable.length < MIN_ITEMS) {
      return {
        ok: false,
        errors: [
          `Only ${usable.length} valid hidden-gem picks (need ${MIN_ITEMS}).`,
        ],
      };
    }
    return {
      ok: true,
      data: { featured: usable[0], picks: usable.slice(1) },
      warnings,
    };
  }

  const d = data as WeeklyRotationData;
  const all = [d.featured, ...d.picks].filter(Boolean) as WeeklyGamePick[];
  const usable = dedupeByTitle(all.filter(weeklyUsable));
  const dropped = all.length - usable.length;
  if (dropped > 0) warnings.push(`${dropped} weekly item(s) dropped (invalid/duplicate)`);
  if (usable.length < MIN_ITEMS) {
    return {
      ok: false,
      errors: [`Only ${usable.length} valid weekly picks (need ${MIN_ITEMS}).`],
    };
  }
  return {
    ok: true,
    data: { featured: usable[0], picks: usable.slice(1) },
    warnings,
  };
}
