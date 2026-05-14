import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getServiceRoleClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Whether the current user has an email/password identity (vs OAuth-only).
 * Used by account settings UI only; does not expose secrets.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let admin;
    try {
      admin = getServiceRoleClient();
    } catch {
      return NextResponse.json(
        { hasEmailPassword: true, email: user.email ?? null },
        { status: 200 }
      );
    }

    const { data, error } = await admin.auth.admin.getUserById(user.id);
    if (error || !data?.user) {
      return NextResponse.json(
        { hasEmailPassword: true, email: user.email ?? null },
        { status: 200 }
      );
    }

    const hasEmailPassword =
      data.user.identities?.some((i) => i.provider === "email") ?? false;

    return NextResponse.json({
      hasEmailPassword,
      email: data.user.email ?? null,
    });
  } catch (e) {
    console.error("[account-auth-hint]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
