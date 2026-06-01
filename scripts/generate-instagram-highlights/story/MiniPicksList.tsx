import type { RecommendResultCardGame } from "@/components/recommend/RecommendResultCardView"

type MiniPicksListProps = {
  games: RecommendResultCardGame[]
  label?: string
}

export function MiniPicksList({ games, label = "Your picks" }: MiniPicksListProps) {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">{label}</p>
      <ul className="mt-4 space-y-2.5">
        {games.map((game, index) => (
          <li
            key={game.title}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
          >
            <div className="min-w-0">
              <span className="text-xs font-black text-white/35">#{index + 1}</span>
              <p className="truncate text-lg font-black text-white">{game.title}</p>
            </div>
            <span className="shrink-0 rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
              {game.match}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
