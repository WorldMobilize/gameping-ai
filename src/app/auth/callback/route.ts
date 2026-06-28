import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  POST_VERIFICATION_REDIRECT,
  sanitizeAuthCallbackNext,
} from "@/lib/auth-redirects";
import { getSiteOrigin } from "@/lib/site-url";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const siteOrigin = getSiteOrigin(requestUrl.origin);
  // No-session fallback (cross-device / expired link). Defaults to /verify-success.
  const fallbackUrl = new URL(
    sanitizeAuthCallbackNext(requestUrl.searchParams.get("next")),
    siteOrigin
  );

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(fallbackUrl);
  }

  const cookieStore = await cookies();
  // On success we keep Supabase's standard session and send the user to the
  // GamePing landing page. Session cookies set during the code exchange below
  // are attached to this response via setAll().
  const response = NextResponse.redirect(
    new URL(POST_VERIFICATION_REDIRECT, siteOrigin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    // Email is confirmed on Supabase, but no session could be established here
    // (e.g. the link was opened on a different device/browser than signup, so
    // the PKCE verifier is absent). Fall back to the verify-success page.
    console.error("[auth/callback] exchangeCodeForSession", error);
    return NextResponse.redirect(fallbackUrl);
  }

  // Standard Supabase auto-login: keep the session and send the user home.
  return response;
}
