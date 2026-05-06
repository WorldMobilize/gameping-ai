import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { user_id, email, name, preferences, games } = body;

    if (!user_id || !email) {
      return NextResponse.json(
        { error: "User not logged in" },
        { status: 401 }
      );
    }

    // 🔥 prendi piano utente
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user_id)
      .single();

    const plan = profile?.plan || "free";

    // 🔥 conta ricerche esistenti
    const { count } = await supabase
      .from("search_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id);

    // 🔥 limite
    const limit = plan === "premium" ? 3 : 1;

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: "Upgrade to Premium to save more searches" },
        { status: 403 }
      );
    }

    // salva
    const { error } = await supabase.from("search_profiles").insert({
      user_id,
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