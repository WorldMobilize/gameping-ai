import { RECOMMEND_PROMPT } from "../mock-data"

/** Recommend prompt card (subset of `/recommend` form). */
export function PromptInputCard() {
  return (
    <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(168,85,247,0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Start here</p>
      <h2 className="mt-2 text-3xl font-black">Describe what you want to play</h2>
      <textarea
        readOnly
        aria-readonly
        value={RECOMMEND_PROMPT}
        className="gp-prompt-textarea mt-5 min-h-36 w-full resize-none rounded-3xl border border-white/10 bg-black/40 p-5 text-base leading-8 text-white outline-none"
      />
      <p className="mt-2 text-sm tabular-nums text-white/40">{RECOMMEND_PROMPT.length} / 500</p>
    </section>
  )
}
