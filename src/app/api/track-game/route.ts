import { NextResponse } from "next/server";
import { getTrackedGamesLimit } from "@/lib/plan-limits";
import {
  buildActiveCapLimitErrorPayload,
  buildLimitErrorPayload,
} from "@/lib/product-copy";
import {
  canActivateResourceRow,
  canCreateResourceRow,
} from "@/lib/plan-enforcement";
import { createClient } from "@/lib/supabase/server";
import {
  parseExplicitTargetPrice,
  parseTrackedBaselinePrice,
} from "@/lib/tracked-price-alerts";

export const runtime = "nodejs";

function normalizeTitleNorm(title: string) {
  return title.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to track prices for this game." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const titleRaw = typeof body.title === "string" ? body.title : "";
    const rawgId =
      typeof body.rawgId === "number"
        ? body.rawgId
        : typeof body.rawgId === "string"
          ? Number(body.rawgId)
          : undefined;
    const targetPriceRaw =
      typeof body.targetPrice === "number"
        ? body.targetPrice
        : typeof body.targetPrice === "string"
          ? Number(body.targetPrice)
          : undefined;
    const explicitTarget = parseExplicitTargetPrice(targetPriceRaw);

    const baselineRaw =
      typeof body.lastKnownPrice === "number"
        ? body.lastKnownPrice
        : typeof body.lastKnownPrice === "string"
          ? Number(body.lastKnownPrice)
          : typeof body.baselinePrice === "number"
            ? body.baselinePrice
            : typeof body.baselinePrice === "string"
              ? Number(body.baselinePrice)
              : undefined;
    const baselinePrice = parseTrackedBaselinePrice(baselineRaw);

    const title = titleRaw.trim();
    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Missing title." },
        { status: 400 }
      );
    }

    const title_norm = normalizeTitleNorm(title);

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = profile?.plan ?? "free";
    const trackLimit = getTrackedGamesLimit(plan);

    const { data: existingRow } = await supabase
      .from("tracked_games")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("title_norm", title_norm)
      .maybeSingle();

    if (!existingRow) {
      const gate = await canCreateResourceRow({
        supabase,
        userId: user.id,
        plan,
        resource: "tracked_games",
      });

      if (!gate.ok) {
        const payload =
          gate.reason === "active_limit"
            ? buildActiveCapLimitErrorPayload({
                error: "active_track_limit_reached",
                limitType: "tracked_games",
                limit: trackLimit,
              })
            : buildLimitErrorPayload({
                error: "track_limit_reached",
                limitType: "tracked_games",
                plan,
                limit: trackLimit,
              });
        return NextResponse.json({ ok: false, ...payload }, { status: 403 });
      }
    } else if (existingRow.is_active !== true) {
      const gate = await canActivateResourceRow({
        supabase,
        userId: user.id,
        plan,
        resource: "tracked_games",
      });

      if (!gate.ok) {
        const payload =
          gate.reason === "active_limit"
            ? buildActiveCapLimitErrorPayload({
                error: "active_track_limit_reached",
                limitType: "tracked_games",
                limit: trackLimit,
              })
            : buildLimitErrorPayload({
                error: "track_limit_reached",
                limitType: "tracked_games",
                plan,
                limit: trackLimit,
              });
        return NextResponse.json({ ok: false, ...payload }, { status: 403 });
      }
    }

    const row: Record<string, unknown> = {
      user_id: user.id,
      title,
      title_norm,
      is_active: true,
    };

    if (Number.isFinite(rawgId)) {
      row.rawg_id = rawgId;
    }

    row.target_price = explicitTarget;

    if (baselinePrice != null) {
      row.last_known_price = baselinePrice;
    }

    const { data: tracked, error } = await supabase
      .from("tracked_games")
      .upsert(row, { onConflict: "user_id,title_norm" })
      .select()
      .single();

    if (error) {
      console.error("[track-game]", error);
      return NextResponse.json(
        { ok: false, error: "Could not save tracking. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, tracked });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
