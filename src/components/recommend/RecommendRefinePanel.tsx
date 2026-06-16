import type { RefObject } from "react";

export type RecommendRefinePanelProps = {
  theme?: "dark" | "light";
  density?: "page" | "demo";
  refineUsed?: boolean;
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  showUpdating?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  inputRef?: RefObject<HTMLInputElement | null>;
  highlightButton?: boolean;
  buttonPulse?: boolean;
};

export default function RecommendRefinePanel({
  theme = "dark",
  density = "page",
  refineUsed = false,
  value,
  onChange,
  onSubmit,
  loading = false,
  maxLength = 120,
  readOnly = false,
  showUpdating = false,
  buttonRef,
  inputRef,
  highlightButton = false,
  buttonPulse = false,
}: RecommendRefinePanelProps) {
  const isLight = theme === "light";
  const isDemo = density === "demo";

  const shell = isLight
    ? `rounded-2xl border border-slate-200/90 bg-slate-50/90 ${isDemo ? "p-4" : "p-5 md:p-6"}`
    : `rounded-2xl border border-white/10 bg-white/[0.03] ${isDemo ? "p-4" : "p-5 md:p-6"}`;

  const label = isLight
    ? "text-xs font-black uppercase tracking-[0.3em] text-cyan-700"
    : "text-xs font-black uppercase tracking-[0.3em] text-cyan-300/90";

  const hint = isLight ? "text-sm leading-6 text-slate-600" : "text-sm leading-6 text-white/50";

  const input = isLight
    ? "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
    : "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30";

  const counter = isLight ? "text-xs tabular-nums text-slate-400" : "text-xs tabular-nums text-white/40";

  const button = isLight
    ? "rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50"
    : "rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50";

  if (refineUsed) {
    return (
      <div className={`${shell} text-center`}>
        <p className={hint}>You used your one refinement for this search.</p>
        <span className={`mt-4 inline-flex rounded-full border px-6 py-2.5 text-sm font-bold ${isLight ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"}`}>
          Start a new search
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={shell}
    >
      <p className={label}>Not quite right?</p>
      <p className={`mt-2 ${hint}`}>
        Tell GamePing what to adjust. You get one refinement for this search.
      </p>
      <label className="mt-4 block">
        <span className="sr-only">Refine your picks</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          maxLength={maxLength}
          disabled={loading}
          placeholder="e.g. less famous, more story, not multiplayer…"
          className={input}
        />
      </label>
      <p className={`mt-2 ${counter}`}>
        {value.length} / {maxLength}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm font-medium ${hint} ${showUpdating ? "animate-pulse opacity-100" : "opacity-0"}`}>
          Updating recommendations…
        </p>
        <button
          ref={buttonRef}
          type="submit"
          disabled={readOnly ? !value.trim() : loading || !value.trim()}
          className={`${button} w-full transition sm:w-auto ${
            highlightButton ? "ring-2 ring-cyan-400/55" : ""
          } ${buttonPulse ? "scale-[0.97] opacity-90" : ""}`}
        >
          Refine picks
        </button>
      </div>
    </form>
  );
}
