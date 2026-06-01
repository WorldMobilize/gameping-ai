import { PREVIEW_GAMES_HOME } from "../mock-data"

/** Homepage “Your AI picks” preview panel. */
export function LivePreviewCard() {
  const game = PREVIEW_GAMES_HOME[0]

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_80px_rgba(168,85,247,0.15)]">
      <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-cyan-400/15 to-purple-500/15 blur-xl" aria-hidden />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Live preview
            </p>
            <h2 className="mt-1 text-2xl font-black">Your AI picks</h2>
          </div>
          <span className="shrink-0 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
            Demo
          </span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                Pick #1
              </p>
              <h3 className="mt-2 text-2xl font-black">{game.title}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-cyan-400 px-3 py-1.5 text-sm font-black text-black">
              {game.match}
            </span>
          </div>
          <p className="mt-4 text-base leading-7 text-white/60">💡 {game.reason}</p>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs uppercase tracking-widest text-white/35">Best price</span>
            <span className="text-lg font-black text-cyan-300">{game.price}</span>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-base font-bold text-cyan-200">
            &ldquo;Find me a dark story game under $20&rdquo;
          </p>
          <p className="mt-1 text-sm text-white/45">
            GamePing turns simple requests into smart recommendations.
          </p>
        </div>
      </div>
    </div>
  )
}
