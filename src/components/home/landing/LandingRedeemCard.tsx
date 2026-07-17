"use client";

/**
 * Landing "redeem a creator code" card. Controlled by the pricing chapter so the
 * Premium price above can react to a valid discount code. Applying validates the
 * code (updating the price + the "Go Premium" link); checkout happens on /upgrade.
 */
type CodeInfo = { valid: boolean; type?: string } | null;

export default function LandingRedeemCard({
  card,
  heading,
  body,
  value,
  onChange,
  onApply,
  codeInfo,
  busy,
}: {
  card: string;
  heading: string;
  body: string;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  codeInfo: CodeInfo;
  busy: boolean;
}) {
  return (
    <div
      className={`mx-auto mt-6 max-w-5xl rounded-3xl border p-6 md:flex md:items-center md:justify-between md:gap-6 ${card}`}
    >
      <div>
        <p className={`text-sm font-bold ${heading}`}>Have a creator code?</p>
        <p className={`mt-1 text-sm ${body}`}>
          Enter it to see your price update, then hit Go Premium above.
        </p>
      </div>
      <div className="mt-4 md:mt-0 md:w-80">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
            placeholder="e.g. K7QP2M"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={onApply}
            disabled={busy || !value.trim()}
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "…" : "Apply"}
          </button>
        </div>
        {codeInfo ? (
          codeInfo.valid ? (
            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓{" "}
              {codeInfo.type === "discount"
                ? "20% off your first month applied"
                : codeInfo.type === "trial"
                  ? "7-day free trial applied"
                  : "Creator code applied"}
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              That code isn&apos;t valid.
            </p>
          )
        ) : null}
      </div>
    </div>
  );
}
