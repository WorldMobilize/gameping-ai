"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_CARD, APP_INPUT } from "@/components/app/app-styles";
import { useToast } from "@/components/ToastProvider";

type TopGame = {
  steamAppId: number;
  title: string;
  playtimeForever: number;
  playtime2weeks: number | null;
};

type LibrarySummary = {
  connected: boolean;
  steamId?: string;
  profileUrl?: string | null;
  gameCount?: number;
  totalPlaytimeMin?: number;
  topGames?: TopGame[];
  importedAt?: string;
};

function formatPlaytime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const STEAM_IMPORT_CTA =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--page-accent-strong)] to-[var(--page-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--page-accent-on)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50";

export default function SteamLibraryImportSection() {
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [profileInput, setProfileInput] = useState("");
  const [summary, setSummary] = useState<LibrarySummary | null>(null);

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      const accessRes = await fetch("/api/steam/access", { credentials: "include" });
      const accessJson = (await accessRes.json()) as {
        visible?: boolean;
        canImport?: boolean;
      };
      if (!accessRes.ok || !accessJson.visible) {
        setVisible(false);
        setSummary(null);
        return;
      }

      setVisible(true);

      const libRes = await fetch("/api/steam/library", { credentials: "include" });
      if (libRes.status === 404 || libRes.status === 403) {
        setVisible(false);
        setSummary(null);
        return;
      }
      const libJson = (await libRes.json()) as LibrarySummary & { error?: string };
      if (!libRes.ok) {
        setSummary({ connected: false });
        return;
      }
      setSummary(libJson);
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadState();
    });
  }, [loadState]);

  async function onImport() {
    const trimmed = profileInput.trim();
    if (!trimmed) {
      showToast({ variant: "error", message: "Enter your Steam profile URL or Steam ID." });
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/steam/import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileInput: trimmed }),
      });
      const json = (await res.json()) as {
        error?: string;
        gameCount?: number;
        totalPlaytimeMin?: number;
        topGames?: TopGame[];
        importedAt?: string;
        steamId?: string;
        profileUrl?: string;
      };

      if (!res.ok) {
        showToast({
          variant: "error",
          message: json.error || "Could not import Steam library.",
        });
        return;
      }

      setSummary({
        connected: true,
        steamId: json.steamId,
        profileUrl: json.profileUrl,
        gameCount: json.gameCount,
        totalPlaytimeMin: json.totalPlaytimeMin,
        topGames: json.topGames,
        importedAt: json.importedAt,
      });
      showToast({
        variant: "success",
        message: `Imported ${json.gameCount ?? 0} games from Steam.`,
      });
    } finally {
      setImporting(false);
    }
  }

  async function onDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/steam/library", {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast({
          variant: "error",
          message: json.error || "Could not disconnect Steam library.",
        });
        return;
      }
      setSummary({ connected: false });
      setProfileInput("");
      showToast({ variant: "success", message: "Steam library disconnected." });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading || !visible) return null;

  const connected = summary?.connected === true;
  const connectedNoGames = connected && (summary?.gameCount ?? 0) === 0;

  return (
    <section
      id="steam-library-import"
      className={`${APP_CARD} border-[color:var(--page-accent-border)] p-8`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
        Steam Library Import
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        Import your public Steam library so GamePing can learn your taste. It powers your
        personalized Weekly Picks, Deals For You, and Monthly Recap.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        We only read game names and playtime. We never access friends, chat, inventory,
        payments, or your Steam account.
      </p>

      {!connected ? (
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Steam profile URL or Steam ID
          </label>
          <input
            type="text"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            placeholder="https://steamcommunity.com/id/yourname"
            className={APP_INPUT}
            disabled={importing}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => void onImport()}
            className={STEAM_IMPORT_CTA}
          >
            {importing ? "Importing…" : "Import library"}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600 dark:text-slate-400">Games imported</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{summary.gameCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600 dark:text-slate-400">Total playtime</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {formatPlaytime(summary.totalPlaytimeMin ?? 0)}
                </dd>
              </div>
              {summary.profileUrl ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600 dark:text-slate-400">Profile</dt>
                  <dd className="truncate font-semibold text-[color:var(--page-accent-text)]">
                    <a
                      href={summary.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View on Steam
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {connectedNoGames ? (
            <div className="space-y-3 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
                Connected, but we couldn&apos;t see any games. Your Steam{" "}
                <span className="font-semibold">profile and game details</span> may be set to private
                — set &ldquo;Game details&rdquo; to <span className="font-semibold">Public</span> in
                your Steam privacy settings, then re-import.
              </p>
              <input
                type="text"
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                placeholder="https://steamcommunity.com/id/yourname"
                className={APP_INPUT}
                disabled={importing}
              />
              <button
                type="button"
                disabled={importing}
                onClick={() => void onImport()}
                className={STEAM_IMPORT_CTA}
              >
                {importing ? "Importing…" : "Re-import library"}
              </button>
            </div>
          ) : (
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">
              Used to personalize your Weekly Picks, Deals For You, and Monthly Recap.
            </p>
          )}

          {summary.topGames && summary.topGames.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-400">
                Top played
              </p>
              <ol className="mt-3 space-y-2">
                {summary.topGames.map((game) => (
                  <li
                    key={game.steamAppId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{game.title}</span>
                    <span className="shrink-0 text-slate-600 dark:text-slate-400">
                      {formatPlaytime(game.playtimeForever)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <button
            type="button"
            disabled={disconnecting}
            onClick={() => void onDisconnect()}
            className="inline-flex items-center justify-center rounded-full border border-rose-300/70 bg-rose-50/70 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:border-rose-500/50 dark:hover:bg-rose-500/20"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect Steam library"}
          </button>
        </div>
      )}
    </section>
  );
}
