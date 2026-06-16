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
          <stop stopColor="rgb(8 145 178)" stopOpacity="0.95" />
          <stop offset="1" stopColor="rgb(124 58 237)" stopOpacity="0.8" />
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
        fill="rgb(248 250 252 / 0.9)"
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
      className={`relative isolate px-0 ${py}`}
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute -inset-x-10 inset-y-0 z-0 sm:-inset-x-20"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                Coming soon
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Future Premium feature
              </span>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="hidden shrink-0 rounded-2xl border border-cyan-200/80 bg-cyan-50 p-3 shadow-sm sm:block">
                <LibraryGlyph className="h-12 w-12" gradientId={gidMain} />
              </div>
              <div>
                <h2
                  id={headingId}
                  className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-[2.35rem] gp-home-display"
                >
                  Import your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-violet-600">
                    Steam taste profile
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
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
                  className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <span className="select-none text-cyan-600" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-xl text-xs leading-relaxed text-slate-500">
              Availability may depend on Steam privacy settings. We&apos;ll only request the data
              needed for recommendations—never sold to third parties for unrelated marketing.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled
                aria-disabled
                title="Steam import is not available yet"
                className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-8 py-3.5 text-sm font-semibold text-slate-400 opacity-70"
              >
                Join early access
              </button>
              <p className="text-xs text-slate-500 sm:max-w-[14rem]">
                No connection yet—this button is disabled until the feature ships.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-cyan-200/30 via-white to-violet-200/30 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40">
              <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <LibraryGlyph className="h-8 w-8 sm:hidden" gradientId={gidCard} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Preview
                    </p>
                    <p className="text-sm font-bold text-slate-900">Taste snapshot</p>
                  </div>
                </div>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
                  Mock UI
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Inferred genres
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Roguelike", "Narrative", "Cozy sim"].map((g) => (
                      <span
                        key={g}
                        className="rounded-full border border-cyan-200/80 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                        className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-2.5 text-sm"
                      >
                        <span className="font-semibold text-slate-800">{row.t}</span>
                        <span className="font-mono text-xs text-slate-500">{row.h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-[11px] leading-relaxed text-slate-500">
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
