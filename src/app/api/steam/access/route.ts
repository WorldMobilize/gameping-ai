import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  canUseSteamImport,
  isSteamImportEnabled,
} from "@/lib/steam-library/access";

export const runtime = "nodejs";

/** Returns whether the Steam import UI should be shown for the current user. */
export async function GET() {
  if (!isSteamImportEnabled()) {
    return NextResponse.json({ visible: false, canImport: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ visible: false, canImport: false });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = profile?.plan ?? "free";
  const canImport = canUseSteamImport(plan);

  return NextResponse.json({
    visible: canImport,
    canImport,
  });
}
