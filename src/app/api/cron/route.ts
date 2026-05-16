/**
 * Price alerts: uses `tracked_games` + `lookupBestPrice` (same gate as game details).
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { formatAggregatorPriceLine } from "@/lib/pricing/display";
import { buildPriceAlertUnsubscribeUrl } from "@/lib/price-alert-unsubscribe";
import { resolveResendFrom } from "@/lib/resend-from";
import {
  buildAlertEmailHtml,
  buildAlertEmailText,
  buildOutboundAlertUrl,
  buildPriceAlertEmailSubject,
  fetchRawgGameMeta,
  hasDuplicateAlertInCooldown,
  lookupVerifiedBestPriceForAlert,
  shouldAlertOnPrice,
} from "@/lib/tracked-price-alerts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function isProductionDeploy(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

function assertCronSecretConfigured(): NextResponse | null {
  if (!isProductionDeploy()) return null;
  if (!process.env.CRON_SECRET?.trim()) {
    console.error("[cron] misconfiguration: CRON_SECRET is not set in production");
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        message: "CRON_SECRET must be set in production for scheduled jobs.",
      },
      { status: 500 }
    );
  }
  return null;
}

/** Compare secrets without leaking length hints via early exit (best-effort). */
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
  const raw = m?.[1]?.trim();
  return raw || null;
}

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * Manual runs may use `?secret=<CRON_SECRET>`.
 */
function isAuthorizedCronRequest(req: Request, url: URL): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const querySecret = url.searchParams.get("secret")?.trim() ?? "";
  const bearer = extractBearerToken(req.headers.get("authorization")) ?? "";
  const provided = querySecret || bearer;
  if (!provided) return false;
  return secretsMatch(expected, provided);
}

function getCronSupabase(): SupabaseClient | null {
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

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export async function GET(req: Request) {
  const misconfig = assertCronSecretConfigured();
  if (misconfig) return misconfig;

  const url = new URL(req.url);

  if (!isAuthorizedCronRequest(req, url)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error("[cron] RESEND_API_KEY is missing; email alerts cannot run");
    return NextResponse.json(
      {
        error: "Email not configured",
        message: "Set RESEND_API_KEY to enable price alert emails.",
      },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromResult = resolveResendFrom();
  if ("error" in fromResult) {
    console.error("[cron] resend from:", fromResult.error);
    return NextResponse.json(
      { error: "Email not configured", message: fromResult.error },
      { status: 500 }
    );
  }
  const from = fromResult.from;

  const supabase = getCronSupabase();
  if (!supabase) {
    console.error("[cron] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        message: "Supabase service credentials are required for cron.",
      },
      { status: 500 }
    );
  }

  console.log("[cron] started");

  let skipped = 0;
  let emailsAttempted = 0;
  let emailsSent = 0;
  let emailErrors = 0;
  let processed = 0;

  try {
    const { data: trackedRows, error: tgError } = await supabase
      .from("tracked_games")
      .select(
        "id, user_id, rawg_id, title, target_price, last_known_price, is_active"
      )
      .eq("is_active", true);

    if (tgError) {
      console.error("[cron] tracked_games", tgError);
      throw tgError;
    }

    const rows = trackedRows ?? [];
    const trackedGamesChecked = rows.length;
    console.log("[cron] tracked games to check:", trackedGamesChecked);

    const userIds = [...new Set(rows.map((r) => r.user_id))];

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);

    if (pErr) {
      console.error("[cron] profiles", pErr);
      throw pErr;
    }

    const emailByUser = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.email as string])
    );

    for (const tg of rows) {
      processed += 1;
      const gameId = tg.id as string;
      const titleStored = String(tg.title ?? "");
      const rawgId =
        typeof tg.rawg_id === "number" && Number.isFinite(tg.rawg_id)
          ? tg.rawg_id
          : null;
      const uid = tg.user_id as string;
      let userEmail = emailByUser.get(uid)?.trim() || null;
      let emailSource: "profile" | "auth.users" | "missing" = userEmail
        ? "profile"
        : "missing";

      if (!userEmail) {
        try {
          const { data: authUserData, error: authLookupErr } =
            await supabase.auth.admin.getUserById(uid);
          if (!authLookupErr && authUserData?.user?.email?.trim()) {
            userEmail = authUserData.user.email.trim();
            emailSource = "auth.users";
          }
        } catch (adminErr) {
          console.warn("[cron] auth.admin.getUserById failed", uid, adminErr);
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[cron:user-email-resolved]", {
          userId: uid,
          source: userEmail ? emailSource : "missing",
        });
      }

      const lastKnownBefore =
        tg.last_known_price != null && Number.isFinite(Number(tg.last_known_price))
          ? Number(tg.last_known_price)
          : null;

      let skippedReason = "pending";

      if (!userEmail) {
        skippedReason = "no_user_email";
        skipped += 1;
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: titleStored,
            bestPrice: null,
            skippedReason,
          });
        }
        await supabase
          .from("tracked_games")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", gameId);
        await sleep(80);
        continue;
      }

      const meta = await fetchRawgGameMeta({
        rawgId,
        fallbackTitle: titleStored,
      });
      const pricingTitle = meta.title;

      const verified = await lookupVerifiedBestPriceForAlert(pricingTitle);

      if (!verified.ok) {
        skippedReason = verified.reason;
        skipped += 1;
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: null,
            skippedReason,
          });
        }
        await supabase
          .from("tracked_games")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", gameId);
        await sleep(120);
        continue;
      }

      const { best, priceNum } = verified;

      if (priceNum <= 0) {
        skippedReason = "free_or_zero_skip";
        skipped += 1;
        await supabase
          .from("tracked_games")
          .update({
            last_checked_at: new Date().toISOString(),
            last_known_price: priceNum,
          })
          .eq("id", gameId);
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: best.price,
            skippedReason,
          });
        }
        await sleep(120);
        continue;
      }

      const dealUrl = best.deal?.url?.trim();
      if (!dealUrl) {
        skippedReason = "no_trusted_url";
        skipped += 1;
        await supabase
          .from("tracked_games")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", gameId);
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: best.price,
            skippedReason,
          });
        }
        await sleep(120);
        continue;
      }

      const threshold = shouldAlertOnPrice({
        targetPrice: tg.target_price,
        lastKnownPrice: lastKnownBefore,
        newPriceNum: priceNum,
      });

      if (!threshold.alert) {
        skippedReason = threshold.reason;
        skipped += 1;
        await supabase
          .from("tracked_games")
          .update({
            last_checked_at: new Date().toISOString(),
            last_known_price: priceNum,
          })
          .eq("id", gameId);
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: best.price,
            skippedReason,
          });
        }
        await sleep(120);
        continue;
      }

      const dup = await hasDuplicateAlertInCooldown({
        supabase,
        trackedGameId: gameId,
        newPrice: priceNum,
        provider: best.provider ?? "unknown",
      });

      if (dup) {
        skippedReason = "dedupe_cooldown";
        skipped += 1;
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:alert-dedupe]", {
            gameId,
            price: priceNum,
            provider: best.provider,
          });
        }
        await supabase
          .from("tracked_games")
          .update({
            last_checked_at: new Date().toISOString(),
            last_known_price: priceNum,
          })
          .eq("id", gameId);
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: best.price,
            skippedReason,
          });
        }
        await sleep(120);
        continue;
      }

      const origin = siteOrigin();
      const ctaUrl = buildOutboundAlertUrl({
        dealUrl,
        gameTitle: pricingTitle,
        siteOrigin: origin,
      });

      const priceDisplay = formatAggregatorPriceLine({
        price: best.price,
        currency: best.currency,
      });

      const dashboardUrl = `${origin}/dashboard`;
      const unsubscribeUrl = buildPriceAlertUnsubscribeUrl({
        siteOrigin: origin,
        trackedGameId: gameId,
      });

      const emailContent = {
        gameTitle: pricingTitle,
        priceDisplay,
        storeName: best.store?.name || "Store",
        matchedListing: best.matchedTitle,
        ctaUrl,
        dashboardUrl,
        unsubscribeUrl,
        heroImageUrl: meta.backgroundImage,
        alertReason: threshold.reason,
      };

      const html = buildAlertEmailHtml(emailContent);
      const text = buildAlertEmailText(emailContent);
      const subject = buildPriceAlertEmailSubject({
        gameTitle: pricingTitle,
        price: best.price,
        currency: best.currency,
      });

      emailsAttempted += 1;
      try {
        await resend.emails.send({
          from,
          to: userEmail,
          subject,
          html,
          text,
        });
      } catch (mailErr) {
        emailErrors += 1;
        skipped += 1;
        console.error("[cron] resend failed", gameId, mailErr);
        skippedReason = "email_failed";
        await supabase
          .from("tracked_games")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", gameId);
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: best.price,
            skippedReason,
          });
        }
        await sleep(200);
        continue;
      }

      emailsSent += 1;
      skippedReason = "sent";

      await supabase.from("price_alert_events").insert({
        tracked_game_id: gameId,
        old_price: lastKnownBefore,
        new_price: priceNum,
        provider: best.provider ?? "unknown",
        notified: true,
      });

      await supabase
        .from("tracked_games")
        .update({
          last_checked_at: new Date().toISOString(),
          last_known_price: priceNum,
        })
        .eq("id", gameId);

      if (process.env.NODE_ENV === "development") {
        console.log("[cron:tracked-game]", {
          gameId,
          title: pricingTitle,
          bestPrice: best.price,
          skippedReason,
        });
      }

      await sleep(200);
    }

    console.log("[cron] summary", {
      trackedGamesChecked,
      processed,
      skipped,
      emailsAttempted,
      emailsSent,
      emailErrors,
    });

    return NextResponse.json({
      success: true,
      message: "Cron finished",
      tracked: trackedGamesChecked,
      processed,
      skipped,
      emailsAttempted,
      emailsSent,
      emailErrors,
    });
  } catch (error) {
    console.error("[cron] fatal error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
