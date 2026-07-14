import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { MAINTENANCE_MODE, isMaintenanceExempt } from "@/lib/maintenance"
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
    const admin = await isAdmin(supabase)

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
