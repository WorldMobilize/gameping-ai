import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteSteamLibraryForUser,
  getSteamLibrarySummary,
} from "@/lib/steam-library/import-library";
import { requireSteamImportAccess } from "@/lib/steam-library/require-steam-import";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await requireSteamImportAccess(supabase);
    if (!access.ok) return access.response;

    const summary = await getSteamLibrarySummary({
      supabase,
      userId: access.user.id,
    });

    if (!summary) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      steamId: summary.steamId,
      profileUrl: summary.profileUrl,
      gameCount: summary.gameCount,
      totalPlaytimeMin: summary.totalPlaytimeMin,
      topGames: summary.topGames,
      importedAt: summary.importedAt,
    });
  } catch (err) {
    console.error("[steam/library] GET", err);
    return NextResponse.json(
      { error: "Could not load Steam library." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const access = await requireSteamImportAccess(supabase);
    if (!access.ok) return access.response;

    await deleteSteamLibraryForUser({
      supabase,
      userId: access.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[steam/library] DELETE", err);
    return NextResponse.json(
      { error: "Could not disconnect Steam library." },
      { status: 500 }
    );
  }
}
