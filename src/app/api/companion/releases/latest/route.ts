/**
 * GamePing Companion — latest Windows release metadata (public).
 *
 *   GET /api/companion/releases/latest
 *     Success: { platform, version, url, sha256, published_at }
 *     404 { "error": "No release configured" } when no installer URL is set.
 *
 * Env-driven so the desktop auto-updater / site can read one source of truth:
 *   NEXT_PUBLIC_COMPANION_WINDOWS_URL   installer URL (Supabase Storage public object)
 *   NEXT_PUBLIC_COMPANION_VERSION       e.g. "0.1.2"
 *   COMPANION_WINDOWS_SHA256            optional integrity hash
 *   COMPANION_RELEASE_PUBLISHED_AT      optional ISO timestamp
 */
import { companionCorsHeaders } from "@/lib/companion/http";
import { COMPANION_VERSION, COMPANION_WINDOWS_URL } from "@/lib/companion/release";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: companionCorsHeaders(req.headers.get("origin"), METHODS),
  });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  const url = COMPANION_WINDOWS_URL;
  const version = COMPANION_VERSION;
  const sha256 = process.env.COMPANION_WINDOWS_SHA256?.trim() || null;
  const publishedAt = process.env.COMPANION_RELEASE_PUBLISHED_AT?.trim() || null;

  if (!url) {
    return NextResponse.json(
      { error: "No release configured" },
      { status: 404, headers: companionCorsHeaders(origin, METHODS) }
    );
  }

  return NextResponse.json(
    {
      platform: "windows",
      version,
      url,
      sha256,
      published_at: publishedAt,
    },
    { status: 200, headers: companionCorsHeaders(origin, METHODS) }
  );
}
