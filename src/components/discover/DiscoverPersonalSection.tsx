"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Personal section of the Discovery hub — the premium, taste-driven tools.
 *
 * Reactive to the current user, READ-ONLY. It never triggers generation, never
 * writes, and touches no API/RLS: it reads the caller's own rows (allowed by the
 * existing SELECT-own policies) to reflect real status —
 *   - profiles.plan                → free / premium / admin
 *   - user_premium_rotations       → which of weekly/deals/recap are published
 *   - user_steam_connections       → Steam connected + Taste DNA built
 *
 * Baseline render is the anonymous state (truthful before we know the user),
 * then it enhances once auth resolves. Free/anon users can OPEN any tool to see
 * its public preview/demo (the premium discovery pages and the how-it-works
 * explainers are all public) — we intentionally don't gate viewing behind login,
 * and the "preview / example" framing lives inside those pages, not as a label
 * here. Real per-user status (below) is only ever shown to premium/admin.
 *
 * Visual language is intentionally identical to the Explore cards (same surface,
 * icon chip, type, spacing). This is a structural/state change, not a restyle.
 */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const ICONS = {
  picks: <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />,
  deals: <><path d="M20.5 12.5l-8 8-9-9V3h8.5z" /><circle cx="7.5" cy="7.5" r="1.1" /></>,
  recap: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  dna: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12l6-6" /></>,
  steam: <><circle cx="12" cy="12" r="9" /><circle cx="15" cy="9" r="2.4" /><path d="M6.5 14.5l4-1.6" /></>,
} as const;

const CARD = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";
const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-400";

const SETTINGS_STEAM = "/settings/account#steam-library-import";

type Tier = "anon" | "free" | "premium";

type Snapshot = {
  tier: Tier;
  steamConnected: boolean;
  tasteDnaBuilt: boolean;
  steamGameCount: number | null;
  weeklyReady: boolean;
  dealsReady: boolean;
  recapReady: boolean;
};

const BASELINE: Snapshot = {
  tier: "anon",
  steamConnected: false,
  tasteDnaBuilt: false,
  steamGameCount: null,
  weeklyReady: false,
  dealsReady: false,
  recapReady: false,
};

type CardModel = {
  key: keyof typeof ICONS;
  title: string;
  desc: string;
  href: string;
  cta: string;
  /** Real per-user status line — set for premium/admin only. */
  status?: string;
};

/**
 * Public, viewable destinations for non-premium visitors — no login wall. The
 * three premium discovery pages render their own locked preview/demo; Taste DNA
 * and Steam Library point at their public how-it-works explainers.
 */
const PUBLIC_HREF = {
  picks: "/weekly-picks",
  deals: "/deals-for-you",
  recap: "/monthly-recap",
  dna: "/how-it-works/taste-memory",
  steam: "/how-it-works/steam-import",
} as const;

function buildCards(s: Snapshot): CardModel[] {
  const isPremium = s.tier === "premium";

  // Weekly Picks · Deals For You · Monthly Recap — premium discovery rotations.
  // Same real page for everyone (it handles premium vs public preview); only
  // premium sees a real status line.
  const rotation = (
    key: "picks" | "deals" | "recap",
    title: string,
    desc: string,
    href: string,
    ready: boolean
  ): CardModel =>
    isPremium
      ? {
          key,
          title,
          desc,
          href,
          cta: ready ? "Open" : "View",
          status: ready ? "Ready to view" : "Not generated yet — check back soon",
        }
      : { key, title, desc, href, cta: "Open" };

  const cards: CardModel[] = [
    rotation(
      "picks",
      "Weekly Picks",
      "A short, personalized shortlist refreshed every week from your taste.",
      PUBLIC_HREF.picks,
      s.weeklyReady
    ),
    rotation(
      "deals",
      "Deals For You",
      "Price drops on games matched to how you actually play.",
      PUBLIC_HREF.deals,
      s.dealsReady
    ),
    rotation(
      "recap",
      "Monthly Recap",
      "A monthly look back at your gaming, with a taste read and what's next.",
      PUBLIC_HREF.recap,
      s.recapReady
    ),
  ];

  // Taste DNA
  if (isPremium) {
    cards.push(
      s.tasteDnaBuilt
        ? {
            key: "dna",
            title: "Taste DNA",
            desc: "Your play-style fingerprint, built from your Steam library.",
            href: SETTINGS_STEAM,
            cta: "View",
            status:
              s.steamGameCount != null
                ? `Built from your Steam library · ${s.steamGameCount} games`
                : "Built from your Steam library",
          }
        : s.steamConnected
          ? {
              key: "dna",
              title: "Taste DNA",
              desc: "Your play-style fingerprint, built from your Steam library.",
              href: SETTINGS_STEAM,
              cta: "Finish setup",
              status: "Steam connected — Taste DNA not built yet",
            }
          : {
              key: "dna",
              title: "Taste DNA",
              desc: "Your play-style fingerprint, built from your Steam library.",
              href: SETTINGS_STEAM,
              cta: "Connect Steam",
              status: "Connect Steam to build your Taste DNA",
            }
    );
  } else {
    cards.push({
      key: "dna",
      title: "Taste DNA",
      desc: "A play-style fingerprint that explains why a game fits you.",
      href: PUBLIC_HREF.dna,
      cta: "See how it works",
    });
  }

  // Steam Library
  if (isPremium) {
    cards.push(
      s.steamConnected
        ? {
            key: "steam",
            title: "Steam Library",
            desc: "Your imported library powers your personalized tools.",
            href: SETTINGS_STEAM,
            cta: "Manage",
            status:
              s.steamGameCount != null
                ? `Connected · ${s.steamGameCount} games`
                : "Connected",
          }
        : {
            key: "steam",
            title: "Steam Library",
            desc: "Import your library to power your personalized tools.",
            href: SETTINGS_STEAM,
            cta: "Connect Steam",
            status: "Not connected",
          }
    );
  } else {
    cards.push({
      key: "steam",
      title: "Steam Library",
      desc: "Powers Weekly Picks, Deals For You, Monthly Recap & Taste DNA.",
      href: PUBLIC_HREF.steam,
      cta: "See how it works",
    });
  }

  return cards;
}

export default function DiscoverPersonalSection() {
  const [snap, setSnap] = useState<Snapshot>(BASELINE);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setSnap({ ...BASELINE, tier: "anon" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      const plan = profile?.plan ?? "free";
      const isPremium = plan === "premium" || plan === "admin";

      if (!isPremium) {
        if (!cancelled) setSnap({ ...BASELINE, tier: "free" });
        return;
      }

      // Premium/admin — read real status (own rows only; no writes, no generation).
      const [rotationsRes, steamRes] = await Promise.all([
        supabase
          .from("user_premium_rotations")
          .select("type, status")
          .eq("user_id", user.id)
          .eq("status", "published"),
        supabase
          .from("user_steam_connections")
          .select("steam_id, game_count, taste_dna")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const publishedTypes = new Set(
        (rotationsRes.data ?? []).map((r) => (r as { type?: string }).type)
      );
      const steam = steamRes.data as
        | { steam_id?: string | null; game_count?: number | null; taste_dna?: unknown }
        | null;

      if (cancelled) return;
      setSnap({
        tier: "premium",
        steamConnected: Boolean(steam?.steam_id),
        tasteDnaBuilt: steam?.taste_dna != null,
        steamGameCount:
          typeof steam?.game_count === "number" ? steam.game_count : null,
        weeklyReady: publishedTypes.has("weekly_picks"),
        dealsReady: publishedTypes.has("deals_for_you"),
        recapReady: publishedTypes.has("monthly_recap"),
      });
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = buildCards(snap);

  return (
    <div className="mt-16">
      <div className="flex items-center gap-2.5">
        <h2 className={`text-sm font-semibold uppercase tracking-[0.14em] ${BODY}`}>Personal</h2>
        <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300">
          Premium
        </span>
      </div>
      <p className={`mt-2 max-w-2xl text-sm leading-6 ${BODY}`}>
        Taste-driven tools built from your library, saved searches, and tracked games.
        {snap.tier !== "premium" ? " Open any tool to see how it works." : ""}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`group relative flex flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15 ${CARD}`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300">
                <Icon>{ICONS[card.key]}</Icon>
              </span>
            </div>
            <h3 className={`mt-5 text-lg font-semibold tracking-tight ${HEADING}`}>{card.title}</h3>
            <p className={`mt-2 flex-1 text-sm leading-6 ${BODY}`}>{card.desc}</p>
            {card.status ? (
              <p className="mt-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                {card.status}
              </p>
            ) : null}
            <span className={`${card.status ? "mt-3" : "mt-5"} inline-flex items-center text-sm font-semibold text-blue-600 transition group-hover:opacity-80 dark:text-blue-300`}>
              {card.cta}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
