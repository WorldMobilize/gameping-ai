import { NextResponse } from "next/server";
import {
  buildWelcomeEmailHtml,
  buildWelcomeEmailText,
  WELCOME_EMAIL_SUBJECT,
} from "@/lib/email/welcome-email";
import { resolveResendFrom } from "@/lib/resend-from";
import { getSiteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

/**
 * Best-effort welcome email. Never throws and never blocks profile creation:
 * any failure is logged and swallowed so signup always succeeds.
 */
async function sendWelcomeEmailBestEffort(params: {
  to: string;
  siteOrigin: string;
}): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) return;
    const fromResult = resolveResendFrom();
    if ("error" in fromResult) {
      console.error("[create-profile] welcome email from:", fromResult.error);
      return;
    }
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromResult.from,
      to: params.to,
      subject: WELCOME_EMAIL_SUBJECT,
      html: buildWelcomeEmailHtml({ siteOrigin: params.siteOrigin }),
      text: buildWelcomeEmailText({ siteOrigin: params.siteOrigin }),
    });
  } catch (err) {
    console.error("[create-profile] welcome email failed", err);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not logged in" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { email?: string };
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : user.email?.trim() ?? "";

    if (!email) {
      return NextResponse.json(
        { error: "Missing user data" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const isNewProfile = !existing;

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        email,
        plan: existing?.plan ?? "free",
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    // Welcome email only on first profile creation — best-effort, non-blocking.
    if (isNewProfile) {
      const siteOrigin = getSiteOrigin(
        req.headers.get("origin") ?? new URL(req.url).origin
      );
      await sendWelcomeEmailBestEffort({ to: email, siteOrigin });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}