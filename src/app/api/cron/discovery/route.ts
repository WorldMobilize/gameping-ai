/**
 * Scheduled discovery rotation refresh.
 *
 *   GET /api/cron/discovery        (Vercel cron sends Authorization: Bearer <CRON_SECRET>)
 *   GET /api/cron/discovery?secret=<CRON_SECRET>   (manual run)
 *
 * Regenerates and publishes BOTH discovery rotations (hidden_gems +
 * games_of_the_week) for the current period. Each type is independent: if one
 * fails generation/validation, it records a failed status and the previously
 * published rotation stays live, while the other type still runs.
 *
 * Pipeline per type: RAWG candidate pool → AI curator (best-effort) →
 * deterministic fallback → validation → save → publish. Never touches the
 * recommendation pipeline, Stripe, auth, or the existing price-alerts cron.
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { generateRotationData } from "@/lib/discovery/generate-rotation";
import { validateRotation } from "@/lib/discovery/validate-rotation";
import {
  currentPeriodKey,
  publishRotation,
  saveFailedRotation,
  saveRotation,
  type HiddenGemsRotationData,
  type RotationType,
  type WeeklyRotationData,
} from "@/lib/discovery/rotation-store";

export const dynamic = "force-dynamic";

const TYPES: RotationType[] = ["hidden_gems", "games_of_the_week"];

function isProductionDeploy(): boolean {
  return (
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"
  );
}

function secretsMatch(expected: string, provided: string): boolean {
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^\s*Bearer\s+(.+)\s*$/i);
  return m?.[1]?.trim() || null;
}

function isAuthorizedCronRequest(req: Request, url: URL): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const querySecret = url.searchParams.get("secret")?.trim() ?? "";
  const bearer = extractBearerToken(req.headers.get("authorization")) ?? "";
  const provided = querySecret || bearer;
  if (!provided) return false;
  return secretsMatch(expected, provided);
}

type TypeResult = {
  type: RotationType;
  periodKey: string;
  status: "published" | "failed";
  generator?: string;
  itemCount?: number;
  error?: string;
};

async function refreshRotation(type: RotationType): Promise<TypeResult> {
  const periodKey = currentPeriodKey(type);

  const generated = await generateRotationData(type);
  if (!generated.ok) {
    await saveFailedRotation(type, periodKey, generated.error);
    return { type, periodKey, status: "failed", error: generated.error };
  }

  const validation =
    type === "hidden_gems"
      ? validateRotation(type, generated.data as HiddenGemsRotationData)
      : validateRotation(type, generated.data as WeeklyRotationData);

  if (!validation.ok) {
    const error = validation.errors.join("; ");
    await saveFailedRotation(type, periodKey, error);
    return { type, periodKey, status: "failed", error };
  }

  const saved = await saveRotation(
    type,
    periodKey,
    validation.data,
    generated.sourceSummary
  );
  if (!saved.ok) {
    return { type, periodKey, status: "failed", error: saved.error ?? "save_failed" };
  }

  const published = await publishRotation(type, periodKey);
  if (!published.ok) {
    return {
      type,
      periodKey,
      status: "failed",
      error: published.error ?? "publish_failed",
    };
  }

  return {
    type,
    periodKey,
    status: "published",
    generator: generated.sourceSummary.generator,
    itemCount: validation.data.picks.length,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  if (isProductionDeploy() && !process.env.CRON_SECRET?.trim()) {
    console.error("[cron:discovery] misconfiguration: CRON_SECRET is not set in production");
    return NextResponse.json(
      { error: "Server misconfiguration", message: "CRON_SECRET must be set in production." },
      { status: 500 }
    );
  }

  if (!isAuthorizedCronRequest(req, url)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron:discovery] started");

  // Run both types independently so one failure never blocks the other.
  const results = await Promise.all(
    TYPES.map((type) =>
      refreshRotation(type).catch((err): TypeResult => ({
        type,
        periodKey: currentPeriodKey(type),
        status: "failed",
        error: err instanceof Error ? err.message : "unknown_error",
      }))
    )
  );

  const publishedCount = results.filter((r) => r.status === "published").length;
  console.log("[cron:discovery] summary", { publishedCount, results });

  return NextResponse.json({
    ok: publishedCount > 0,
    publishedCount,
    results,
  });
}
