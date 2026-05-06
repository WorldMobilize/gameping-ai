import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
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