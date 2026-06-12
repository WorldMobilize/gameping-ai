import "server-only";

import { generatePersonalGameFitWithAi } from "@/lib/personal-game-fit/generate-personal-game-fit";
import { loadPersonalFitGameMetadata } from "@/lib/personal-game-fit/load-game-metadata";
import {
  buildOwnedPersonalGameFit,
  parsePersonalGameFit,
} from "@/lib/personal-game-fit/parse-personal-game-fit";
import {
  getCachedPersonalGameFit,
  setCachedPersonalGameFit,
} from "@/lib/personal-game-fit/personal-game-fit-cache";
import { hashTasteDnaForFitCache } from "@/lib/personal-game-fit/taste-dna-hash";
import type { PersonalGameFit } from "@/lib/personal-game-fit/types";
import {
  isTasteDnaV2,
  TASTE_DNA_V2_VERSION,
  type TasteDnaV2,
} from "@/lib/steam-library/taste-dna-types";
import { normalizeSteamGameTitle } from "@/lib/steam-library/title-norm";

export type GetPersonalGameFitResult =
  | { ok: true; fit: PersonalGameFit; fromCache: boolean }
  | { ok: false; reason: "no_taste_dna" | "unsupported_dna_version" | "game_not_found" | "generation_failed" };

function isOwnedGame(tasteDna: TasteDnaV2, gameTitle: string): boolean {
  const norm = normalizeSteamGameTitle(gameTitle);
  if (!norm) return false;
  return tasteDna.ownedTitleNorms.includes(norm);
}

export async function getPersonalGameFitForUser(params: {
  userId: string;
  tasteDna: unknown;
  gameSlug: string;
  rawgId?: number | null;
}): Promise<GetPersonalGameFitResult> {
  if (!params.tasteDna || !isTasteDnaV2(params.tasteDna)) {
    return {
      ok: false,
      reason: params.tasteDna ? "unsupported_dna_version" : "no_taste_dna",
    };
  }

  const tasteDna = params.tasteDna;
  const game = await loadPersonalFitGameMetadata({
    slug: params.gameSlug,
    rawgId: params.rawgId,
  });

  if (!game) {
    return { ok: false, reason: "game_not_found" };
  }

  if (isOwnedGame(tasteDna, game.title)) {
    return { ok: true, fit: buildOwnedPersonalGameFit(game.title), fromCache: false };
  }

  const tasteDnaHash = hashTasteDnaForFitCache(tasteDna);
  const cached = await getCachedPersonalGameFit({
    userId: params.userId,
    rawgId: game.rawgId,
    tasteDnaHash,
  });

  if (cached) {
    return { ok: true, fit: cached, fromCache: true };
  }

  const generated = await generatePersonalGameFitWithAi({ tasteDna, game });
  if (!generated) {
    return { ok: false, reason: "generation_failed" };
  }

  const fit = parsePersonalGameFit(generated);
  if (!fit) {
    return { ok: false, reason: "generation_failed" };
  }

  await setCachedPersonalGameFit({
    userId: params.userId,
    rawgId: game.rawgId,
    gameTitle: game.title,
    tasteDnaVersion: TASTE_DNA_V2_VERSION,
    tasteDnaHash,
    fit,
  });

  return { ok: true, fit, fromCache: false };
}
