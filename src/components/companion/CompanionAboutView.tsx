import Link from "next/link";
import { NAVY_CTA, NAVY_CTA_LG, NAVY_OUTLINE } from "@/components/app/app-styles";
import { COMPANION_VERSION } from "@/lib/companion/release";

/**
 * "How Companion works" — the detailed, non-technical breakdown of the desktop
 * Companion. Server component, indexable: it's the deep page linked from the
 * lighter /companion overview.
 *
 * Everything here describes what Companion DOES TODAY in its alpha. No future
 * features are promised in the present tense — the only forward-looking content
 * is the explicit "Known limitations" section, framed as such. If a capability
 * moves (e.g. cloud history sync, game auto-detection, macOS), update this page;
 * don't let the copy drift ahead of the build.
 */

const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-400";
const CARD = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";

const CONTROLS: { key: string; action: string }[] = [
  { key: "Alt + G", action: "Show / hide the overlay" },
  { key: "Alt + M", action: "Voice input" },
  { key: "Esc", action: "Close the overlay" },
];

const POSITIONS: { title: string; desc: string }[] = [
  { title: "Top", desc: "Centered bar at the top of the screen (default)." },
  { title: "Left / right dock", desc: "A side panel docked to either edge." },
  { title: "Floating", desc: "A free, draggable window you place anywhere." },
];

const RESPONSE_TYPES: { title: string; desc: string }[] = [
  { title: "Text", desc: "Explanations, builds, strategies, troubleshooting." },
  { title: "Video", desc: "Guides and tutorials, embedded when available." },
  { title: "Image", desc: "Maps, screenshots, and visual references." },
  { title: "Music", desc: "Tracks and audio suggestions." },
];

const DASHBOARD: { section: string; desc: string }[] = [
  { section: "Home", desc: "Overview: your account plan, overlay status, and quick links." },
  { section: "Recent", desc: "Your last questions from the overlay on this PC (up to 50)." },
  { section: "Pinned", desc: "Answers you've pinned for quick reference." },
  { section: "Tracked Games", desc: "Games linked to your GamePing account (read-only)." },
  { section: "Price Alerts", desc: "Your account's price alerts (read-only; some features tied to Premium)." },
  { section: "Settings", desc: "Overlay layout, position, auto-hide, resume context, reset." },
];

const FOR_YOU: string[] = [
  "You play long sessions and get questions mid-game.",
  "You don't want to break flow with alt-tab.",
  "You already use GamePing on the web and want the same account in-game.",
  "You want text or rich-media answers — video, images — without opening YouTube or Google by hand.",
];

const NOT_FOR: string[] = [
  "A cheat engine, bot, or game-memory reader.",
  "A replacement for the site's price tracking or game library.",
  "A mobile or cross-platform app — it's Windows only today.",
];

const LIMITATIONS: string[] = [
  "Windows only — no macOS or Linux build yet.",
  "Alpha — some exclusive-fullscreen games may show visual instability.",
  "Exclusive fullscreen — in a few titles the overlay may not appear on top; it works better in windowed / borderless.",
  "Local history — Recent and Pinned are per-device, not synced across PCs.",
  "Voice — depends on your system's microphone / engine support; the voice UI is partly in Italian.",
  "Tracked games and alerts — viewable in the app, but managed on the site.",
];

type Cell = boolean | string;
const COMPARISON: { feature: string; site: Cell; companion: Cell }[] = [
  { feature: "Where", site: "Browser", companion: "Desktop + in-game overlay" },
  { feature: "Main use", site: "Discover games, recommendations, tracking, deals", companion: "Ask for help during the game" },
  { feature: "Account", site: true, companion: "Same login" },
  { feature: "AI / Ask", site: true, companion: "Same backend" },
  { feature: "In-game overlay", site: false, companion: true },
  { feature: "In-game ask history", site: false, companion: "Local" },
  { feature: "Manage tracked games / alerts", site: true, companion: "View only" },
];

function SectionShell({
  children,
  raised = false,
}: {
  children: React.ReactNode;
  raised?: boolean;
}) {
  return (
    <section
      className={`py-16 sm:py-24 ${
        raised
          ? "border-t border-slate-200/60 bg-slate-50/60 dark:border-white/[0.06] dark:bg-white/[0.015]"
          : ""
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">{children}</div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className={`text-[13px] font-semibold uppercase tracking-[0.18em] ${BODY}`}>{eyebrow}</p>
      ) : null}
      <h2 className={`gp-home-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl ${HEADING}`}>
        {title}
      </h2>
    </div>
  );
}

function Cell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12l5 5 9-11" />
        </svg>
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-600">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        <span className="sr-only">No</span>
      </span>
    );
  }
  return <span className={`text-sm ${BODY}`}>{value}</span>;
}

export default function CompanionAboutView() {
  return (
    <div className="relative z-10">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <p className={`text-[13px] font-semibold uppercase tracking-[0.18em] ${BODY}`}>
          Alpha · Windows · v{COMPANION_VERSION}
        </p>
        <h1 className={`gp-home-display mt-4 text-balance text-5xl font-semibold tracking-tight sm:text-6xl ${HEADING}`}>
          How Companion works
        </h1>
        <p className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl ${BODY}`}>
          Overlay, conversation, and your GamePing account — together. Companion doesn&apos;t
          replace the game: it appears on top when you call it, and disappears when you&apos;re done.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/companion" className={NAVY_CTA_LG}>Download &amp; get started</Link>
          <Link href="/recommend" className={NAVY_OUTLINE}>Try GamePing</Link>
        </div>
      </section>

      {/* The in-game experience */}
      <SectionShell raised>
        <SectionTitle eyebrow="The in-game experience" title="An overlay that stays out of the way" />
        <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${BODY}`}>
          Companion opens when you ask it to and hides when you want. The design rule is
          simple: never steal focus from the game.
        </p>

        {/* Controls */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-left">
            <thead>
              <tr className={`border-b border-slate-200/70 dark:border-white/10 ${BODY}`}>
                <th className="py-2 pr-6 text-xs font-semibold uppercase tracking-[0.14em]">Key</th>
                <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em]">Action</th>
              </tr>
            </thead>
            <tbody>
              {CONTROLS.map((c) => (
                <tr key={c.key} className="border-b border-slate-200/50 dark:border-white/[0.06]">
                  <td className="py-3 pr-6">
                    <kbd className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      {c.key}
                    </kbd>
                  </td>
                  <td className={`py-3 text-sm ${BODY}`}>{c.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Layout modes */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Compact</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>A slim bar for quick questions — top or side.</p>
          </div>
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Expanded</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>A larger panel for the conversation and longer answers.</p>
          </div>
        </div>

        {/* Positioning */}
        <h3 className={`mt-12 text-xl font-bold ${HEADING}`}>Where it sits</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {POSITIONS.map((p) => (
            <div key={p.title} className={`rounded-2xl border p-6 ${CARD}`}>
              <p className={`text-base font-semibold ${HEADING}`}>{p.title}</p>
              <p className={`mt-2 text-sm leading-6 ${BODY}`}>{p.desc}</p>
            </div>
          ))}
        </div>
        <p className={`mt-5 max-w-2xl text-sm leading-6 ${BODY}`}>
          On multi-monitor setups the position is remembered. You can reset everything from
          Settings in a click.
        </p>

        {/* Auto-hide + keep open */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Auto-hide (docks only)</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>
              On the top and side docks the overlay can hide after inactivity and return when
              you move the mouse to the edge — so it doesn&apos;t cover the screen during intense
              gameplay. Floating windows don&apos;t auto-hide.
            </p>
          </div>
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Keep open (lock)</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>
              A lock that stops auto-hide while you&apos;re reading a long answer or watching a video.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Questions & answers */}
      <SectionShell>
        <SectionTitle eyebrow="Questions & answers" title="Ask in words, choose how it answers" />
        <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${BODY}`}>
          Before you ask, pick what you need — then keep the conversation going without
          starting over.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESPONSE_TYPES.map((r) => (
            <div key={r.title} className={`rounded-2xl border p-6 ${CARD}`}>
              <p className={`text-base font-semibold ${HEADING}`}>{r.title}</p>
              <p className={`mt-2 text-sm leading-6 ${BODY}`}>{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Follow-ups, not one-shots</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>
              Ask &ldquo;and if I change build?&rdquo; or &ldquo;explain step 2&rdquo; — Companion keeps the
              context of the current session.
            </p>
          </div>
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Resume previous context</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>
              Reopen the overlay and Companion can offer to pick up your last in-game
              conversation. Accept, decline, or start fresh.
            </p>
          </div>
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Slash commands</p>
            <p className={`mt-2 text-sm leading-6 ${BODY}`}>
              Power-user shortcuts from the input — like <code>/help</code>, <code>/newtopic</code>,{" "}
              <code>/pin</code>, and switching modes — without leaving the bar.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* The desktop app */}
      <SectionShell raised>
        <SectionTitle eyebrow="Outside the game" title="The desktop app" />
        <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${BODY}`}>
          Companion has two faces: the minimal in-game overlay, and a desktop dashboard where
          you manage your account and history.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD.map((d) => (
            <div key={d.section} className={`rounded-2xl border p-6 ${CARD}`}>
              <p className={`text-base font-semibold ${HEADING}`}>{d.section}</p>
              <p className={`mt-2 text-sm leading-6 ${BODY}`}>{d.desc}</p>
            </div>
          ))}
        </div>
        <p className={`mt-6 max-w-2xl text-sm leading-6 ${BODY}`}>
          Tracked games and price alerts are managed on the GamePing site; in Companion you
          consult them, you don&apos;t change them.
        </p>

        {/* Account & privacy */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Account &amp; plan</p>
            <ul className="mt-3 flex flex-col gap-2">
              {["Sign in with the same account as the site", "Your plan (Free / Premium) is reflected in the app", "Billing and upgrades happen on the GamePing site"].map((t) => (
                <li key={t} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Stays on your PC</p>
            <ul className="mt-3 flex flex-col gap-2">
              {["Question / answer history (Recent, Pinned)", "Overlay preferences (layout, position, auto-hide)", "The resume-context session"].map((t) => (
                <li key={t} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className={`mt-3 text-sm leading-6 ${BODY}`}>
              All local to the device — not a cloud sync of your history.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Who it's for */}
      <SectionShell>
        <SectionTitle eyebrow="Who it's for" title="Made for mid-game questions" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>Companion is for you if…</p>
            <ul className="mt-3 flex flex-col gap-2">
              {FOR_YOU.map((t) => (
                <li key={t} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className={`rounded-2xl border p-6 ${CARD}`}>
            <p className={`text-base font-semibold ${HEADING}`}>It&apos;s not…</p>
            <ul className="mt-3 flex flex-col gap-2">
              {NOT_FOR.map((t) => (
                <li key={t} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionShell>

      {/* Honest limitations */}
      <SectionShell raised>
        <SectionTitle eyebrow="Known limitations" title="Honest about the alpha" />
        <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${BODY}`}>
          Better said plainly than hidden — these are known alpha limitations, not broken
          promises.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {LIMITATIONS.map((t) => (
            <div key={t} className={`flex items-start gap-3 rounded-2xl border p-5 ${CARD}`}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
              <span className={`text-sm leading-6 ${BODY}`}>{t}</span>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Companion vs site */}
      <SectionShell>
        <SectionTitle eyebrow="Companion vs the site" title="Two ways into GamePing" />
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-white/10">
                <th className={`py-3 pr-6 text-xs font-semibold uppercase tracking-[0.14em] ${BODY}`}></th>
                <th className={`py-3 pr-6 text-sm font-semibold ${HEADING}`}>GamePing site</th>
                <th className={`py-3 text-sm font-semibold ${HEADING}`}>Companion</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-slate-200/50 dark:border-white/[0.06] align-top">
                  <td className={`py-3 pr-6 text-sm font-medium ${HEADING}`}>{row.feature}</td>
                  <td className="py-3 pr-6"><Cell value={row.site} /></td>
                  <td className="py-3"><Cell value={row.companion} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionShell>

      {/* CTA */}
      <section className="border-t border-slate-200/60 px-6 py-20 text-center dark:border-white/[0.06] sm:py-28">
        <h2 className={`gp-home-display mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl ${HEADING}`}>
          Try it in your next session
        </h2>
        <p className={`mx-auto mt-5 max-w-lg text-lg leading-relaxed ${BODY}`}>
          Companion is in alpha: it already works for asking for help in-game, and we&apos;re still
          polishing it. Windows first.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/companion" className={NAVY_CTA}>Download for Windows</Link>
          <Link href="/signup" className={NAVY_OUTLINE}>Create free account</Link>
        </div>
      </section>
    </div>
  );
}
