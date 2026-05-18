import { NextResponse } from "next/server";
import {
  buildActiveCapLimitErrorPayload,
  buildLimitErrorPayload,
} from "@/lib/product-copy";
import { getSavedSearchesLimit } from "@/lib/plan-limits";
import { canCreateResourceRow } from "@/lib/plan-enforcement";
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = profile?.plan || "free";
    const limit = getSavedSearchesLimit(plan);

    const gate = await canCreateResourceRow({
      supabase,
      userId: user.id,
      plan,
      resource: "search_profiles",
    });

    if (!gate.ok) {
      const payload =
        gate.reason === "active_limit"
          ? buildActiveCapLimitErrorPayload({
              error: "active_saved_run_limit_reached",
              limitType: "saved_runs",
              limit,
            })
          : buildLimitErrorPayload({
              error: "limit_reached",
              limitType: "saved_runs",
              plan,
              limit,
            });
      return NextResponse.json(payload, { status: 403 });
    }

    const { error } = await supabase.from("search_profiles").insert({
      user_id: user.id,
      email,
      name,
      preferences,
      games,
      is_active: true,
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
