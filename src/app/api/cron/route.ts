/**
 * Price alerts: uses `tracked_games` + `lookupBestPrice` (same gate as game details).
 */
import { NextResponse } from "next/server";
import { formatAggregatorPriceLine } from "@/lib/pricing/display";
import {
  buildAlertEmailHtml,
  buildOutboundAlertUrl,
  fetchRawgGameMeta,
  hasDuplicateAlertInCooldown,
  lookupVerifiedBestPriceForAlert,
  shouldAlertOnPrice,
} from "@/lib/tracked-price-alerts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    console.error("[cron] RESEND_API_KEY missing");
    return NextResponse.json(
      { error: "Email not configured" },
      { status: 500 }
    );
  }

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

    let processed = 0;
    let emailsSent = 0;

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
      let alertSent = false;
      let accepted = false;

      if (!userEmail) {
        skippedReason = "no_user_email";
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: titleStored,
            bestPrice: null,
            accepted: false,
            alertSent: false,
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
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: null,
            accepted: false,
            alertSent: false,
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

      accepted = true;
      const { best, priceNum } = verified;

      if (priceNum <= 0) {
        skippedReason = "free_or_zero_skip";
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
            accepted: true,
            alertSent: false,
            skippedReason,
          });
        }
        await sleep(120);
        continue;
      }

      const dealUrl = best.deal?.url?.trim();
      if (!dealUrl) {
        skippedReason = "no_trusted_url";
        await supabase
          .from("tracked_games")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", gameId);
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            bestPrice: best.price,
            accepted: true,
            alertSent: false,
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
            accepted: true,
            alertSent: false,
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
            accepted: true,
            alertSent: false,
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

      const html = buildAlertEmailHtml({
        gameTitle: pricingTitle,
        priceDisplay,
        storeName: best.store?.name || "Store",
        matchedListing: best.matchedTitle,
        ctaUrl,
        heroImageUrl: meta.backgroundImage,
      });

      const from =
        process.env.RESEND_FROM || "GamePing <onboarding@resend.dev>";

      try {
        await resend.emails.send({
          from,
          to: userEmail,
          subject: `GamePing AI — Deal on ${pricingTitle}`,
          html,
        });
      } catch (mailErr) {
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
            accepted: true,
            alertSent: false,
            skippedReason,
          });
        }
        await sleep(200);
        continue;
      }

      emailsSent += 1;
      alertSent = true;
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
          accepted: true,
          alertSent: true,
          skippedReason,
        });
      }

      await sleep(200);
    }

    return NextResponse.json({
      success: true,
      message: "Cron finished",
      tracked: rows.length,
      processed,
      emailsSent,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
