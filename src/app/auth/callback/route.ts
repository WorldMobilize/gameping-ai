import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sanitizeAuthCallbackNext } from "@/lib/auth-redirects";
import { getSiteOrigin } from "@/lib/site-url";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const siteOrigin = getSiteOrigin(requestUrl.origin);
  // Terminal verification page. Defaults to /verify-success and is used for both
  // the success and the no-session fallback (cross-device / expired link) cases.
  const verifyUrl = new URL(
    sanitizeAuthCallbackNext(requestUrl.searchParams.get("next")),
    siteOrigin
  );

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(verifyUrl);
  }

  const cookieStore = await cookies();
  // On success we keep Supabase's standard session and land the user on the
  // dedicated /verify-success page (not the landing page) so the email tab reads
  // as a clear terminal confirmation. Session cookies set during the code
  // exchange below are attached to this response via setAll().
  const response = NextResponse.redirect(verifyUrl);

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
    return NextResponse.redirect(verifyUrl);
  }

  // Standard Supabase auto-login: keep the session and show the terminal
  // /verify-success confirmation page.
  return response;
}
