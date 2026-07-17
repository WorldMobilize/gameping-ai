import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import {
  MAINTENANCE_MODE,
  isAdminOnlyPath,
  isMaintenanceExempt,
} from "@/lib/maintenance"
import { MAINTENANCE_HEADERS, maintenanceHtml } from "@/lib/maintenance-page"

/**
 * Is this request from an admin?
 *
 * Same check the rest of the app uses: `profiles.plan === "admin"`, read with the
 * caller's own session, so RLS still applies and nothing new is trusted here.
 *
 * Any failure — no session, no profile, Supabase unreachable — answers "not an
 * admin". During maintenance the safe default is to keep someone OUT, never to let
 * them in because a lookup broke.
 */
async function isAdmin(
  supabase: ReturnType<typeof createServerClient>
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()

    return profile?.plan === "admin"
  } catch {
    return false
  }
}

const COMPANION_API_PREFIX = "/api/companion/"

/**
 * Is this a Companion API call carrying an admin's Bearer token?
 *
 * The desktop app authenticates with `Authorization: Bearer <token>` and sends NO
 * cookies (see src/lib/companion/http.ts), so the cookie-based isAdmin() above can
 * never see it — during maintenance that answers "not an admin" for everyone and
 * locks even an admin out of their own app, which is how Companion ends up dead
 * while the site is down.
 *
 * Scoped deliberately narrow: Companion API paths only, admins only. Maintenance
 * still holds for every other Companion user, so this widens the door by exactly
 * one person and nothing else.
 *
 * Same failure posture as isAdmin(): anything that goes wrong answers "no".
 */
async function isCompanionAdminRequest(request: NextRequest): Promise<boolean> {
  if (!request.nextUrl.pathname.startsWith(COMPANION_API_PREFIX)) return false

  const header = request.headers.get("authorization")?.trim() ?? ""
  const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim()
  if (!token) return false

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser(token)
    if (!user) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()

    return profile?.plan === "admin"
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Touch auth to refresh cookies when needed.
  await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  /* ── Maintenance mode ──────────────────────────────────────────────────────
   * Off by default, and when it is off this costs one boolean — the profiles
   * lookup below only ever runs while the site is actually down.
   */
  if (MAINTENANCE_MODE && !isMaintenanceExempt(pathname)) {
    // Two ways to prove you are an admin: the cookie session (browser) or a Bearer
    // token (the desktop Companion, which has no cookies to offer).
    const admin =
      (await isAdmin(supabase)) || (await isCompanionAdminRequest(request))

    if (!admin) {
      // An API call must not be answered with an HTML page: the caller is code, and
      // it deserves a status it can act on.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "maintenance", message: "GamePing is under maintenance." },
          { status: 503, headers: { "Retry-After": "3600" } }
        )
      }

      // The page is SERVED here, at 503 — not redirected to.
      //
      // A redirect would send every indexed URL to a noindex page, which tells Google
      // those pages are gone and starts costing us rankings within days. 503 says
      // "temporarily down, keep what you have, come back" — the crawler holds the
      // index, and the visitor sees the same page either way. The URL they asked for
      // also stays in the address bar, so a reload lands them back on the real page
      // the moment maintenance ends.
      return new NextResponse(maintenanceHtml(), {
        status: 503,
        headers: MAINTENANCE_HEADERS,
      })
    }
  }

  /* ── Admin-only pages ──────────────────────────────────────────────────────
   * Not-ready pages (the Companion installer, Parties, Community Wars, the creator
   * programme) simply do not exist for anyone else. Rewriting to a path that has no
   * route makes Next serve the app's own 404 page WITH a 404 status — which the page
   * tree could not do on its own once streaming had started.
   */
  if (isAdminOnlyPath(pathname) && !(await isAdmin(supabase))) {
    const url = request.nextUrl.clone()
    url.pathname = "/_not-found"
    return NextResponse.rewrite(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on all routes except Next internals and static assets.
     * This keeps Supabase session cookies in sync for SSR/API routes, and is also
     * what makes maintenance mode airtight: every page passes through here, so no
     * route can forget to enforce it.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
}
