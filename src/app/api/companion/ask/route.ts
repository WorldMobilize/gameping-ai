/**
 * GamePing Companion — real endpoint (Alpha, admin-gated).
 *
 *   OPTIONS /api/companion/ask   → CORS preflight (204)
 *   POST    /api/companion/ask
 *     Auth:    Authorization: Bearer <supabase_access_token>  (NO cookies)
 *     Body:    { "message": string, "source"?: "desktop_companion" }
 *     Success: { "answer": string }
 *     Errors:  { "error": string }  (400 / 401 / 403 / 500)
 *
 * Token-based auth (validated with Supabase auth.getUser(token)) so non-browser
 * clients — the desktop Companion — can call it without a cookie session. For
 * now only profiles.plan === "admin" is allowed; other authenticated users get
 * 403. Stateless: no DB writes, no quotas, no billing. The OpenAI key stays
 * server-side. CORS is limited to a small allowlist (Tauri dev/prod + the site);
 * we reflect only known origins so combining it with Authorization stays safe.
 * Does NOT touch /auth/companion, the deep-link flow, Stripe, premium, etc.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askCompanion } from "@/lib/companion/ask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LEN = 2000;

/**
 * Small CORS allowlist. We reflect only these exact origins into
 * Access-Control-Allow-Origin (never `*`), which is what makes it safe to also
 * allow the Authorization header.
 */
const ALLOWED_ORIGINS = new Set([
  "http://localhost:1420", // Tauri dev server
  "http://tauri.localhost", // Tauri prod webview (Windows / Linux)
  "tauri://localhost", // Tauri prod webview (macOS)
  "https://gamepingai.com", // the website itself
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  // Only echo an allowed origin. Unknown origins get no ACAO header → the
  // browser blocks them, while non-browser callers (no Origin) are unaffected.
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** JSON response with CORS headers attached (used for success AND every error). */
function corsJson(origin: string | null, body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders(origin) });
}

/** Extract a Bearer token from the Authorization header, or null. */
function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : null;
}

/**
 * Anon-key client scoped to the caller's token. `auth.getUser(token)` validates
 * the JWT server-side, and the forwarded Authorization header means the profiles
 * read runs under the user's own RLS context.
 */
function getScopedClient(token: string) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** CORS preflight. */
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  const token = getBearerToken(req);
  if (!token) {
    return corsJson(origin, { error: "Unauthorized" }, 401);
  }

  const supabase = getScopedClient(token);
  if (!supabase) {
    return corsJson(origin, { error: "Auth is not configured." }, 500);
  }

  // Validate the token server-side.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user?.id) {
    return corsJson(origin, { error: "Unauthorized" }, 401);
  }

  // Admin-only for now (project convention for the Companion alpha).
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.plan !== "admin") {
    return corsJson(
      origin,
      { error: "Companion access is not enabled for this account" },
      403
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const record = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;

  // Desktop sends `message`; accept legacy `question` too. Trim + length-check.
  const raw =
    typeof record.message === "string"
      ? record.message
      : typeof record.question === "string"
        ? record.question
        : "";
  const message = raw.trim();
  if (!message || message.length > MAX_MESSAGE_LEN) {
    return corsJson(origin, { error: "Invalid message" }, 400);
  }

  const result = await askCompanion(message);
  if (!result.ok) {
    return corsJson(origin, { error: result.error }, result.status);
  }

  return corsJson(origin, { answer: result.answer }, 200);
}
