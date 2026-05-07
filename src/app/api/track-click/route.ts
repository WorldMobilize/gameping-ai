import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";
import { createClient as createCookieClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // Rate limit: 5 requests / 10 minutes per user (fallback to IP).
    let userId: string | null = null;
    try {
      const supabase = await createCookieClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {}

    const rl = await rateLimit({
      req,
      action: "email",
      limit: 5,
      windowMs: 10 * 60 * 1000,
      userId,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          action: "email",
          limit: rl.limit,
          resetAt: rl.resetAt,
        },
        { status: 429 }
      );
    }

    const { email, game } = await req.json();

    const { error } = await resend.emails.send({
      from: "GamePing <onboarding@resend.dev>",
      to: email,
      subject: "🔥 New game match for you",
      html: `
        <h2>We found a game for you 🎮</h2>
        <p><strong>${game.title}</strong></p>
        <p>Match: ${game.match}%</p>
        <p>${game.reason}</p>
      `,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}