import { NextResponse } from "next/server";
import {
  buildActiveCapLimitErrorPayload,
  buildLimitErrorPayload,
} from "@/lib/product-copy";
import { getSavedSearchesLimit } from "@/lib/plan-limits";
import { canActivateResourceRow } from "@/lib/plan-enforcement";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const isActive = body.isActive === true;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

    const { data: row, error: rowErr } = await supabase
      .from("search_profiles")
      .select("id, is_active")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (rowErr || !row) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    if (isActive && row.is_active !== true) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = profile?.plan ?? "free";
      const limit = getSavedSearchesLimit(plan);
      const gate = await canActivateResourceRow({
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
        return NextResponse.json({ ok: false, ...payload }, { status: 403 });
      }
    }

    const { error: updErr } = await supabase
      .from("search_profiles")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updErr) {
      console.error("[set-saved-run-active]", updErr);
      return NextResponse.json(
        { ok: false, error: "Could not update saved run." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, is_active: isActive });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
