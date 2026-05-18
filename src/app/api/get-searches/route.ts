import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireVerifiedUser(supabase);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { data, error } = await supabase
      .from("search_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ searches: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}