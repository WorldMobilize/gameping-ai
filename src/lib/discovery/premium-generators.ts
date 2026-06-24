import "server-only";

import {
  dedupeCandidates,
  fetchRawgCandidates,
  searchRawgByTitle,
  type RawgCandidate,
} from "@/lib/rawg-discovery";
import { lookupDeals } from "@/lib/pricing/price-service";
import { getServiceSupabase } from "@/lib/discovery/rotation-store";
import {
  MIN_CREDIBLE_PICKS,
  normalizeForMatch,
  selectCredibleCandidates,
} from "@/lib/discovery/premium-candidate-quality";
import {
  buildUserTasteProfile,
  type UserTasteProfile,
} from "@/lib/discovery/user-taste-profile";
import {
  explainWeeklyPicksWithAi,
  narrateRecapWithAi,
  rankDealsWithAi,
} from "@/lib/discovery/premium-ai";
import type {
  DealCardData,
  WeeklyPickCardData,
} from "@/lib/discovery/premium-demo-data";
import type {
  MonthlyRecapCore,
  PremiumRotationData,
} from "@/lib/discovery/user-rotation-store";

/**
 * Per-user generation for the premium pages. Each generator:
 *   1. builds the user's taste profile from real DB signals,
 *   2. gathers real candidates (RAWG discovery / pricing APIs),
 *   3. lets OpenAI explain + rank on top (best-effort; deterministic fallback),
 *   4. returns a cache-ready PremiumRotationData (or a typed failure).
 *
 * OpenAI is never the source of truth and never invents owned games, playtime,
 * or prices. If a user has no real signal, generation fails cleanly and the page
 * shows the empty "make it personal" state.
 *
 * Reuses the EXISTING RAWG + pricing integrations — no new API client or key.
 */

export type GeneratePremiumResult =
  | { ok: true; data: PremiumRotationData }
  | { ok: false; error: string };

const MAX_PICKS = 8;
const MAX_DEAL_TITLES = 10;
const MAX_DEALS = 8;

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function candidateImage(c: RawgCandidate): string | null {
  return c.background_image || c.image_fallback || null;
}

function candidateGenres(c: RawgCandidate): string[] {
  return (c.genres ?? []).map((g) => g.name).filter(Boolean);
}

function candidateTags(c: RawgCandidate, limit = 6): string[] {
  return (c.tags ?? []).map((t) => t.name).filter(Boolean).slice(0, limit);
}

function primaryGenre(c: RawgCandidate): string {
  return c.genres?.[0]?.name ?? "Game";
}

/** Deterministic match score from RAWG rating when AI isn't available. */
function baseMatchScore(c: RawgCandidate): number {
  const rating = typeof c.rating === "number" ? c.rating : 0;
  const score = Math.round(60 + (rating / 5) * 35);
  return Math.max(60, Math.min(96, score));
}

/** Build discovery queries that reflect this user's taste. */
function discoveryQueriesFromProfile(profile: UserTasteProfile): string[] {
  const queries: string[] = [];
  // Genre + like combinations make the best RAWG search strings.
  for (const genre of profile.preferredGenres.slice(0, 4)) queries.push(genre);
  for (const like of profile.likes.slice(0, 3)) queries.push(like);
  // A couple of favorite titles surface "similar to" results.
  for (const fav of profile.favoriteGames.slice(0, 3)) queries.push(fav.title);
  if (queries.length === 0) queries.push("highly rated games");
  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 6);
}

/** Titles the user already owns (Steam) / tracks / saved — exclude from fresh picks. */
function ownedAndKnownNorms(profile: UserTasteProfile): Set<string> {
  return new Set<string>([
    ...profile.ownedTitleNorms,
    ...profile.favoriteGames.map((g) => normalizeForMatch(g.title)),
  ]);
}

/** Deterministic "why picked" from overlap of taste signals + candidate metadata. */
function deterministicWhyPicked(profile: UserTasteProfile, c: RawgCandidate): string[] {
  const reasons: string[] = [];
  const blob = norm([...candidateGenres(c), ...candidateTags(c)].join(" "));
  for (const genre of profile.preferredGenres) {
    if (blob.includes(norm(genre))) {
      reasons.push(`Matches your interest in ${genre.toLowerCase()}`);
      break;
    }
  }
  for (const like of profile.likes) {
    if (blob.includes(norm(like))) {
      reasons.push(`Fits your taste for ${like.toLowerCase()}`);
      break;
    }
  }
  if (typeof c.rating === "number" && c.rating >= 4) {
    reasons.push("Highly rated by players");
  }
  if (reasons.length === 0) {
    reasons.push(`A strong ${primaryGenre(c).toLowerCase()} pick worth a look`);
  }
  return reasons.slice(0, 3);
}

// ===========================================================================
// Weekly picks
// ===========================================================================

export async function generateWeeklyPicks(userId: string): Promise<GeneratePremiumResult> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return { ok: false, error: "RAWG_API_KEY is not configured" };

  const profile = await buildUserTasteProfile(userId);
  if (!profile.complete) return { ok: false, error: "insufficient_taste_signal" };

  try {
    const queries = discoveryQueriesFromProfile(profile);
    const raw = await fetchRawgCandidates({ rawgApiKey, discoveryQueries: queries, pageSize: 40 });
    const ownedNorms = ownedAndKnownNorms(profile);

    // STRICT credibility gate — rejects prototype/demo/versioned shovelware,
    // requires a real popularity signal, dedupes title clusters, excludes owned
    // games. Better to ship 3 excellent picks than 8 filler ones.
    const chosen = selectCredibleCandidates(dedupeCandidates(raw), {
      ownedNorms,
      limit: MAX_PICKS,
    });

    if (chosen.length < MIN_CREDIBLE_PICKS) {
      return { ok: false, error: "insufficient_credible_candidates" };
    }

    // AI explanations (best-effort).
    const ai = await explainWeeklyPicksWithAi({
      profile,
      candidates: chosen.map((c) => ({
        id: String(c.id),
        title: c.name,
        genres: candidateGenres(c),
        tags: candidateTags(c),
      })),
    });
    const aiById = new Map((ai?.picks ?? []).map((p) => [p.id, p]));

    const picks: WeeklyPickCardData[] = chosen.map((c) => {
      const enriched = aiById.get(String(c.id));
      return {
        id: `rawg-${c.id}`,
        title: c.name,
        image: candidateImage(c)!,
        matchScore: enriched?.matchScore ?? baseMatchScore(c),
        category: enriched?.category || primaryGenre(c),
        whyPicked:
          enriched?.whyPicked?.length ? enriched.whyPicked.slice(0, 3) : deterministicWhyPicked(profile, c),
        possibleConcerns: enriched?.possibleConcerns?.slice(0, 2) ?? [],
      };
    });

    picks.sort((a, b) => b.matchScore - a.matchScore);

    return {
      ok: true,
      data: {
        items: picks,
        featuredItem: picks[0] ?? null,
        aiSummary: ai
          ? { headline: ai.headline, summary: ai.summary }
          : {
              headline: "Picked for your taste",
              summary: "Fresh games selected from your favorite genres and saved games.",
            },
        sourceSummary: {
          generator: "premium:generateWeeklyPicks",
          sources: ["taste_profile", "rawg", ai ? "openai" : "deterministic"],
          itemCount: picks.length,
          aiUsed: Boolean(ai),
          note: profile.sourceSummary.hasSteam
            ? "Includes Steam taste signals."
            : "Built from saved searches + tracked games.",
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "weekly_generation_error" };
  }
}

// ===========================================================================
// Deals for you
// ===========================================================================

function parsePrice(value: string | undefined): number {
  if (!value) return NaN;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

export async function generateDealsForYou(userId: string): Promise<GeneratePremiumResult> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return { ok: false, error: "RAWG_API_KEY is not configured" };

  const profile = await buildUserTasteProfile(userId);
  if (!profile.complete) return { ok: false, error: "insufficient_taste_signal" };

  // Find deals on games the user is INTERESTED in (saved searches + tracked
  // games) — never on games they already OWN on Steam (a discount on an owned
  // game is useless). Owned-only users get the graceful "no deal signal" state.
  const ownedNorms = new Set(profile.ownedTitleNorms);
  const titles = [
    ...new Set(
      profile.favoriteGames
        .filter((g) => g.source !== "steam" && !ownedNorms.has(normalizeForMatch(g.title)))
        .map((g) => g.title)
    ),
  ].slice(0, MAX_DEAL_TITLES);
  if (titles.length === 0) return { ok: false, error: "no_titles_to_price" };

  try {
    const built = await Promise.all(
      titles.map(async (title) => {
        // Real image/genres from RAWG + real prices from the pricing service.
        const [rawgList, dealsResult] = await Promise.all([
          searchRawgByTitle({ rawgApiKey, title, pageSize: 5 }).catch(() => [] as RawgCandidate[]),
          lookupDeals({ title, limit: 4 }).catch(() => ({ deals: [] as Awaited<ReturnType<typeof lookupDeals>>["deals"] })),
        ]);
        const rawg = rawgList.find((c) => candidateImage(c)) ?? rawgList[0];
        const image = rawg ? candidateImage(rawg) : null;
        const cheapest = dealsResult.deals[0]; // already sorted ascending sale price
        if (!image || !cheapest) return null;

        const sale = parsePrice(cheapest.salePrice);
        const normal = parsePrice(cheapest.normalPrice);
        if (Number.isNaN(sale) || Number.isNaN(normal) || normal <= sale) return null; // only real discounts

        const discountPercent = Math.round((1 - sale / normal) * 100);
        if (discountPercent <= 0) return null;

        const card: DealCardData = {
          id: `deal-${rawg?.id ?? norm(title).replace(/\s+/g, "-")}`,
          title,
          image,
          oldPrice: `$${normal.toFixed(2)}`,
          newPrice: `$${sale.toFixed(2)}`,
          discount: `-${discountPercent}%`,
          matchScore: rawg ? baseMatchScore(rawg) : 75,
          whyDealFits: rawg ? deterministicWhyPicked(profile, rawg) : ["A game from your library / saved list"],
        };
        return { card, genres: rawg ? candidateGenres(rawg) : [], discountPercent };
      })
    );

    const valid = built.filter((b): b is NonNullable<typeof b> => b !== null).slice(0, MAX_DEALS);
    if (valid.length === 0) return { ok: false, error: "no_matching_deals" };

    // Rank by taste fit (NOT biggest discount) — AI if available, else by match score.
    const ai = await rankDealsWithAi({
      profile,
      deals: valid.map((v) => ({
        id: v.card.id,
        title: v.card.title,
        discountPercent: v.discountPercent,
        genres: v.genres,
      })),
    });

    let deals: DealCardData[];
    if (ai?.deals?.length) {
      const order = new Map(ai.deals.map((d, i) => [d.id, i]));
      const aiById = new Map(ai.deals.map((d) => [d.id, d]));
      deals = valid
        .map((v) => {
          const enriched = aiById.get(v.card.id);
          return {
            ...v.card,
            matchScore: enriched?.matchScore ?? v.card.matchScore,
            whyDealFits: enriched?.whyDealFits?.slice(0, 3) ?? v.card.whyDealFits,
          };
        })
        .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    } else {
      deals = valid.map((v) => v.card).sort((a, b) => b.matchScore - a.matchScore);
    }

    return {
      ok: true,
      data: {
        items: deals,
        featuredItem: deals[0] ?? null,
        aiSummary: ai
          ? { headline: ai.headline, summary: ai.summary }
          : {
              headline: "Deals that fit your taste",
              summary: "Discounts on games you track and games close to your favorites.",
            },
        sourceSummary: {
          generator: "premium:generateDealsForYou",
          sources: ["taste_profile", "rawg", "pricing", ai ? "openai" : "deterministic"],
          itemCount: deals.length,
          aiUsed: Boolean(ai),
          note: "Live prices via ITAD/Steam/CheapShark, ranked by taste fit (not biggest discount).",
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "deals_generation_error" };
  }
}

// ===========================================================================
// Monthly recap
// ===========================================================================

const RECAP_DNA_BUCKETS: { label: string; keywords: string[] }[] = [
  { label: "Discovery", keywords: ["exploration", "open world", "adventure", "discovery", "sandbox", "atmospheric"] },
  { label: "Story", keywords: ["story", "narrative", "rpg", "role", "choices", "visual novel"] },
  { label: "Challenge", keywords: ["difficult", "souls", "roguelike", "strategy", "tactical", "puzzle", "survival"] },
  { label: "Competitive", keywords: ["multiplayer", "competitive", "shooter", "pvp", "esports", "fighting"] },
];

function recapDnaBars(profile: UserTasteProfile): { label: string; value: number }[] {
  const blob = norm(
    [
      ...profile.likes,
      ...profile.preferredGenres,
      ...profile.preferredMechanics,
      ...profile.favoriteGames.map((g) => g.title),
    ].join(" ")
  );
  const raw = RECAP_DNA_BUCKETS.map((bucket) => {
    const hits = bucket.keywords.reduce((acc, kw) => acc + (blob.includes(kw) ? 1 : 0), 0);
    return { label: bucket.label, hits };
  });
  const maxHits = Math.max(1, ...raw.map((r) => r.hits));
  return raw.map((r) => ({
    label: r.label,
    // Scale to a readable 25–95 range so bars never look empty when there's signal.
    value: r.hits === 0 ? 25 : Math.min(95, 45 + Math.round((r.hits / maxHits) * 50)),
  }));
}

async function recapStats(
  userId: string,
  profile: UserTasteProfile
): Promise<{ searches: number; discovered: number; saved: number; alerts: number }> {
  const supabase = getServiceSupabase();
  const fallback = {
    searches: profile.sourceSummary.savedSearches,
    discovered: profile.favoriteGames.length,
    saved: profile.sourceSummary.savedGames,
    alerts: 0,
  };
  if (!supabase) return fallback;
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [searchCount, trackedAlerts] = await Promise.all([
      supabase
        .from("search_profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since),
      supabase
        .from("tracked_games")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("target_price", "is", null),
    ]);
    return {
      searches: searchCount.count ?? fallback.searches,
      discovered: profile.favoriteGames.length,
      saved: profile.sourceSummary.savedGames,
      alerts: trackedAlerts.count ?? 0,
    };
  } catch {
    return fallback;
  }
}

export async function generateMonthlyRecap(userId: string): Promise<GeneratePremiumResult> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();

  const profile = await buildUserTasteProfile(userId);
  if (!profile.complete) return { ok: false, error: "insufficient_activity" };

  try {
    const stats = await recapStats(userId, profile);
    const dna = recapDnaBars(profile);

    // Taste evolution: oldest vs newest signals when we have them; else "now" only.
    const now = [
      ...profile.preferredGenres.slice(0, 3),
      ...profile.likes.slice(0, 2),
    ].slice(0, 5);
    const before = profile.steamSummary?.archetype
      ? [profile.steamSummary.archetype]
      : profile.preferredGenres.slice(3, 6);

    // AI narrative (best-effort).
    const ai = await narrateRecapWithAi({ profile, stats });

    const personalityName =
      ai?.personalityName || profile.steamSummary?.archetype || "The Explorer";
    const personalitySummary =
      ai?.personalitySummary ||
      profile.steamSummary?.summary ||
      "Your taste leans toward discovery and story over competition.";

    // Predictions — a few taste-matched RAWG picks (optional; recap works without).
    let predictions: WeeklyPickCardData[] = [];
    if (rawgApiKey) {
      try {
        const raw = await fetchRawgCandidates({
          rawgApiKey,
          discoveryQueries: discoveryQueriesFromProfile(profile),
          pageSize: 24,
        });
        // Same strict credibility gate as Weekly Picks — no shovelware/owned games.
        predictions = selectCredibleCandidates(dedupeCandidates(raw), {
          ownedNorms: ownedAndKnownNorms(profile),
          limit: 3,
        }).map((c) => ({
          id: `rawg-pred-${c.id}`,
          title: c.name,
          image: candidateImage(c)!,
          matchScore: baseMatchScore(c),
          category: primaryGenre(c),
          whyPicked: deterministicWhyPicked(profile, c),
          possibleConcerns: [],
        }));
      } catch {
        predictions = [];
      }
    }

    const core: MonthlyRecapCore = {
      personality: { name: personalityName, summary: personalitySummary, dna },
      month: stats,
      evolution: { before, now },
    };

    return {
      ok: true,
      data: {
        items: predictions,
        featuredItem: core,
        aiSummary: ai
          ? { headline: ai.headline, summary: ai.summary }
          : {
              headline: "Your month in gaming",
              summary: "A recap of how your taste is shaping up based on your activity.",
            },
        sourceSummary: {
          generator: "premium:generateMonthlyRecap",
          sources: [
            "taste_profile",
            "activity_stats",
            rawgApiKey ? "rawg" : "no_rawg",
            ai ? "openai" : "deterministic",
          ],
          itemCount: predictions.length,
          aiUsed: Boolean(ai),
          note: "Stats are real activity counts; predictions are taste-matched RAWG picks.",
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "recap_generation_error" };
  }
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

export function generatePremiumRotation(
  type: "weekly_picks" | "deals_for_you" | "monthly_recap",
  userId: string
): Promise<GeneratePremiumResult> {
  switch (type) {
    case "weekly_picks":
      return generateWeeklyPicks(userId);
    case "deals_for_you":
      return generateDealsForYou(userId);
    case "monthly_recap":
      return generateMonthlyRecap(userId);
  }
}
