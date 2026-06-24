/**
 * Manual "Refresh picks" for the premium personalization pages.
 *
 *   POST /api/premium/refresh   { "type": "weekly_picks" | "deals_for_you" | "monthly_recap" }
 *
 * Premium/admin only (the same access resolver the pages use). Force-regenerates
 * the current-period rotation, guarded by a short cooldown so it can't be
 * spammed. Reuses the existing generators + service-role cache — it does NOT
 * touch /api/recommend, billing, auth, or RLS.
 */
import { NextResponse } from "next/server";
import { resolvePremiumPageAccess } from "@/lib/discovery/premium-page-access";
import { refreshUserPremiumRotation } from "@/lib/discovery/ensure-premium-rotation";
import { isPremiumRotationType } from "@/lib/discovery/user-rotation-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const access = await resolvePremiumPageAccess();
  if (!access.canViewPersonalized || !access.userId) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const type = (body && typeof body === "object" ? (body as Record<string, unknown>).type : null);
  if (!isPremiumRotationType(type)) {
    return NextResponse.json(
      { error: "Invalid 'type'. Use 'weekly_picks', 'deals_for_you', or 'monthly_recap'." },
      { status: 400 }
    );
  }

  const result = await refreshUserPremiumRotation(access.userId, type);

  if (result.status === "cooldown") {
    return NextResponse.json(
      { ok: false, status: "cooldown", retryAfterSec: result.retryAfterSec },
      { status: 429 }
    );
  }
  if (!result.ok) {
    const insufficient = result.status === "insufficient_data";
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        message: insufficient
          ? "Not enough data yet — import your Steam library, save a search, or track a game."
          : "Couldn't refresh right now. Please try again shortly.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, status: "generated" });
}
