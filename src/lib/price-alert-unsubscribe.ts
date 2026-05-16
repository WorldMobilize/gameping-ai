import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSigningSecret(): string | null {
  const dedicated = process.env.PRICE_ALERT_UNSUBSCRIBE_SECRET?.trim();
  if (dedicated) return dedicated;
  const cron = process.env.CRON_SECRET?.trim();
  return cron || null;
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(s: string): Buffer | null {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}

function signPayload(payload: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(payload, "utf8").digest());
}

function signaturesMatch(expected: string, provided: string): boolean {
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Signed token: only encodes tracked_game id + expiry (no email or user id). */
export function createPriceAlertUnsubscribeToken(trackedGameId: string): string | null {
  const secret = getSigningSecret();
  if (!secret || !UUID_RE.test(trackedGameId)) return null;

  const exp = Math.floor((Date.now() + TOKEN_TTL_MS) / 1000);
  const payload = `${trackedGameId}.${exp}`;
  const sig = signPayload(payload, secret);
  return base64UrlEncode(Buffer.from(`${payload}.${sig}`, "utf8"));
}

export function verifyPriceAlertUnsubscribeToken(
  token: string
): { trackedGameId: string } | null {
  const secret = getSigningSecret();
  if (!secret) return null;

  const raw = base64UrlDecode(token.trim());
  if (!raw) return null;

  const decoded = raw.toString("utf8");
  const lastDot = decoded.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = decoded.slice(0, lastDot);
  const sig = decoded.slice(lastDot + 1);
  if (!payload || !sig) return null;

  const expectedSig = signPayload(payload, secret);
  if (!signaturesMatch(expectedSig, sig)) return null;

  const [trackedGameId, expStr] = payload.split(".");
  if (!trackedGameId || !expStr || !UUID_RE.test(trackedGameId)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return null;

  return { trackedGameId };
}

export function buildPriceAlertUnsubscribeUrl(params: {
  siteOrigin: string;
  trackedGameId: string;
}): string | null {
  const token = createPriceAlertUnsubscribeToken(params.trackedGameId);
  if (!token) return null;

  const origin = params.siteOrigin.replace(/\/$/, "");
  const q = new URLSearchParams({ token });
  return `${origin}/api/untrack-alert?${q.toString()}`;
}
