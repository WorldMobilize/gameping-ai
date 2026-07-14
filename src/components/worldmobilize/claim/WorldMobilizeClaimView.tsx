"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import ClaimModal from "@/components/worldmobilize/claim/ClaimModal";
import {
  fetchClaims,
  getCurrentUser,
  getPersistenceMode,
  type Claim,
  type CurrentUser,
} from "@/lib/worldmobilize/claims-store";
import { TERRITORIES, type Territory } from "@/lib/worldmobilize/territories";

/**
 * WorldMobilize — Claim Territory Demo (MVP).
 *
 * Logged-in users claim a game-community territory, add YouTube/Twitch/Discord
 * links, and see ownership on hover. Persistence is Supabase-first with a
 * localStorage fallback (see claims-store). No battles / wars / payments — this
 * is the first playable proof only.
 */

type ModalState =
  | { kind: "claim"; territory: Territory }
  | { kind: "edit"; territory: Territory; claim: Claim }
  | { kind: "login" }
  | null;

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const DEMO_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-dashed border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-300";

export default function WorldMobilizeClaimView() {
  const { showToast } = useToast();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [claims, setClaims] = useState<Record<string, Claim>>({});
  const [loading, setLoading] = useState(true);
  const [local, setLocal] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const [u, rows] = await Promise.all([getCurrentUser(), fetchClaims()]);
      if (cancelled) return;
      setUser(u);
      setClaims(Object.fromEntries(rows.map((c) => [c.territory_id, c])));
      setLocal(getPersistenceMode() === "local");
      setLoading(false);
    };
    // Deferred so the effect never sets state synchronously in its body.
    const id = requestAnimationFrame(() => void run());
    const { data } = supabase.auth.onAuthStateChange(() => {
      void getCurrentUser().then((u) => {
        if (!cancelled) setUser(u);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      data.subscription.unsubscribe();
    };
  }, []);

  const claimedCount = Object.keys(claims).length;

  const handleTileClick = (territory: Territory) => {
    const claim = claims[territory.id];
    if (claim) {
      if (user && claim.user_id === user.id) {
        setModal({ kind: "edit", territory, claim });
      } else {
        // Claimed by someone else — toggle the info overlay (works on touch).
        setPinned((p) => (p === territory.id ? null : territory.id));
      }
      return;
    }
    if (!user) {
      setModal({ kind: "login" });
      return;
    }
    setModal({ kind: "claim", territory });
  };

  const handleSaved = (claim: Claim) => {
    setClaims((prev) => ({ ...prev, [claim.territory_id]: claim }));
    setModal(null);
    setLocal(getPersistenceMode() === "local");
    showToast({ variant: "success", message: `${claim.territory_name} is now flying your colors.` });
  };

  return (
    <section className="relative z-10 px-4 py-14 sm:px-6 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[680px] -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-600 dark:text-violet-300">World Mobilize</p>
          <span className={DEMO_PILL}>Demo · Early Access</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl gp-home-display">
          Claim your territory
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          WorldMobilize is a living map where gaming communities claim territory, show their
          identity, and prepare for future live battles.
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
          Represent your game. Defend your community. Make history.
        </p>

        {/* status row */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 dark:border-white/10 dark:bg-white/[0.03]">
            <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden />
            {claimedCount} / {TERRITORIES.length} claimed
          </span>
          {user ? (
            <span>Signed in as <span className="font-semibold text-slate-800 dark:text-white">{user.label}</span></span>
          ) : (
            <span>
              <Link href="/login?redirect=%2Fworldmobilize" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">Log in</Link> to claim a territory.
            </span>
          )}
        </div>

        {local ? (
          <p className="mt-4 rounded-xl border border-amber-300/50 bg-amber-50/70 px-4 py-2.5 text-xs leading-5 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
            Demo persistence: the claims table isn&apos;t set up yet, so claims are saved in this browser only.
            Run <code className="rounded bg-black/5 px-1 dark:bg-white/10">sql/worldmobilize_claims.sql</code> in Supabase for shared, permanent claims.
          </p>
        ) : null}

        {/* Board */}
        <div className="mt-10 rounded-3xl border border-slate-200/70 bg-white/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.015] sm:p-6">
          <div aria-hidden className="pointer-events-none absolute" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {TERRITORIES.map((t) => (
              <TerritoryTile
                key={t.id}
                territory={t}
                claim={claims[t.id] ?? null}
                isOwner={Boolean(user && claims[t.id]?.user_id === user.id)}
                open={pinned === t.id}
                loading={loading}
                onClick={() => handleTileClick(t)}
              />
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Demo only — battles, supporters, and live events aren&apos;t implemented yet. Hover a
          territory to see who holds it.
        </p>
      </div>

      {/* Modals */}
      {modal?.kind === "claim" ? (
        <ClaimModal territory={modal.territory} existingClaim={null} onClose={() => setModal(null)} onSaved={handleSaved} />
      ) : null}
      {modal?.kind === "edit" ? (
        <ClaimModal territory={modal.territory} existingClaim={modal.claim} onClose={() => setModal(null)} onSaved={handleSaved} />
      ) : null}
      {modal?.kind === "login" ? <LoginPrompt onClose={() => setModal(null)} /> : null}
    </section>
  );
}

/* ── Territory tile + hover overlay ─────────────────────────── */

function TerritoryTile({
  territory,
  claim,
  isOwner,
  open,
  loading,
  onClick,
}: {
  territory: Territory;
  claim: Claim | null;
  isOwner: boolean;
  open: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const claimed = Boolean(claim);
  const date = formatDate(claim?.created_at);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label={claimed ? `${territory.name} — claimed by ${claim?.community_name}` : `${territory.name} — unclaimed`}
        className={`relative flex aspect-[4/3] w-full flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
          claimed
            ? "hover:-translate-y-0.5"
            : "border-slate-200/80 bg-white/60 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/15"
        }`}
        style={
          claimed
            ? {
                borderColor: `${territory.accent}66`,
                background: `linear-gradient(160deg, ${territory.accent}1f, transparent 70%)`,
                boxShadow: `0 12px 34px -18px ${territory.accent}, inset 0 0 0 1px ${territory.accent}22`,
              }
            : undefined
        }
      >
        <div className="flex items-start justify-between">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${claimed ? "" : "opacity-70 grayscale"}`}
            style={claimed ? { backgroundColor: `${territory.accent}26` } : { background: "rgba(120,120,140,0.1)" }}
          >
            {territory.glyph}
          </span>
          {claimed ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]" style={{ backgroundColor: `${territory.accent}22`, color: territory.accent }}>
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: territory.accent }} aria-hidden />
              Held
            </span>
          ) : (
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">Open</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{territory.name}</p>
          {claimed ? (
            <p className="truncate text-xs font-medium" style={{ color: territory.accent }}>{claim?.community_name}</p>
          ) : (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{territory.category}</p>
          )}
        </div>
      </button>

      {/* Hover / focus / pinned overlay */}
      <div
        className={`absolute bottom-[calc(100%+8px)] left-1/2 z-40 w-64 max-w-[82vw] -translate-x-1/2 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 dark:border-white/10 dark:bg-[#0c111d]/95 ${
          open ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        }`}
        role="tooltip"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{territory.glyph}</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{territory.name}</p>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{territory.category}</p>

        {claimed ? (
          <>
            <div className="mt-3 space-y-1.5 border-t border-slate-200/70 pt-3 text-xs dark:border-white/10">
              <Row label="Claimed by" value={claim?.community_name ?? "—"} accent={territory.accent} />
              <Row label="Owner" value={claim?.owner_label ?? "—"} />
              {date ? <Row label="Claimed" value={date} /> : null}
            </div>
            {(claim?.youtube_url || claim?.twitch_url || claim?.discord_url) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {claim?.youtube_url ? <LinkChip href={claim.youtube_url} label="YouTube" /> : null}
                {claim?.twitch_url ? <LinkChip href={claim.twitch_url} label="Twitch" /> : null}
                {claim?.discord_url ? <LinkChip href={claim.discord_url} label="Discord" /> : null}
              </div>
            ) : null}
            {isOwner ? <p className="mt-3 text-[11px] font-semibold" style={{ color: territory.accent }}>You hold this — click to edit.</p> : null}
          </>
        ) : (
          <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">Unclaimed territory.</p>
            <p className="mt-1 text-[11px] font-semibold text-violet-600 dark:text-violet-300">Click to claim it.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400 dark:text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate font-semibold text-slate-800 dark:text-slate-100" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-violet-400 dark:hover:text-violet-300"
    >
      {label}
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

/* ── Login required prompt ──────────────────────────────────── */

function LoginPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-2xl dark:border-white/10 dark:bg-[#0c111d]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-600 ring-1 ring-inset ring-violet-500/20 dark:text-violet-300">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" /></svg>
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Log in to claim territory</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Claiming a territory needs a GamePing account, so it&apos;s yours to edit.</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/12 dark:text-slate-200 dark:hover:bg-white/[0.04]">Not now</button>
          <Link href="/login?redirect=%2Fworldmobilize" className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">Log in</Link>
        </div>
      </div>
    </div>
  );
}
