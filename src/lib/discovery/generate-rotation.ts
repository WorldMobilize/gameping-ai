import "server-only";

import {
  curateHiddenGemsWithAi,
  curateWeeklyWithAi,
} from "@/lib/discovery/ai-curator";
import {
  getHiddenGemCandidatePool,
  getLiveHiddenGemPicks,
  getLiveWeeklyGamePicks,
  getWeeklyCandidatePool,
} from "@/lib/discovery/live-discovery";
import type {
  HiddenGemsRotationData,
  RotationSourceSummary,
  RotationType,
  WeeklyRotationData,
} from "@/lib/discovery/rotation-store";

/**
 * Curation pipeline that produces a rotation payload + a small source summary,
 * ready to be cached by the rotation store. This is the only "generation"
 * entrypoint the admin/cron route needs.
 *
 * Pipeline:  RAWG candidate pool → AI curator (best-effort) → deterministic
 * fallback. The AI curator selects from and writes editorial copy about the
 * REAL RAWG candidates (it never invents games/ids/images). If OpenAI is
 * unconfigured or the curation is too thin, we fall back to the deterministic
 * RAWG generator so generation never depends on OpenAI.
 *
 * Reuses the EXISTING RAWG + OpenAI integrations — no new API client, env var,
 * or key. This is NOT the recommendation pipeline. ITAD/price enrichment is left
 * for a later pass (price fields stay optional), so deal data is not fabricated.
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
      const pool = await getHiddenGemCandidatePool();

      const ai = await curateHiddenGemsWithAi(pool);
      if (ai) {
        return {
          ok: true,
          data: ai,
          sourceSummary: {
            source: "rawg",
            generator: "ai-curator:curateHiddenGemsWithAi",
            featuredCount: 1,
            itemCount: ai.picks.length,
            note: "AI-curated monthly hidden gems from the RAWG candidate pool. Price/deal enrichment not wired yet.",
          },
        };
      }

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
          note: "Deterministic hidden-gem rotation (AI curator unavailable). Price/deal enrichment not wired yet.",
        },
      };
    }

    const pool = await getWeeklyCandidatePool();

    const ai = await curateWeeklyWithAi(pool);
    if (ai) {
      return {
        ok: true,
        data: ai,
        sourceSummary: {
          source: "rawg",
          generator: "ai-curator:curateWeeklyWithAi",
          featuredCount: 1,
          itemCount: ai.picks.length,
          note: "AI-curated weekly mix from the RAWG candidate pool. ITAD/deal enrichment not wired yet.",
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
        note: "Deterministic weekly rotation (AI curator unavailable). ITAD/deal enrichment not wired yet.",
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown generation error",
    };
  }
}
