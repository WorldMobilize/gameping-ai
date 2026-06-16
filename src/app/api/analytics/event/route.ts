import { NextResponse } from "next/server";
import {
  inferDeviceType,
  isProductAnalyticsEventName,
  sanitizeAnonymousId,
  sanitizePagePath,
  sanitizeProductAnalyticsMetadata,
  sanitizeReferrer,
  sanitizeSessionId,
} from "@/lib/product-analytics/sanitize";
import {
  inferCountryFromHeaders,
  insertProductEvent,
} from "@/lib/product-analytics/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

function analyticsAccepted(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/** Best-effort product analytics ingest — never blocks the client. */
export async function POST(req: Request) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength) {
      const n = Number(contentLength);
      if (Number.isFinite(n) && n > MAX_BODY_BYTES) {
        return analyticsAccepted();
      }
    }

    let body: Record<string, unknown>;
    try {
      const raw = await req.text();
      if (raw.length > MAX_BODY_BYTES) {
        return analyticsAccepted();
      }
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return analyticsAccepted();
    }

    const eventRaw = typeof body.event_name === "string" ? body.event_name.trim() : "";
    if (!isProductAnalyticsEventName(eventRaw)) {
      return analyticsAccepted();
    }

    const session_id = sanitizeSessionId(body.session_id);
    if (!session_id) {
      return analyticsAccepted();
    }

    try {
      const rl = await rateLimit({
        req,
        action: "analytics",
        limit: 200,
        windowMs: 10 * 60 * 1000,
        userId: session_id,
      });
      if (!rl.allowed) {
        return analyticsAccepted();
      }
    } catch {
      /* rate-limit infra must not break analytics delivery */
    }

    const anonymous_id = sanitizeAnonymousId(body.anonymous_id);
    const page_path = sanitizePagePath(body.page_path);
    const referrer = sanitizeReferrer(body.referrer);
    const metadata = sanitizeProductAnalyticsMetadata(body.metadata);

    let user_id: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      user_id = user?.id ?? null;
    } catch {
      /* anonymous events allowed */
    }

    const user_agent = req.headers.get("user-agent");
    const device_type = inferDeviceType(user_agent);
    const country = inferCountryFromHeaders(req);

    await insertProductEvent({
      event_name: eventRaw,
      session_id,
      anonymous_id,
      user_id,
      page_path,
      referrer,
      user_agent: user_agent?.slice(0, 512) ?? null,
      device_type,
      country,
      metadata,
    });
  } catch (err) {
    console.error("[analytics/event]", err);
  }

  return analyticsAccepted();
}
