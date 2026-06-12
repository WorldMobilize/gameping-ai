import { NextResponse } from "next/server";
import { getPersonalGameFitForUser } from "@/lib/personal-game-fit/get-personal-game-fit";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { getTasteDnaForUser } from "@/lib/steam-library/get-taste-dna";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function parseRawgId(value: string | null): number | null {
  if (!value?.trim()) return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireVerifiedUser(supabase);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug")?.trim();
    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const tasteDna = await getTasteDnaForUser({
      supabase,
      userId: auth.user.id,
    });

    if (!tasteDna) {
      return NextResponse.json({ hasPersonalFit: false, reason: "no_taste_dna" });
    }

    const result = await getPersonalGameFitForUser({
      userId: auth.user.id,
      tasteDna,
      gameSlug: slug,
      rawgId: parseRawgId(url.searchParams.get("rawgId")),
    });

    if (!result.ok) {
      if (result.reason === "no_taste_dna" || result.reason === "unsupported_dna_version") {
        return NextResponse.json({
          hasPersonalFit: false,
          reason: result.reason,
        });
      }

      if (result.reason === "game_not_found") {
        return NextResponse.json({ error: "game_not_found" }, { status: 404 });
      }

      return NextResponse.json({
        hasPersonalFit: false,
        reason: result.reason,
      });
    }

    return NextResponse.json({
      hasPersonalFit: true,
      fit: result.fit,
      fromCache: result.fromCache,
    });
  } catch (err) {
    console.error("[game/personal-fit] GET", err);
    return NextResponse.json(
      { error: "Could not load personal game fit." },
      { status: 500 }
    );
  }
}
