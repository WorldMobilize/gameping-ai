/**
 * Client-triggered generation for the premium personalization pages.
 *
 *   POST /api/premium/generate-mine   { "type": "weekly_picks" | "deals_for_you" | "monthly_recap" }
 *
 * Premium/admin only. The pages render instantly from cache; when there's no
 * cached content yet, the page shows a "Generating your picks" island that calls
 * this endpoint so the slow work (RAWG + pricing + OpenAI) happens OFF the page
 * render. Returns whether usable content now exists so the client can refresh.
 *
 * Reuses the existing generators + service-role cache. Does NOT touch
 * /api/recommend, billing, auth, or RLS.
 */
import { NextResponse } from "next/server";
import { resolvePremiumPageAccess } from "@/lib/discovery/premium-page-access";
import {
  ensureUserPremiumRotation,
  rotationHasContent,
} from "@/lib/discovery/ensure-premium-rotation";
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
  const type = body && typeof body === "object" ? (body as Record<string, unknown>).type : null;
  if (!isPremiumRotationType(type)) {
    return NextResponse.json(
      { error: "Invalid 'type'. Use 'weekly_picks', 'deals_for_you', or 'monthly_recap'." },
      { status: 400 }
    );
  }

  const result = await ensureUserPremiumRotation(access.userId, type);
  const hasContent = rotationHasContent(result.rotation);

  return NextResponse.json({
    ok: true,
    type,
    status: result.status,
    hasContent,
    // "insufficient" tells the client to show the "add more signal" state instead
    // of waiting for content that won't come.
    insufficient: !hasContent && result.status === "insufficient_data",
  });
}
