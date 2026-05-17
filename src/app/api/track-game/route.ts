import { NextResponse } from "next/server";
import { getTrackedGamesLimit, PLAN_LIMITS } from "@/lib/plan-limits";
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
      .select("id")
      .eq("user_id", user.id)
      .eq("title_norm", title_norm)
      .maybeSingle();

    if (!existingRow) {
      const { count: activeCount, error: countError } = await supabase
        .from("tracked_games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (countError) {
        console.error("[track-game] active count", countError);
        return NextResponse.json(
          { ok: false, error: "Could not verify tracking limit. Try again." },
          { status: 500 }
        );
      }

      if ((activeCount ?? 0) >= trackLimit) {
        const premiumCap = PLAN_LIMITS.premiumTrackedGames;
        const message =
          plan === "premium" || plan === "admin"
            ? `You can track up to ${trackLimit} active games on Premium. Pause or remove one on your dashboard to track another.`
            : `Free accounts can track up to ${trackLimit} active games. Upgrade to Premium for ${premiumCap}, or pause a game on your dashboard.`;

        return NextResponse.json(
          {
            ok: false,
            error: "track_limit_reached",
            message,
            limit: trackLimit,
          },
          { status: 403 }
        );
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
