import "server-only";

import OpenAI from "openai";
import {
  buildPersonalGameFitPromptPayload,
  PERSONAL_GAME_FIT_SYSTEM_PROMPT,
} from "@/lib/personal-game-fit/build-game-fit-prompt";
import { parsePersonalGameFit } from "@/lib/personal-game-fit/parse-personal-game-fit";
import type {
  PersonalGameFit,
  PersonalGameFitGameMetadata,
} from "@/lib/personal-game-fit/types";
import type { TasteDnaV2 } from "@/lib/steam-library/taste-dna-types";

export async function generatePersonalGameFitWithAi(params: {
  tasteDna: TasteDnaV2;
  game: PersonalGameFitGameMetadata;
}): Promise<PersonalGameFit | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });
  const payload = buildPersonalGameFitPromptPayload(params);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PERSONAL_GAME_FIT_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    return parsePersonalGameFit(JSON.parse(raw));
  } catch (err) {
    console.error("[personal-game-fit] generate", err);
    return null;
  }
}
