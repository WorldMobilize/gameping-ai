import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth-email-verification";
import { getSiteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RESEND_COOLDOWN_MS = 60_000;
const lastResendByUser = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isEmailVerified(user)) {
      return NextResponse.json(
        {
          error: "already_verified",
          message: "Your email is already verified.",
        },
        { status: 400 }
      );
    }

    const email = user.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "no_email", message: "No email address on this account." },
        { status: 400 }
      );
    }

    const lastSent = lastResendByUser.get(user.id) ?? 0;
    if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Please wait a minute before requesting another verification email.",
        },
        { status: 429 }
      );
    }

    const requestOrigin =
      req.headers.get("origin") ?? new URL(req.url).origin ?? null;
    const redirectTo = `${getSiteOrigin(requestOrigin)}/login`;

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (resendError) {
      console.error("[resend-verification]", resendError);
      return NextResponse.json(
        {
          error: "resend_failed",
          message: resendError.message || "Could not send verification email.",
        },
        { status: 500 }
      );
    }

    lastResendByUser.set(user.id, Date.now());

    return NextResponse.json({
      ok: true,
      message: "Verification email sent. Check your inbox and spam folder.",
    });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "server_error", message: "Could not send verification email." },
      { status: 500 }
    );
  }
}
