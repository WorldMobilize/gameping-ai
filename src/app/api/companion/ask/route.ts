/**
 * GamePing Companion — real endpoint (Alpha, admin-gated).
 *
 *   POST /api/companion/ask
 *     Auth:    Authorization: Bearer <supabase_access_token>  (NO cookies)
 *     Body:    { "question": string, "context": { "source": "desktop_companion" } }
 *     Success: { "ok": true, "answer": string }
 *
 * Token-based auth (validated with Supabase auth.getUser(token)) so non-browser
 * clients — the desktop Companion — can call it without a cookie session. For
 * now only profiles.plan === "admin" is allowed; other authenticated users get
 * 403. Stateless: no DB writes, no quotas, no billing. The OpenAI key stays
 * server-side. Does NOT touch /api/recommend, Stripe, premium, or discovery.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askCompanion } from "@/lib/companion/ask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
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

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing bearer token." },
      { status: 401 }
    );
  }

  const supabase = getScopedClient(token);
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Auth is not configured." },
      { status: 500 }
    );
  }

  // Validate the token server-side.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user?.id) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired token." },
      { status: 401 }
    );
  }

  // Admin-only for now.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.plan !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin access required." },
      { status: 403 }
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

  const result = await askCompanion(record.question);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true, answer: result.answer });
}
