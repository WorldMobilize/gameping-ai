/**
 * Marketing teaser only — no Steam integration, APIs, or auth.
 */

function LibraryGlyph({
  className,
  gradientId,
}: {
  className?: string;
  gradientId: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="rgb(34 211 238)" stopOpacity="0.9" />
          <stop offset="1" stopColor="rgb(168 85 247)" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect
        x="6"
        y="10"
        width="36"
        height="28"
        rx="4"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="rgb(5 6 15 / 0.6)"
      />
      <path
        d="M12 18h24M12 24h18M12 30h22"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

type SteamTasteComingSoonProps = {
  /** Unique prefix for SVG defs when multiple sections render on one page. */
  idPrefix?: string;
  /** Tighter vertical rhythm on long pages (e.g. upgrade). */
  density?: "default" | "compact";
};

export default function SteamTasteComingSoon({
  idPrefix = "steam-taste",
  density = "default",
}: SteamTasteComingSoonProps) {
  const py = density === "compact" ? "py-14 md:py-16" : "py-20 md:py-24";
  const gidMain = `${idPrefix}-g-main`;
  const gidCard = `${idPrefix}-g-card`;
  const headingId = `${idPrefix}-heading`;

  return (
    <section
      className={`relative isolate overflow-hidden rounded-b-[2rem] px-6 sm:rounded-b-[2.5rem] ${py}`}
      aria-labelledby={headingId}
    >
      {/* Atmospheric backdrop — clipped to this section only (no upward bleed) */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-500/[0.06] via-transparent to-transparent" />
        <div className="absolute left-0 top-0 h-[72%] w-[92%] max-w-[56rem] -translate-x-[10%] bg-[radial-gradient(ellipse_75%_65%_at_30%_18%,rgba(34,211,238,0.13)_0%,rgba(34,211,238,0.04)_42%,transparent_72%)] blur-2xl" />
        <div className="absolute bottom-0 right-0 h-[75%] w-[70%] max-w-[44rem] translate-x-[8%] bg-[radial-gradient(ellipse_70%_60%_at_72%_82%,rgba(147,51,234,0.12)_0%,rgba(147,51,234,0.04)_45%,transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[10%] left-0 h-[50%] w-[48%] bg-[radial-gradient(ellipse_55%_50%_at_22%_58%,rgba(100,116,139,0.07)_0%,transparent_68%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#05060f] via-[#05060f]/85 to-transparent sm:h-40" />
        <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-amber-400/35 bg-amber-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/95">
                Coming soon
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                Future Premium feature
              </span>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="hidden shrink-0 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-3 shadow-[0_0_32px_rgba(34,211,238,0.12)] sm:block">
                <LibraryGlyph className="h-12 w-12" gradientId={gidMain} />
              </div>
              <div>
                <h2
                  id={headingId}
                  className="text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-[2.35rem]"
                >
                  Import your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                    Steam taste profile
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
                  Connect your Steam profile so GamePing AI can learn from your library, playtime, and
                  favorite genres—then surface smarter recommendations and more personalized deal
                  alerts.
                </p>
              </div>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Owned games as taste signal",
                "Favorite genres & tags inferred",
                "Playtime patterns for better fit",
                "Sharper AI match explanations",
                "Deal alerts tuned to what you actually play",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/75"
                >
                  <span className="select-none text-cyan-400/90" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-xl text-xs leading-relaxed text-white/45">
              Availability may depend on Steam privacy settings. We&apos;ll only request the data
              needed for recommendations—never sold to third parties for unrelated marketing.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled
                aria-disabled
                title="Steam import is not available yet"
                className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 text-sm font-black text-white/45 opacity-70"
              >
                Join early access
              </button>
              <p className="text-xs text-white/40 sm:max-w-[14rem]">
                No connection yet—this button is disabled until the feature ships.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-slate-600/25 via-cyan-500/15 to-purple-600/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#0a0b14]/90 shadow-[0_0_48px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <LibraryGlyph className="h-8 w-8 sm:hidden" gradientId={gidCard} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Preview
                    </p>
                    <p className="text-sm font-black text-white/90">Taste snapshot</p>
                  </div>
                </div>
                <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200/90">
                  Mock UI
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                    Inferred genres
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Roguelike", "Narrative", "Cozy sim"].map((g) => (
                      <span
                        key={g}
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200/90"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                    Library signal (sample)
                  </p>
                  <ul className="mt-2 space-y-2">
                    {[
                      { t: "Hades", h: "42h" },
                      { t: "Stardew Valley", h: "88h" },
                      { t: "Disco Elysium", h: "31h" },
                    ].map((row) => (
                      <li
                        key={row.t}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5 text-sm"
                      >
                        <span className="font-bold text-white/85">{row.t}</span>
                        <span className="font-mono text-xs text-white/40">{row.h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-center text-[11px] leading-relaxed text-white/35">
                  Illustrative data only — not connected to a real account.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
