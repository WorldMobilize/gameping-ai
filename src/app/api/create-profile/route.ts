import { NextResponse } from "next/server";
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

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Missing user data" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
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