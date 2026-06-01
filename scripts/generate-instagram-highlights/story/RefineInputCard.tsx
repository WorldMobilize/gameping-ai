import { REFINE_INPUT } from "../mock-data"

export function RefineInputCard() {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300/90">
        Not quite right?
      </p>
      <p className="mt-2 text-base leading-7 text-white/55">
        Tell GamePing what to adjust. You get one refinement for this search.
      </p>
      <input
        readOnly
        aria-readonly
        value={REFINE_INPUT}
        className="mt-4 w-full rounded-xl border border-cyan-400/35 bg-black/30 px-4 py-3.5 text-base text-white outline-none"
      />
      <p className="mt-2 text-sm tabular-nums text-white/40">
        {REFINE_INPUT.length} / 200
      </p>
      <span className="mt-4 inline-flex w-full justify-center rounded-full bg-cyan-400 px-6 py-3.5 text-base font-black text-black">
        Refine picks
      </span>
    </div>
  )
}
