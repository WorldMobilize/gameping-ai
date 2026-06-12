import "server-only";

import { getCachedRawgGame, setCachedRawgGame } from "@/lib/cache";
import { compactGameDescription } from "@/lib/personal-game-fit/build-game-fit-prompt";
import type { PersonalGameFitGameMetadata } from "@/lib/personal-game-fit/types";

type RawgGamePayload = {
  id: number;
  name: string;
  description_raw?: string;
  genres?: { name: string }[];
  tags?: { name: string }[];
};

export async function loadPersonalFitGameMetadata(params: {
  slug: string;
  rawgId?: number | null;
}): Promise<PersonalGameFitGameMetadata | null> {
  const title = decodeURIComponent(params.slug).trim();
  if (!title) return null;

  const slugKey = encodeURIComponent(title.toLowerCase());
  let payload = await getCachedRawgGame<RawgGamePayload>(slugKey);

  if (!payload?.id) {
    const apiKey = process.env.RAWG_API_KEY?.trim();
    if (!apiKey) return null;

    try {
      if (params.rawgId) {
        const detailRes = await fetch(
          `https://api.rawg.io/api/games/${params.rawgId}?key=${apiKey}`,
          { cache: "no-store" }
        );
        if (detailRes.ok) {
          payload = await detailRes.json();
        }
      }

      if (!payload?.id) {
        const searchRes = await fetch(
          `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(title)}&page_size=1`,
          { cache: "no-store" }
        );
        const searchData = await searchRes.json();
        const firstGame = searchData.results?.[0];
        if (!firstGame?.id) return null;

        const detailRes = await fetch(
          `https://api.rawg.io/api/games/${firstGame.id}?key=${apiKey}`,
          { cache: "no-store" }
        );
        if (!detailRes.ok) return null;
        payload = await detailRes.json();
      }

      if (payload?.id) {
        try {
          await setCachedRawgGame({
            slug: slugKey,
            title,
            rawgPayload: payload,
          });
        } catch {
          /* cache best-effort */
        }
      }
    } catch {
      return null;
    }
  }

  if (!payload?.id || !payload.name) return null;

  return {
    rawgId: payload.id,
    title: payload.name,
    genres: (payload.genres ?? []).map((genre) => genre.name).filter(Boolean),
    tags: (payload.tags ?? []).map((tag) => tag.name).filter(Boolean),
    description: compactGameDescription(payload.description_raw ?? ""),
  };
}
