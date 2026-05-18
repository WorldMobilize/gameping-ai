import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireVerifiedUser(supabase);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = (await req.json()) as { id?: string };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

    const { data: owned, error: lookupErr } = await supabase
      .from("tracked_games")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupErr) {
      console.error("[delete-tracked-game] lookup", lookupErr);
      return NextResponse.json(
        { ok: false, error: "Could not remove tracking." },
        { status: 500 }
      );
    }

    if (!owned) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    const admin = getServiceSupabase();
    if (!admin) {
      console.error("[delete-tracked-game] missing service credentials");
      return NextResponse.json(
        { ok: false, error: "Server misconfiguration." },
        { status: 500 }
      );
    }

    const { error } = await admin
      .from("tracked_games")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[delete-tracked-game]", error);
      return NextResponse.json(
        { ok: false, error: "Could not remove tracking." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
