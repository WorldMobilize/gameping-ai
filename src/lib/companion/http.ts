/**
 * Shared HTTP helpers for the token-authenticated Companion endpoints
 * (`/api/companion/ask`, `/api/companion/me`, `/api/companion/releases/latest`).
 *
 * These endpoints are called by non-browser clients (the desktop Companion / its
 * Rust proxy) with `Authorization: Bearer <supabase_access_token>` and NO cookie
 * session. `authenticateCompanion` validates the JWT server-side with
 * `auth.getUser(token)`; any authenticated GamePing user is allowed (free +
 * premium). CORS reflects only a small origin allowlist (never `*`), which is
 * what makes it safe to also allow the Authorization header. The OpenAI/Supabase
 * keys stay server-side. Nothing here touches /auth/companion, the deep-link
 * flow, Stripe, or premium gating.
 */
import { NextResponse } from "next/server";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

/**
 * Small CORS allowlist. Only these exact origins are echoed into
 * Access-Control-Allow-Origin. Non-browser callers (no Origin header) are
 * unaffected — this only matters for the in-browser tester on the site.
 */
const ALLOWED_ORIGINS = new Set([
  "http://localhost:1420", // Tauri dev server
  "http://tauri.localhost", // Tauri prod webview (Windows / Linux)
  "tauri://localhost", // Tauri prod webview (macOS)
  "https://gamepingai.com", // the website itself
  "https://www.gamepingai.com", // www variant
]);

export function companionCorsHeaders(
  origin: string | null,
  methods = "POST, OPTIONS"
): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** JSON response with CORS headers attached (used for success AND every error). */
export function companionCorsJson(
  origin: string | null,
  body: unknown,
  status: number,
  methods = "POST, OPTIONS"
) {
  return NextResponse.json(body, {
    status,
    headers: companionCorsHeaders(origin, methods),
  });
}

/** Extract a Bearer token from the Authorization header, or null. */
export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : null;
}

/**
 * Anon-key client scoped to the caller's token. The forwarded Authorization
 * header means any table read runs under the user's own RLS context.
 */
function getScopedClient(token: string): SupabaseClient | null {
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

export type CompanionAuth =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; status: 401 | 500; error: string };

/**
 * Validate the Bearer token and return the user + a token-scoped Supabase
 * client. Any authenticated user passes (no admin/plan gate) — plan is read
 * separately by callers that need it (e.g. /me). 401 on missing/invalid token.
 */
export async function authenticateCompanion(req: Request): Promise<CompanionAuth> {
  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  const supabase = getScopedClient(token);
  if (!supabase) return { ok: false, status: 500, error: "Auth is not configured." };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user?.id) return { ok: false, status: 401, error: "Unauthorized" };

  return { ok: true, user, supabase };
}
