import { NextResponse } from "next/server";
import {
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_USER_AGENT_MAX,
  isFeedbackType,
  isValidOptionalFeedbackEmail,
  normalizeFeedbackPageUrl,
  resolveFeedbackContextArea,
} from "@/lib/feedback";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function truncate(value: string | null, max: number): string | null {
  if (!value) return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

export async function POST(req: Request) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength) {
      const n = Number(contentLength);
      if (Number.isFinite(n) && n > 32_000) {
        return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
      }
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rl = await rateLimit({
      req,
      action: "feedback",
      limit: 8,
      windowMs: 15 * 60 * 1000,
      userId: user?.id ?? null,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const typeRaw = typeof body.type === "string" ? body.type.trim() : "";
    const type = isFeedbackType(typeRaw) ? typeRaw : "other";

    const messageRaw = typeof body.message === "string" ? body.message.trim() : "";
    if (!messageRaw) {
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }
    if (messageRaw.length > FEEDBACK_MESSAGE_MAX) {
      return NextResponse.json(
        { ok: false, error: `Message must be at most ${FEEDBACK_MESSAGE_MAX} characters` },
        { status: 400 }
      );
    }

    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    if (!isValidOptionalFeedbackEmail(emailRaw)) {
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
    }

    const pageUrl = normalizeFeedbackPageUrl(body.pageUrl);
    const contextArea = resolveFeedbackContextArea(pageUrl);
    const userAgent = truncate(req.headers.get("user-agent"), FEEDBACK_USER_AGENT_MAX);

    const row = {
      user_id: user?.id ?? null,
      type,
      message: messageRaw,
      page_url: pageUrl,
      context_area: contextArea,
      email: emailRaw || null,
      user_agent: userAgent,
      status: "new",
    };

    const { error } = await supabase.from("feedback_reports").insert(row);

    if (error) {
      console.error("[feedback]", error);
      return NextResponse.json(
        { ok: false, error: "Could not save feedback. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
