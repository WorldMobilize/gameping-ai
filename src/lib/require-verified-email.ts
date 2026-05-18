import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  EMAIL_NOT_VERIFIED_MESSAGE,
  isEmailVerified,
} from "@/lib/auth-email-verification";

export { EMAIL_NOT_VERIFIED_MESSAGE };

export type RequireVerifiedUserResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

async function isAdminPlanUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  return profile?.plan === "admin";
}

function emailNotVerifiedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "email_not_verified",
      message: EMAIL_NOT_VERIFIED_MESSAGE,
    },
    { status: 403 }
  );
}

/** Logged-in users must have a verified email (admin plan exempt). */
export async function ensureUserEmailVerified(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (isEmailVerified(user)) {
    return { ok: true };
  }
  if (await isAdminPlanUser(supabase, user.id)) {
    return { ok: true };
  }
  return { ok: false, response: emailNotVerifiedResponse() };
}

/** Requires an authenticated user with verified email (admin exempt). */
export async function requireVerifiedUser(
  supabase: SupabaseClient
): Promise<RequireVerifiedUserResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const verified = await ensureUserEmailVerified(supabase, user);
  if (!verified.ok) {
    return { ok: false, response: verified.response };
  }

  return { ok: true, user };
}

/** For routes that allow anonymous access: block only when logged in but unverified. */
export async function blockUnverifiedLoggedInUser(
  supabase: SupabaseClient,
  user: User | null | undefined
): Promise<NextResponse | null> {
  if (!user) return null;
  const verified = await ensureUserEmailVerified(supabase, user);
  if (!verified.ok) return verified.response;
  return null;
}
