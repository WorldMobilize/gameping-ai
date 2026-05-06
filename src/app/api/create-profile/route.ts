import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { user_id, email } = await req.json();

    if (!user_id || !email) {
      return NextResponse.json(
        { error: "Missing user data" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id,
        email,
        plan: "free",
      },
      {
        onConflict: "user_id",
      }
    );

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