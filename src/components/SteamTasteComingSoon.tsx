/**
 * Steam import promo for /upgrade. Steam import is LIVE (premium-gated), so this
 * presents it as usable and links to the real import in account settings — the
 * preview card below is a labeled sample, not a live account.
 */

import Link from "next/link";

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
          <stop stopColor="rgb(182 130 36)" stopOpacity="0.95" />
          <stop offset="1" stopColor="rgb(214 168 79)" stopOpacity="0.9" />
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
  /** Override inner width constraint (e.g. full width inside a wide parent). */
  containerClassName?: string;
  /** Extra section spacing (e.g. gap after pricing on /upgrade). */
  sectionClassName?: string;
};

export default function SteamTasteComingSoon({
  idPrefix = "steam-taste",
  density = "default",
  containerClassName = "relative z-10 mx-auto max-w-6xl",
  sectionClassName = "",
}: SteamTasteComingSoonProps) {
  const py =
    density === "compact"
      ? "pt-12 pb-14 md:pt-16 md:pb-16"
      : "py-20 md:py-24";
  const gidMain = `${idPrefix}-g-main`;
  const gidCard = `${idPrefix}-g-card`;
  const headingId = `${idPrefix}-heading`;

  return (
    <section
      className={`relative isolate px-0 ${py} ${sectionClassName}`}
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute -inset-x-10 inset-y-0 z-0 sm:-inset-x-20"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-400/10" />
      </div>

      <div className={containerClassName}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a14] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                Available now
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-400">
                Premium feature
              </span>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="shrink-0 rounded-2xl border border-amber-300/70 bg-amber-50 p-3 shadow-sm dark:border-amber-700/40 dark:bg-amber-950/30">
                <LibraryGlyph className="h-11 w-11 sm:h-12 sm:w-12" gradientId={gidMain} />
              </div>
              <div>
                <h2
                  id={headingId}
                  className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl lg:text-[2.35rem] gp-home-display"
                >
                  Import your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B98224] to-[#D6A84F] dark:from-[#F4D58D] dark:to-[#D6A84F]">
                    Steam taste profile
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
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
                  className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-200 dark:shadow-slate-950/30"
                >
                  <span className="select-none text-[#B98224] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-xl text-xs leading-relaxed text-slate-300 dark:text-slate-400">
              Availability may depend on Steam privacy settings. We&apos;ll only request the data
              needed for recommendations—never sold to third parties for unrelated marketing.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/settings/account#steam-library-import"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#B98224] to-[#D6A84F] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                Import your Steam library
              </Link>
              <p className="text-xs text-slate-300 dark:text-slate-400 sm:max-w-[14rem]">
                Connect from your account settings — Premium &amp; available now.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-amber-200/10 via-transparent to-amber-200/10 blur-xl dark:from-amber-400/10 dark:via-transparent dark:to-amber-500/10" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-950/40">
              <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <LibraryGlyph className="h-8 w-8 sm:hidden" gradientId={gidCard} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                      Preview
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Taste snapshot</p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a6a14] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                  Sample
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Inferred genres
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Roguelike", "Narrative", "Cozy sim"].map((g) => (
                      <span
                        key={g}
                        className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                        className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800/80 dark:bg-slate-950/30"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{row.t}</span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-[11px] leading-relaxed text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/25 dark:text-slate-400">
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
