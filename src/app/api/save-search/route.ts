import { NextResponse } from "next/server";
import { getSavedSearchesLimit } from "@/lib/plan-limits";
import { buildLimitErrorPayload } from "@/lib/product-copy";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { email, name, preferences, games } = body;

    if (!email) {
      return NextResponse.json(
        { error: "User not logged in" },
        { status: 401 }
      );
    }

    // 🔥 prendi piano utente
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = profile?.plan || "free";

    // 🔥 conta ricerche esistenti
    const { count } = await supabase
      .from("search_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const limit = getSavedSearchesLimit(plan);

    if ((count || 0) >= limit) {
      return NextResponse.json(
        buildLimitErrorPayload({
          error: "limit_reached",
          limitType: "saved_runs",
          plan,
          limit,
        }),
        { status: 403 }
      );
    }

    // salva
    const { error } = await supabase.from("search_profiles").insert({
      user_id: user.id,
      email,
      name,
      preferences,
      games,
    });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}