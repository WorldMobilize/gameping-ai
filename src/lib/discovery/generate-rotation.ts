import "server-only";

import {
  getLiveHiddenGemPicks,
  getLiveWeeklyGamePicks,
} from "@/lib/discovery/live-discovery";
import type {
  HiddenGemsRotationData,
  RotationSourceSummary,
  RotationType,
  WeeklyRotationData,
} from "@/lib/discovery/rotation-store";

/**
 * Turns the existing RAWG-backed discovery generators (live-discovery.ts) into a
 * rotation payload + a small source summary, ready to be cached by the rotation
 * store. This is the only "generation" entrypoint the admin/cron route needs.
 *
 * Reuses the EXISTING RAWG integration — no new API client, env var, or key.
 * ITAD/price enrichment is intentionally left for a later pass (the generators
 * leave price fields optional), so deal data is not fabricated here.
 */

export type GenerateResult =
  | {
      ok: true;
      data: HiddenGemsRotationData | WeeklyRotationData;
      sourceSummary: RotationSourceSummary;
    }
  | { ok: false; error: string };

export async function generateRotationData(
  type: RotationType
): Promise<GenerateResult> {
  if (!process.env.RAWG_API_KEY?.trim()) {
    return { ok: false, error: "RAWG_API_KEY is not configured" };
  }

  try {
    if (type === "hidden_gems") {
      const live = await getLiveHiddenGemPicks();
      if (!live) {
        return {
          ok: false,
          error: "Not enough RAWG hidden-gem candidates passed the filters",
        };
      }
      return {
        ok: true,
        data: live,
        sourceSummary: {
          source: "rawg",
          generator: "live-discovery:getLiveHiddenGemPicks",
          featuredCount: 1,
          itemCount: live.picks.length,
          note: "Monthly hidden-gem rotation. Price/deal enrichment not wired yet.",
        },
      };
    }

    const live = await getLiveWeeklyGamePicks();
    if (!live) {
      return {
        ok: false,
        error: "Not enough RAWG weekly candidates passed the filters",
      };
    }
    return {
      ok: true,
      data: live,
      sourceSummary: {
        source: "rawg",
        generator: "live-discovery:getLiveWeeklyGamePicks",
        featuredCount: 1,
        itemCount: live.picks.length,
        note: "Weekly rotation. ITAD/deal enrichment not wired yet.",
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown generation error",
    };
  }
}
