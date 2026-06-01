/** Visual bridge between prompt and AI result. */
export function AiMatchTransition() {
  return (
    <div className="flex w-full flex-col items-center gap-3 py-1" aria-hidden>
      <div className="h-10 w-px bg-gradient-to-b from-transparent via-cyan-400/50 to-cyan-400/80" />
      <div className="flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 shadow-[0_0_28px_rgba(34,211,238,0.15)]">
        <span className="text-lg" aria-hidden>
          ✨
        </span>
        <span className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
          AI matching
        </span>
      </div>
      <div className="h-10 w-px bg-gradient-to-b from-cyan-400/80 via-purple-400/40 to-transparent" />
    </div>
  )
}
