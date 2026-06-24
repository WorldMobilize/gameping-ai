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

/** Most-played Steam game with meaningful hours (the strongest taste signal). */
function topPlayedRef(profile: UserTasteProfile): { title: string; hours: number } | null {
  const g = profile.favoriteGames.find((x) => x.source === "steam" && (x.playtimeMin ?? 0) >= 120);
  if (!g) return null;
  return { title: g.title, hours: Math.round((g.playtimeMin ?? 0) / 60) };
}

/**
 * Deterministic "why picked" — personalized to THIS user's signals, never
 * generic review language. Each reason names the concrete signal that drove it
 * (a preferred genre/mechanic, or the taste reflected in their most-played game).
 * Used only when the AI explainer is unavailable.
 */
function deterministicWhyPicked(profile: UserTasteProfile, c: RawgCandidate): string[] {
  const reasons: string[] = [];
  const blob = norm([...candidateGenres(c), ...candidateTags(c)].join(" "));

  const matchedGenre = profile.preferredGenres.find((g) => blob.includes(norm(g)));
  if (matchedGenre) {
    reasons.push(`Your library leans into ${matchedGenre.toLowerCase()}, and this sits squarely in that lane`);
  }

  const matchedSignal = [...profile.preferredMechanics, ...profile.likes].find((s) =>
    blob.includes(norm(s))
  );
  if (matchedSignal && reasons.length < 3) {
    reasons.push(`Carries the ${matchedSignal.toLowerCase()} you keep coming back to`);
  }

  const played = topPlayedRef(profile);
  if (played && reasons.length < 3) {
    reasons.push(
      `Picked for the same taste that put ${played.hours}h into ${played.title}`
    );
  }

  if (reasons.length === 0) {
    // Still grounded in the user, not the game's reputation.
    const genre = primaryGenre(c).toLowerCase();
    reasons.push(`A ${genre} pick chosen to match your taste profile`);
    if (profile.preferredGenres[0]) {
      reasons.push(`Lines up with your interest in ${profile.preferredGenres[0].toLowerCase()}`);
    }
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

function dealConfidence(matchScore: number): "high" | "medium" | "low" {
  if (matchScore >= 85) return "high";
  if (matchScore >= 72) return "medium";
  return "low";
}

function deterministicWhyNow(discountPercent: number, intent: boolean): string {
  if (intent) return `On your list and ${discountPercent}% off right now.`;
  if (discountPercent >= 60) return `Steep ${discountPercent}% discount on a strong taste match.`;
  if (discountPercent >= 30) return `${discountPercent}% off — a solid moment to grab a taste match.`;
  return `${discountPercent}% off a game that fits your taste.`;
}

/**
 * Deals For You — "games you'd actually like that happen to be on sale".
 *
 * Candidates come from BOTH the user's intent signals (tracked + saved games)
 * AND fresh taste-matched discovery (RAWG from the taste profile) so a Steam-only
 * user still gets deals. Owned games are excluded. We keep ONLY games with a real
 * verified discount, rank by taste fit first (discount is a tiebreaker, never the
 * driver), and return "no_good_deals" rather than padding with bad cheap games.
 */
export async function generateDealsForYou(userId: string): Promise<GeneratePremiumResult> {
  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  if (!rawgApiKey) return { ok: false, error: "RAWG_API_KEY is not configured" };

  const profile = await buildUserTasteProfile(userId);
  if (!profile.complete) return { ok: false, error: "insufficient_taste_signal" };

  const ownedNorms = new Set(profile.ownedTitleNorms);

  // Intent candidates: games the user tracks/saved (not owned) — highest priority.
  const intentTitles = [
    ...new Set(
      profile.favoriteGames
        .filter((g) => g.source !== "steam" && !ownedNorms.has(normalizeForMatch(g.title)))
        .map((g) => g.title)
    ),
  ].slice(0, 6);

  type PriceCandidate = { title: string; rawg: RawgCandidate | null; intent: boolean };
  const candidates: PriceCandidate[] = intentTitles.map((title) => ({ title, rawg: null, intent: true }));

  try {
    // Discovery candidates: fresh taste-matched, credible, not owned/known.
    try {
      const raw = await fetchRawgCandidates({
        rawgApiKey,
        discoveryQueries: discoveryQueriesFromProfile(profile),
        pageSize: 40,
      });
      const discovery = selectCredibleCandidates(dedupeCandidates(raw), {
        ownedNorms: ownedAndKnownNorms(profile),
        limit: 10,
      });
      for (const c of discovery) candidates.push({ title: c.name, rawg: c, intent: false });
    } catch {
      // discovery is best-effort; intent candidates still flow through
    }

    if (candidates.length === 0) return { ok: false, error: "no_titles_to_price" };

    const toPrice = candidates.slice(0, MAX_DEAL_TITLES + 2);

    const built = await Promise.all(
      toPrice.map(async (cand) => {
        let rawg = cand.rawg;
        if (!rawg) {
          const list = await searchRawgByTitle({ rawgApiKey, title: cand.title, pageSize: 5 }).catch(
            () => [] as RawgCandidate[]
          );
          rawg = list.find((c) => candidateImage(c)) ?? list[0] ?? null;
        }
        const image = rawg ? candidateImage(rawg) : null;
        if (!image) return null;

        const dealsResult = await lookupDeals({ title: cand.title, limit: 4 }).catch(() => ({
          deals: [] as Awaited<ReturnType<typeof lookupDeals>>["deals"],
        }));
        const cheapest = dealsResult.deals[0]; // sorted ascending sale price
        if (!cheapest) return null;

        const sale = parsePrice(cheapest.salePrice);
        const normal = parsePrice(cheapest.normalPrice);
        if (Number.isNaN(sale) || Number.isNaN(normal) || normal <= sale) return null; // real discounts only

        const discountPercent = Math.round((1 - sale / normal) * 100);
        if (discountPercent <= 0) return null;

        const matchScore = rawg ? baseMatchScore(rawg) : cand.intent ? 80 : 72;
        const store = cheapest.store?.name || cheapest.provider || undefined;
        const card: DealCardData = {
          id: `deal-${rawg?.id ?? norm(cand.title).replace(/\s+/g, "-")}`,
          title: cand.title,
          image,
          oldPrice: `$${normal.toFixed(2)}`,
          newPrice: `$${sale.toFixed(2)}`,
          discount: `-${discountPercent}%`,
          matchScore,
          whyDealFits: rawg
            ? deterministicWhyPicked(profile, rawg)
            : [`On your tracked/saved list — and discounted now`],
          whyNow: deterministicWhyNow(discountPercent, cand.intent),
          confidence: dealConfidence(matchScore),
          store,
        };
        return { card, genres: rawg ? candidateGenres(rawg) : [], discountPercent };
      })
    );

    const valid = built.filter((b): b is NonNullable<typeof b> => b !== null).slice(0, MAX_DEALS);
    // No real, taste-matched discounts → "No great matches right now" (never filler).
    if (valid.length === 0) return { ok: false, error: "no_good_deals" };

    // Rank by TASTE FIT first (discount is a tiebreaker) — AI if available.
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
            whyNow: enriched?.whyNow || v.card.whyNow,
            confidence: enriched?.confidence ?? v.card.confidence,
          };
        })
        .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    } else {
      // taste match desc, then discount desc as a tiebreaker
      deals = valid
        .slice()
        .sort((a, b) => b.card.matchScore - a.card.matchScore || b.discountPercent - a.discountPercent)
        .map((v) => v.card);
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
              summary: "Real discounts on games that match your taste — ranked by fit, not by biggest markdown.",
            },
        sourceSummary: {
          generator: "premium:generateDealsForYou",
          sources: ["taste_profile", "rawg", "pricing", ai ? "openai" : "deterministic"],
          itemCount: deals.length,
          aiUsed: Boolean(ai),
          note: "Live prices via ITAD/Steam/CheapShark, ranked by taste fit. Owned games excluded.",
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

// Map the dominant taste bucket to one of the named gaming archetypes.
const ARCHETYPE_BY_BUCKET: Record<string, string> = {
  Discovery: "The Explorer",
  Story: "The Story Hunter",
  Challenge: "The Challenge Seeker",
  Competitive: "The Strategist",
};

/** Deterministic gaming archetype from the user's signals (5 named identities). */
function archetypeFromProfile(
  profile: UserTasteProfile,
  dna: { label: string; value: number }[]
): string {
  const s = profile.steamSummary;
  // Completionist: a deep, well-played library (high average playtime + high played share).
  if (s && s.ownedCount > 0) {
    const avgMin = s.totalPlaytimeMin / s.ownedCount;
    const playedShare = s.playedCount / s.ownedCount;
    if (avgMin >= 600 && playedShare >= 0.5) return "The Completionist";
  }
  const top = [...dna].sort((a, b) => b.value - a.value)[0];
  return (top && ARCHETYPE_BY_BUCKET[top.label]) || "The Explorer";
}

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
      ai?.personalityName || profile.steamSummary?.archetype || archetypeFromProfile(profile, dna);
    const personalitySummary =
      ai?.personalitySummary ||
      profile.steamSummary?.summary ||
      "Your taste leans toward discovery and story over competition.";

    // Wrapped-style identity fields (deterministic; AI narrative layers on top).
    const topPlayed = profile.favoriteGames
      .filter((g) => g.source === "steam" && (g.playtimeMin ?? 0) > 0)
      .slice(0, 5)
      .map((g) => ({ title: g.title, hours: Math.round((g.playtimeMin ?? 0) / 60) }));
    const dominantGenres = [...new Set([...profile.preferredGenres, ...profile.likes])].slice(0, 5);
    const favoriteMechanics = profile.preferredMechanics.slice(0, 5);
    const returnsTo = [
      ...new Set([...profile.likes, ...profile.preferredGenres, ...profile.preferredMechanics]),
    ].slice(0, 4);
    const playtimeScope: "all-time" | "this-month" = profile.steamSummary ? "all-time" : "this-month";

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
      returnsTo,
      topPlayed,
      dominantGenres,
      favoriteMechanics,
      playtimeScope,
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
