"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_CARD, APP_INPUT, APP_SECONDARY_CTA } from "@/components/app/app-styles";
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
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50";

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

  return (
    <section
      id="steam-library-import"
      className={`${APP_CARD} border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-white p-8`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
        Steam Library Import
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Import your public Steam library so GamePing can learn your taste. Taste-based
        recommendations are coming next.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        We only read game names and playtime. We never access friends, chat, inventory,
        payments, or your Steam account.
      </p>

      {!connected ? (
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
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
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold text-emerald-700">Connected</p>
            <dl className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Games imported</dt>
                <dd className="font-semibold">{summary.gameCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Total playtime</dt>
                <dd className="font-semibold">
                  {formatPlaytime(summary.totalPlaytimeMin ?? 0)}
                </dd>
              </div>
              {summary.profileUrl ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Profile</dt>
                  <dd className="truncate font-semibold text-cyan-700">
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

          {summary.topGames && summary.topGames.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Top played
              </p>
              <ol className="mt-3 space-y-2">
                {summary.topGames.map((game) => (
                  <li
                    key={game.steamAppId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm"
                  >
                    <span className="font-semibold text-slate-800">{game.title}</span>
                    <span className="shrink-0 text-slate-500">
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
            className={`${APP_SECONDARY_CTA} border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50`}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect Steam library"}
          </button>
        </div>
      )}
    </section>
  );
}
