import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { getTasteDnaForUser } from "@/lib/steam-library/get-taste-dna";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await requireVerifiedUser(supabase);
    if (!auth.ok) return auth.response;

    const tasteDna = await getTasteDnaForUser({
      supabase,
      userId: auth.user.id,
    });

    if (!tasteDna) {
      return NextResponse.json({ hasTasteDna: false });
    }

    return NextResponse.json({ hasTasteDna: true, tasteDna });
  } catch (err) {
    console.error("[steam/taste-dna] GET", err);
    return NextResponse.json(
      { error: "Could not load Taste DNA." },
      { status: 500 }
    );
  }
}
