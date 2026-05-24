/**
 * Price alerts: uses `tracked_games.pricing_country` + regional `lookupBestPrice`.
 * Never uses request geo headers — country comes from the row saved at track time.
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createPricingContext } from "@/lib/pricing/pricing-context";
import { buildPriceAlertUnsubscribeUrl } from "@/lib/price-alert-unsubscribe";
import { resolveResendFrom } from "@/lib/resend-from";
import {
  resolveTrackedPricingCountry,
  trackedOfferSnapshotFromRow,
} from "@/lib/tracked-games-pricing";
import {
  buildAlertEmailHtml,
  buildAlertEmailText,
  buildOutboundAlertUrl,
  buildPriceAlertEmailSubject,
  fetchRawgGameMeta,
  formatAlertPriceDisplay,
  hasDuplicateAlertInCooldown,
  lookupVerifiedBestPriceForAlert,
  resolveAlertCurrencyDecision,
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

type TrackedGamePriceRow = {
  last_known_price: number | string | null;
  last_checked_at: string | null;
};

function parseStoredPrice(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type TrackedOfferMetadata = {
  currency: string;
  provider?: string | null;
  storeName?: string | null;
  dealUrl?: string | null;
};

/** Shift last_known → previous, then set last_known (+ optional alert fields). */
function buildTrackedGamePriceStateUpdate(params: {
  tg: TrackedGamePriceRow;
  currentPrice: number;
  nowIso: string;
  alertSent?: boolean;
  offer?: TrackedOfferMetadata;
}): Record<string, unknown> {
  const update: Record<string, unknown> = {
    previous_price: parseStoredPrice(params.tg.last_known_price),
    previous_checked_at: params.tg.last_checked_at ?? null,
    last_known_price: params.currentPrice,
    last_checked_at: params.nowIso,
  };

  if (params.offer) {
    update.last_known_currency = params.offer.currency;
    if (params.offer.provider) update.last_known_provider = params.offer.provider;
    if (params.offer.storeName) update.last_known_store = params.offer.storeName;
    if (params.offer.dealUrl) update.last_known_url = params.offer.dealUrl;
  }

  if (params.alertSent) {
    update.last_alert_price = params.currentPrice;
    update.last_alerted_at = params.nowIso;
  }

  return update;
}

function logCronPriceState(params: {
  gameId: string;
  title: string;
  skippedReason: string;
  lastKnownBefore: number | null;
  currentPrice: number | null;
  previousPrice: number | null;
  previousCheckedAt: string | null;
  lastAlertPrice?: number | null;
  alertSent?: boolean;
}) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[cron:price-state]", {
    gameId: params.gameId,
    title: params.title,
    skippedReason: params.skippedReason,
    last_known_price_before: params.lastKnownBefore,
    current_price: params.currentPrice,
    previous_price: params.previousPrice,
    previous_checked_at: params.previousCheckedAt,
    ...(params.alertSent
      ? {
          last_alert_price: params.lastAlertPrice ?? params.currentPrice,
          alert_sent: true,
        }
      : {}),
  });
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
        "id, user_id, rawg_id, title, target_price, last_known_price, last_known_currency, last_known_provider, last_known_store, last_known_url, pricing_country, last_checked_at, is_active"
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

      const lastKnownBefore = parseStoredPrice(tg.last_known_price);
      const previousCheckedAt =
        typeof tg.last_checked_at === "string" ? tg.last_checked_at : null;

      let skippedReason = "pending";

      let logTitle = titleStored;

      const pricingCountry = resolveTrackedPricingCountry(
        (tg as { pricing_country?: string | null }).pricing_country
      );
      const pricing = createPricingContext(pricingCountry);

      const applyPriceStateUpdate = async (
        currentPrice: number,
        opts?: {
          alertSent?: boolean;
          reason?: string;
          title?: string;
          offer?: TrackedOfferMetadata;
        }
      ) => {
        const nowIso = new Date().toISOString();
        const update = buildTrackedGamePriceStateUpdate({
          tg: {
            last_known_price: tg.last_known_price,
            last_checked_at: previousCheckedAt,
          },
          currentPrice,
          nowIso,
          alertSent: opts?.alertSent,
          offer: opts?.offer,
        });
        await supabase.from("tracked_games").update(update).eq("id", gameId);
        logCronPriceState({
          gameId,
          title: opts?.title ?? logTitle,
          skippedReason: opts?.reason ?? skippedReason,
          lastKnownBefore,
          currentPrice,
          previousPrice: parseStoredPrice(tg.last_known_price),
          previousCheckedAt,
          lastAlertPrice: opts?.alertSent ? currentPrice : null,
          alertSent: opts?.alertSent,
        });
      };

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
      logTitle = pricingTitle;

      const trackedSnapshot = trackedOfferSnapshotFromRow({
        last_known_currency: (tg as { last_known_currency?: string | null })
          .last_known_currency,
        last_known_provider: (tg as { last_known_provider?: string | null })
          .last_known_provider,
        last_known_store: (tg as { last_known_store?: string | null }).last_known_store,
        last_known_url: (tg as { last_known_url?: string | null }).last_known_url,
      });

      const verified = await lookupVerifiedBestPriceForAlert(
        pricingTitle,
        pricing,
        trackedSnapshot
      );

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

      const { best, priceNum, currency: quoteCurrency } = verified;
      const offerMeta: TrackedOfferMetadata = {
        currency: quoteCurrency,
        provider: best.provider ?? null,
        storeName: best.store?.name ?? null,
        dealUrl: best.deal?.url?.trim() ?? null,
      };

      console.log("[cron:tracked-offer]", {
        title: pricingTitle,
        pricing_country: pricingCountry,
        old_price: lastKnownBefore,
        old_currency: (tg as { last_known_currency?: string | null }).last_known_currency ?? null,
        old_provider: (tg as { last_known_provider?: string | null }).last_known_provider ?? null,
        old_store: (tg as { last_known_store?: string | null }).last_known_store ?? null,
        new_price: priceNum,
        new_currency: quoteCurrency,
        new_provider: best.provider ?? null,
        new_store: best.store?.name ?? null,
        selection_reason: verified.selectionReason,
        compare_allowed: verified.compareAllowed,
      });

      if (!verified.compareAllowed) {
        skippedReason = verified.selectionReason;
        skipped += 1;
        await applyPriceStateUpdate(priceNum, {
          reason: skippedReason,
          offer: offerMeta,
        });
        await sleep(120);
        continue;
      }

      const currencyDecision = resolveAlertCurrencyDecision({
        storedCurrency: (tg as { last_known_currency?: string | null })
          .last_known_currency,
        newCurrency: quoteCurrency,
      });

      if (currencyDecision.action === "initialize") {
        skippedReason = "currency_baseline_init";
        skipped += 1;
        await applyPriceStateUpdate(priceNum, {
          reason: skippedReason,
          offer: offerMeta,
        });
        if (process.env.NODE_ENV === "development") {
          console.log("[cron:tracked-game]", {
            gameId,
            title: pricingTitle,
            pricingCountry,
            currency: quoteCurrency,
            skippedReason,
          });
        }
        await sleep(120);
        continue;
      }

      if (currencyDecision.action === "rebaseline") {
        skippedReason = "currency_rebaseline";
        skipped += 1;
        console.log("[cron:currency-rebaseline]", {
          gameId,
          title: pricingTitle,
          pricingCountry,
          from: currencyDecision.from,
          to: currencyDecision.currency,
        });
        await applyPriceStateUpdate(priceNum, {
          reason: skippedReason,
          offer: offerMeta,
        });
        await sleep(120);
        continue;
      }

      if (priceNum <= 0) {
        skippedReason = "free_or_zero_skip";
        skipped += 1;
        await applyPriceStateUpdate(priceNum, { reason: skippedReason, offer: offerMeta });
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

      const dealUrl = offerMeta.dealUrl;
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
        await applyPriceStateUpdate(priceNum, { reason: skippedReason, offer: offerMeta });
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
        await applyPriceStateUpdate(priceNum, { reason: skippedReason, offer: offerMeta });
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
        storeID: best.store?.id ?? null,
        storeName: best.store?.name ?? null,
      });

      const priceDisplay = formatAlertPriceDisplay({
        price: best.price,
        currency: quoteCurrency,
        provider: best.provider,
        pricingCountry,
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
        wasPriceNum: lastKnownBefore,
        nowPriceNum: priceNum,
        currency: quoteCurrency,
        provider: best.provider,
        pricingCountry,
      };

      const html = buildAlertEmailHtml(emailContent);
      const text = buildAlertEmailText(emailContent);
      const subject = buildPriceAlertEmailSubject({
        gameTitle: pricingTitle,
        price: best.price,
        currency: quoteCurrency,
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
        currency: quoteCurrency,
        pricing_country: pricingCountry,
        store: best.store?.name ?? null,
        notified: true,
      });

      await applyPriceStateUpdate(priceNum, {
        alertSent: true,
        reason: skippedReason,
        offer: offerMeta,
      });

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
