"use client";

import { useEffect, useRef, useState } from "react";
import { saveClaim, type Claim, type ClaimInput } from "@/lib/worldmobilize/claims-store";
import type { Territory } from "@/lib/worldmobilize/territories";

/**
 * Claim / edit modal. Community name required; YouTube/Twitch/Discord optional
 * with light URL validation. On success, hands the saved claim back to the
 * parent to update the board. No over-engineering — just enough to feel premium.
 */

function normalizeUrl(value: string): { url: string | null; valid: boolean } {
  const t = value.trim();
  if (!t) return { url: null, valid: true };
  try {
    const u = new URL(t.startsWith("http://") || t.startsWith("https://") ? t : `https://${t}`);
    return { url: u.href, valid: Boolean(u.hostname.includes(".")) };
  } catch {
    return { url: null, valid: false };
  }
}

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-slate-500";
const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400";

export default function ClaimModal({
  territory,
  existingClaim,
  onClose,
  onSaved,
}: {
  territory: Territory;
  existingClaim: Claim | null;
  onClose: () => void;
  onSaved: (claim: Claim) => void;
}) {
  const isEdit = Boolean(existingClaim);
  const [community, setCommunity] = useState(existingClaim?.community_name ?? "");
  const [youtube, setYoutube] = useState(existingClaim?.youtube_url ?? "");
  const [twitch, setTwitch] = useState(existingClaim?.twitch_url ?? "");
  const [discord, setDiscord] = useState(existingClaim?.discord_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!community.trim()) {
      setError("Community name is required.");
      return;
    }
    const yt = normalizeUrl(youtube);
    const tw = normalizeUrl(twitch);
    const dc = normalizeUrl(discord);
    if (!yt.valid) return setError("That YouTube link doesn't look like a valid URL.");
    if (!tw.valid) return setError("That Twitch link doesn't look like a valid URL.");
    if (!dc.valid) return setError("That Discord link doesn't look like a valid URL.");

    const input: ClaimInput = {
      territory_id: territory.id,
      territory_name: territory.name,
      community_name: community.trim().slice(0, 60),
      youtube_url: yt.url,
      twitch_url: tw.url,
      discord_url: dc.url,
    };

    setSubmitting(true);
    try {
      const result = await saveClaim(input, isEdit ? "edit" : "create");
      if (!result.ok) {
        setError(
          result.error === "already_claimed"
            ? "This territory was just claimed by someone else."
            : result.error === "not_authenticated"
              ? "Please log in to claim a territory."
              : "Something went wrong. Please try again."
        );
        return;
      }
      onSaved(result.claim);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${isEdit ? "Edit" : "Claim"} ${territory.name}`}
        className="relative w-full max-w-md rounded-t-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0c111d] sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ring-1 ring-inset"
            style={{ backgroundColor: `${territory.accent}1f`, boxShadow: `inset 0 0 0 1px ${territory.accent}44` }}
          >
            {territory.glyph}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: territory.accent }}>{territory.category}</p>
            <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">{territory.name}</h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {isEdit ? "Update your community and links." : "Claim this territory for your community and show your identity."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="wm-community" className={LABEL}>Community name <span className="text-rose-500">*</span></label>
            <input id="wm-community" ref={firstRef} className={FIELD} placeholder="e.g. Emerald Vanguard" value={community} maxLength={60} onChange={(e) => setCommunity(e.target.value)} />
          </div>
          <div>
            <label htmlFor="wm-youtube" className={LABEL}>YouTube</label>
            <input id="wm-youtube" className={FIELD} placeholder="youtube.com/@yourchannel" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
          </div>
          <div>
            <label htmlFor="wm-twitch" className={LABEL}>Twitch</label>
            <input id="wm-twitch" className={FIELD} placeholder="twitch.tv/yourchannel" value={twitch} onChange={(e) => setTwitch(e.target.value)} />
          </div>
          <div>
            <label htmlFor="wm-discord" className={LABEL}>Discord</label>
            <input id="wm-discord" className={FIELD} placeholder="discord.gg/invite" value={discord} onChange={(e) => setDiscord(e.target.value)} />
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">{error}</p> : null}

          <div className="mt-1 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/12 dark:text-slate-200 dark:hover:bg-white/[0.04]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(139,92,246,0.6)] transition hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Claim territory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
