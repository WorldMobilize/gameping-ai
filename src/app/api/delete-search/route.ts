import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, user_id } = await req.json();

    if (!id || !user_id) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("search_profiles")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

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