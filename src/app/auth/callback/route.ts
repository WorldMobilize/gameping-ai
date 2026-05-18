import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  VERIFY_SUCCESS_PATH,
  sanitizeAuthCallbackNext,
} from "@/lib/auth-redirects";
import { getSiteOrigin } from "@/lib/site-url";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const siteOrigin = getSiteOrigin(requestUrl.origin);
  const nextPath = sanitizeAuthCallbackNext(requestUrl.searchParams.get("next"));
  const successUrl = new URL(nextPath, siteOrigin);

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(successUrl);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(successUrl);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession", error);
    return NextResponse.redirect(new URL(VERIFY_SUCCESS_PATH, siteOrigin));
  }

  // Confirm email on Supabase, then require an explicit login.
  await supabase.auth.signOut();

  return response;
}
