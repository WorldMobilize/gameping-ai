/**
 * GamePing Companion — desktop ask endpoint (public beta).
 *
 *   OPTIONS /api/companion/ask   → CORS preflight (204)
 *   POST    /api/companion/ask
 *     Auth:    Authorization: Bearer <supabase_access_token>  (NO cookies)
 *     Body:    { "message": string, "source"?: "desktop_companion",
 *                "responseMode"?: "text" | "video" | "image" | "music" }  (default "text")
 *     Success: { "answer": string, "media"?: { type, variant?, title?, url,
 *                thumbnailUrl?, embedUrl?, caption?, marker? } }
 *              `media` only appears in video/image/music mode AND when a lookup
 *              succeeded — media failures degrade to answer-only, never 5xx.
 *              Music reuses the YouTube lookup and returns `media.type: "music"`.
 *              For location/"where is" questions in image mode, media prefers a
 *              real game map (`variant: "map"`); `variant`/`marker` are optional.
 *     Errors:  { "error": string }  (400 / 401 / 500)
 *
 * Any authenticated GamePing user (free + premium) may call it — the Bearer
 * token is validated with Supabase `auth.getUser(token)` so non-browser clients
 * (the desktop Companion / its Rust proxy) work without a cookie session.
 * Stateless: no DB writes. The OpenAI key stays server-side. Does NOT touch
 * /auth/companion, the deep-link flow, Stripe, or premium gating.
 */
import {
  askCompanion,
  askCompanionForMedia,
  detectLocationIntent,
} from "@/lib/companion/ask";
import {
  authenticateCompanion,
  companionCorsHeaders,
  companionCorsJson,
} from "@/lib/companion/http";
import {
  findCompanionImage,
  findCompanionMapImage,
  findCompanionMusic,
  findCompanionVideo,
  imageRelevanceTerms,
} from "@/lib/companion/media-search";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LEN = 2000;

/** CORS preflight. */
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: companionCorsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  // Authenticate any GamePing user (free or premium) via Bearer token.
  const auth = await authenticateCompanion(req);
  if (!auth.ok) {
    return companionCorsJson(origin, { error: auth.error }, auth.status);
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const record = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;

  // Desktop sends `message`; accept legacy `question` too. Trim + length-check.
  const raw =
    typeof record.message === "string"
      ? record.message
      : typeof record.question === "string"
        ? record.question
        : "";
  const message = raw.trim();
  if (!message || message.length > MAX_MESSAGE_LEN) {
    return companionCorsJson(origin, { error: "Invalid message" }, 400);
  }

  // Optional media mode from the desktop overlay. Unknown/missing values fall
  // back to "text" so older clients keep working unchanged.
  const responseMode =
    record.responseMode === "video" ||
    record.responseMode === "image" ||
    record.responseMode === "music"
      ? record.responseMode
      : "text";

  if (responseMode === "text") {
    const result = await askCompanion(message);
    if (!result.ok) {
      return companionCorsJson(origin, { error: result.error }, result.status);
    }
    return companionCorsJson(origin, { answer: result.answer }, 200);
  }

  const result = await askCompanionForMedia(message, responseMode);
  if (!result.ok) {
    return companionCorsJson(origin, { error: result.error }, result.status);
  }

  // Best-effort media lookup: null (no result / upstream failure) degrades to
  // an answer-only response with the same 200 shape.
  let media;
  if (responseMode === "music") {
    media = await findCompanionMusic(result.searchQuery);
  } else if (responseMode === "video") {
    media = await findCompanionVideo(result.searchQuery);
  } else if (
    // Location intent (either the regex heuristic or the model's own
    // classification) → prefer a real game MAP over a generic place image.
    detectLocationIntent(message) ||
    result.mediaIntent === "map_location"
  ) {
    media = await findCompanionMapImage({
      query: result.searchQuery,
      wikiHost: result.wikiHost,
      mapLabel: result.mapLabel ?? result.subject,
      game: result.game,
    });
  } else {
    // Search by the specific subject (e.g. "stone axe"), and score candidate
    // images against the specific terms only (game name stripped) so a generic
    // page is rejected → answer-only rather than a random image.
    const imageQuery = result.subject?.trim() || result.searchQuery;
    const terms = imageRelevanceTerms(result.subject, result.searchQuery, result.game);
    media = await findCompanionImage(imageQuery, result.wikiHost, terms);
  }

  return companionCorsJson(
    origin,
    media ? { answer: result.answer, media } : { answer: result.answer },
    200
  );
}
