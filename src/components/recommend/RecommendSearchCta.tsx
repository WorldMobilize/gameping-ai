import type { RefObject } from "react";

export type RecommendSearchCtaProps = {
  theme?: "dark" | "light";
  loading?: boolean;
  disabled?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  highlightButton?: boolean;
  buttonPulse?: boolean;
};

export default function RecommendSearchCta({
  theme = "dark",
  loading = false,
  disabled = false,
  buttonRef,
  highlightButton = false,
  buttonPulse = false,
}: RecommendSearchCtaProps) {
  const isLight = theme === "light";

  const shell = isLight
    ? "rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 md:p-6"
    : "rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6";

  const title = isLight ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white/90";

  const body = isLight ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-white/70";

  const button = isLight
    ? "shrink-0 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-10 py-4 text-sm font-bold text-white shadow-sm shadow-cyan-600/20 transition disabled:opacity-60"
    : "shrink-0 rounded-full bg-cyan-400 px-10 py-4 text-sm font-bold text-black transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={shell}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={title}>Ready to discover your picks?</p>
          <p className={body}>
            Up to five curated matches with scores and clear reasons. Check deals on each game page.
          </p>
        </div>

        <button
          ref={buttonRef}
          type="button"
          tabIndex={-1}
          disabled={disabled || loading}
          className={`${button} ${highlightButton ? "ring-2 ring-[color:var(--page-accent-border)]" : ""} ${
            buttonPulse ? "scale-[0.97] opacity-90" : ""
          }`}
        >
          {loading ? "Finding your picks…" : "Get my picks"}
        </button>
      </div>
    </div>
  );
}
