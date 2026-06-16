"use client";

import { HOME_GAMING_RADAR } from "@/components/home/home-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { HomeProductPanel, HomeSectionShell } from "@/components/home/HomeVisualPrimitives";

export default function HomeGamingRadar() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  const muted = isDark ? "text-slate-500" : "text-slate-400";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const body = isDark ? "text-slate-400" : "text-slate-600";
  const row = isDark ? "border-slate-700 bg-slate-950/50" : "border-slate-100 bg-slate-50/90";
  const chip = isDark
    ? "rounded-full bg-cyan-950/70 px-2.5 py-1 text-[11px] font-bold text-cyan-300"
    : "rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-bold text-cyan-800";
  const alertNow = isDark
    ? "border-emerald-500/25 bg-emerald-950/40 text-emerald-200"
    : "border-emerald-200 bg-emerald-50/90 text-emerald-900";
  const alertSoon = isDark
    ? "border-violet-500/25 bg-violet-950/40 text-violet-200"
    : "border-violet-200 bg-violet-50/90 text-violet-900";
  const soonBadge = isDark
    ? "bg-violet-950/80 text-violet-300"
    : "bg-violet-100 text-violet-700";

  return (
    <HomeSectionShell tone="gaming-radar" ariaLabelledby="gaming-radar-heading">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <header>
          <h2
            id="gaming-radar-heading"
            className={`text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] ${text}`}
          >
            Your personal gaming radar
          </h2>
          <p className={`mt-4 max-w-md text-lg leading-relaxed ${body}`}>
            GamePing is building toward a discovery radar — helping you find the right game at
            the right moment. Some pieces work today; smarter taste alerts are on the way.
          </p>
          <div className="mt-6 space-y-3">
            <p className={`text-sm font-semibold ${text}`}>Available today</p>
            <p className={`text-sm ${body}`}>
              GamePing can notify you when {HOME_GAMING_RADAR.notifyNow}.
            </p>
            <p className={`mt-4 text-sm font-semibold ${text}`}>
              Coming soon{" "}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${soonBadge}`}>
                Roadmap
              </span>
            </p>
            <ul className={`space-y-1.5 text-sm ${body}`}>
              {HOME_GAMING_RADAR.notifyComingSoon.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className={isDark ? "text-violet-400" : "text-violet-600"} aria-hidden>
                    ✦
                  </span>
                  Notifications when {item}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <div aria-label="Gaming radar preview">
          <HomeProductPanel kicker="Your radar" float={false}>
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${muted}`}>Taste signals</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HOME_GAMING_RADAR.tasteSignals.map((signal) => (
                    <span key={signal} className={chip}>
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${row}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${muted}`}>Sources</p>
                <ul className={`mt-2 space-y-1.5 text-sm ${body}`}>
                  {HOME_GAMING_RADAR.sourcesNow.map((source) => (
                    <li key={source} className="flex gap-2">
                      <span className={isDark ? "text-emerald-400" : "text-emerald-600"} aria-hidden>
                        ✓
                      </span>
                      {source}
                    </li>
                  ))}
                  {HOME_GAMING_RADAR.sourcesComingSoon.map((source) => (
                    <li key={source} className="flex flex-wrap items-center gap-2">
                      <span className={isDark ? "text-slate-500" : "text-slate-400"} aria-hidden>
                        ○
                      </span>
                      {source}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${soonBadge}`}>
                        Coming soon
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${muted}`}>Alerts</p>
                <ul className="mt-2 space-y-2">
                  {HOME_GAMING_RADAR.alertsNow.map((alertText) => (
                    <li key={alertText} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${alertNow}`}>
                      {alertText}
                    </li>
                  ))}
                  {HOME_GAMING_RADAR.alertsComingSoon.map((alertText) => (
                    <li key={alertText} className={`rounded-xl border px-3 py-2.5 text-sm ${alertSoon}`}>
                      <span className="font-medium">{alertText}</span>
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${soonBadge}`}>
                        Coming soon
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </HomeProductPanel>
        </div>
      </div>
    </HomeSectionShell>
  );
}
