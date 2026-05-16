import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyPriceAlertUnsubscribeToken } from "@/lib/price-alert-unsubscribe";

function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
      : "") ||
    "http://localhost:3000"
  );
}

function renderPage(params: {
  title: string;
  message: string;
  dashboardUrl: string;
  ok: boolean;
}) {
  const title = escapeHtml(params.title);
  const message = escapeHtml(params.message);
  const dashboardUrl = escapeHtml(params.dashboardUrl);
  const accent = params.ok ? "#67e8f9" : "#fbbf24";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — GamePing AI</title>
</head>
<body style="margin:0;background:#05060f;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#05060f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0b0d18;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};">GamePing AI</p>
              <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">${title}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:rgba(255,255,255,0.75);">${message}</p>
              <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#22d3ee;color:#03040a;font-weight:700;text-decoration:none;border-radius:999px;">Open dashboard</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: Request) {
  const dashboardUrl = `${siteOrigin()}/dashboard`;
  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return new NextResponse(
      renderPage({
        title: "Link not valid",
        message:
          "This stop-tracking link is missing or incomplete. Use the link from your price alert email, or turn off tracking from a game page while signed in.",
        dashboardUrl,
        ok: false,
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const verified = verifyPriceAlertUnsubscribeToken(token);
  if (!verified) {
    return new NextResponse(
      renderPage({
        title: "Link expired or invalid",
        message:
          "We could not verify this stop-tracking link. It may have expired. Sign in and open your dashboard, or use Track price on the game page to turn alerts off.",
        dashboardUrl,
        ok: false,
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error("[untrack-alert] missing Supabase service credentials");
    return new NextResponse(
      renderPage({
        title: "Something went wrong",
        message: "We could not update your tracking preference right now. Please try again later or contact support@gamepingai.com.",
        dashboardUrl,
        ok: false,
      }),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { error } = await supabase
    .from("tracked_games")
    .update({ is_active: false })
    .eq("id", verified.trackedGameId);

  if (error) {
    console.error("[untrack-alert] update failed", error);
    return new NextResponse(
      renderPage({
        title: "Something went wrong",
        message:
          "We could not update your tracking preference right now. Please try again later or contact support@gamepingai.com.",
        dashboardUrl,
        ok: false,
      }),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    renderPage({
      title: "Alerts stopped",
      message:
        "You will not receive more price alert emails for this game. You can turn tracking back on anytime from the game page while signed in.",
      dashboardUrl,
      ok: true,
    }),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
