import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { canUseSteamImport, isSteamImportEnabled } from "@/lib/steam-library/access";
import { requireVerifiedUser } from "@/lib/require-verified-email";

export type SteamImportAccessResult =
  | { ok: true; user: User; plan: string }
  | { ok: false; response: NextResponse };

export async function requireSteamImportAccess(
  supabase: SupabaseClient
): Promise<SteamImportAccessResult> {
  if (!isSteamImportEnabled()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "feature_disabled" }, { status: 404 }),
    };
  }

  const auth = await requireVerifiedUser(supabase);
  if (!auth.ok) return auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const plan = profile?.plan ?? "free";
  if (!canUseSteamImport(plan)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user: auth.user, plan };
}
