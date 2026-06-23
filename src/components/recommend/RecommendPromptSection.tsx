import type { RefObject } from "react";

export type RecommendPromptSectionProps = {
  theme?: "dark" | "light";
  density?: "page" | "demo";
  value: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  readOnly?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  filtersEnabled?: boolean;
  onToggleFilters?: () => void;
  showAdvancedToggle?: boolean;
  toggleRef?: RefObject<HTMLButtonElement | null>;
  highlightToggle?: boolean;
  togglePulse?: boolean;
};

export default function RecommendPromptSection({
  theme = "dark",
  density = "page",
  value,
  onChange,
  maxLength,
  readOnly = false,
  textareaRef,
  filtersEnabled = false,
  onToggleFilters,
  showAdvancedToggle = true,
  toggleRef,
  highlightToggle = false,
  togglePulse = false,
}: RecommendPromptSectionProps) {
  const isLight = theme === "light";
  const isDemo = density === "demo";

  const section = isLight
    ? "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8"
    : "rounded-2xl border border-white/10 bg-[#0a0b14]/60 p-6 md:p-8";

  const kicker = isLight
    ? "text-xs font-semibold uppercase tracking-[0.25em] text-slate-600"
    : "text-xs font-semibold uppercase tracking-[0.25em] text-white/70";

  const title = isLight
    ? `font-black tracking-tight text-slate-900 ${isDemo ? "mt-2 text-xl" : "mt-3 text-2xl md:text-3xl"}`
    : `font-black tracking-tight ${isDemo ? "mt-2 text-xl" : "mt-3 text-2xl md:text-3xl"}`;

  const lead = isLight ? "text-sm leading-6 text-slate-600" : "text-sm leading-6 text-white/65";

  const textarea = isLight
    ? `gp-prompt-textarea mt-6 min-h-52 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[color:var(--page-accent-border)] focus:ring-2 focus:ring-[color:var(--page-accent-border)]`
    : `gp-prompt-textarea mt-6 min-h-52 w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-5 text-[15px] leading-7 text-white outline-none placeholder:text-white/45 focus:border-[color:var(--page-accent-border)] focus:ring-2 focus:ring-[color:var(--page-accent-border)]`;

  const counter = isLight ? "mt-2 text-xs tabular-nums text-slate-600" : "mt-2 text-xs tabular-nums text-white/70";

  const toggleShell = isLight
    ? `flex max-w-full items-center gap-3 rounded-full border px-5 py-3 text-left text-sm font-bold transition ${
        filtersEnabled
          ? "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[color:var(--page-accent-text)]"
          : "border-slate-200 bg-slate-50 text-slate-700"
      } ${highlightToggle ? "ring-2 ring-[color:var(--page-accent-border)]" : ""} ${togglePulse ? "scale-[0.98] opacity-90" : ""}`
    : `flex max-w-full items-center gap-3 rounded-full border px-5 py-3 text-left text-sm font-bold transition ${
        filtersEnabled
          ? "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[color:var(--page-accent-strong)]"
          : "border-white/10 bg-black/30 text-white/75 hover:border-white/25"
      } ${highlightToggle ? "ring-2 ring-[color:var(--page-accent-border)]" : ""} ${togglePulse ? "scale-[0.98] opacity-90" : ""}`;

  const toggleTrack = isLight
    ? `relative inline-flex h-8 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors ${
        filtersEnabled ? "justify-end bg-[var(--page-accent)]" : "justify-start bg-slate-300"
      }`
    : `relative inline-flex h-8 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors ${
        filtersEnabled ? "justify-end bg-[var(--page-accent)]" : "justify-start bg-white/20"
      }`;

  const toggleKnob = isLight
    ? "inline-block h-7 w-7 rounded-full bg-white shadow"
    : "inline-block h-7 w-7 rounded-full bg-black shadow";

  return (
    <section className={section}>
      <p className={kicker}>Start here</p>
      <h2 className={title}>What do you want to play?</h2>
      <p className={`mt-2 ${lead}`}>
        {filtersEnabled
          ? "Use filters for more specific recommendations."
          : "Describe the kind of game you want."}
      </p>

      <textarea
        ref={textareaRef}
        id="recommend-prompt"
        aria-label="Describe the kind of game you want"
        readOnly={readOnly}
        maxLength={maxLength}
        className={textarea}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={`Examples:
"Something like Stardew Valley but with more action"
"A dark, story-rich game under $20"`}
      />

      {maxLength ? (
        <p className={counter}>
          {value.length} / {maxLength}
        </p>
      ) : null}

      {showAdvancedToggle && onToggleFilters ? (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            ref={toggleRef}
            type="button"
            role="switch"
            aria-checked={filtersEnabled}
            tabIndex={-1}
            onClick={onToggleFilters}
            className={toggleShell}
          >
            <span className={toggleTrack}>
              <span className={toggleKnob} />
            </span>
            <span>Advanced filters</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
