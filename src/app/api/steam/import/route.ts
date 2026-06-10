import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  importSteamLibraryForUser,
  STEAM_LIBRARY_PRIVATE_MESSAGE,
} from "@/lib/steam-library/import-library";
import { requireSteamImportAccess } from "@/lib/steam-library/require-steam-import";
import { SteamApiError } from "@/lib/steam-library/steam-api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const access = await requireSteamImportAccess(supabase);
    if (!access.ok) return access.response;

    const body = (await req.json()) as { profileInput?: string; profile?: string };
    const profileInput =
      (typeof body.profileInput === "string" ? body.profileInput : "") ||
      (typeof body.profile === "string" ? body.profile : "");
    const trimmed = profileInput.trim();

    if (!trimmed) {
      return NextResponse.json(
        { error: "Enter your Steam profile URL or Steam ID." },
        { status: 400 }
      );
    }

    const result = await importSteamLibraryForUser({
      supabase,
      userId: access.user.id,
      profileInput: trimmed,
    });

    return NextResponse.json({
      ok: true,
      steamId: result.steamId,
      profileUrl: result.profileUrl,
      gameCount: result.gameCount,
      totalPlaytimeMin: result.totalPlaytimeMin,
      topGames: result.topGames,
      importedAt: result.importedAt,
    });
  } catch (err) {
    if (err instanceof SteamApiError) {
      if (err.code === "library_unavailable" || err.code === "profile_private") {
        return NextResponse.json(
          { error: STEAM_LIBRARY_PRIVATE_MESSAGE },
          { status: 400 }
        );
      }
      if (err.code === "missing_api_key") {
        console.error("[steam/import] missing STEAM_WEB_API_KEY");
        return NextResponse.json(
          { error: "Steam import is not configured on this server." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.error("[steam/import]", err);
    return NextResponse.json(
      { error: "Could not import Steam library. Try again in a moment." },
      { status: 500 }
    );
  }
}
