"use client";

import { useCallback, useEffect, useState } from "react";
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
    void loadState();
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
      className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-8"
    >
      <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200/90">
        Steam Library Import
      </p>
      <p className="mt-3 text-sm leading-7 text-white/65">
        Import your public Steam library so GamePing can learn your taste. Taste-based
        recommendations are coming next.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        We only read game names and playtime. We never access friends, chat, inventory,
        payments, or your Steam account.
      </p>

      {!connected ? (
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50">
            Steam profile URL or Steam ID
          </label>
          <input
            type="text"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            placeholder="https://steamcommunity.com/id/yourname"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/25"
            disabled={importing}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => void onImport()}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-black transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import library"}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-sm font-bold text-emerald-200">Connected</p>
            <dl className="mt-4 space-y-2 text-sm text-white/75">
              <div className="flex justify-between gap-4">
                <dt className="text-white/45">Games imported</dt>
                <dd className="font-bold">{summary.gameCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/45">Total playtime</dt>
                <dd className="font-bold">
                  {formatPlaytime(summary.totalPlaytimeMin ?? 0)}
                </dd>
              </div>
              {summary.profileUrl ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-white/45">Profile</dt>
                  <dd className="truncate font-bold text-cyan-200">
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
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
                Top played
              </p>
              <ol className="mt-3 space-y-2">
                {summary.topGames.map((game) => (
                  <li
                    key={game.steamAppId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-white/90">{game.title}</span>
                    <span className="shrink-0 text-white/50">
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
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white/75 transition hover:border-rose-400/40 hover:text-rose-200 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect Steam library"}
          </button>
        </div>
      )}
    </section>
  );
}
