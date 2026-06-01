import RecommendResultCardView from "@/components/recommend/RecommendResultCardView"

import { HighlightFrame } from "../HighlightFrame"
import { MOCK_RECOMMEND_GAMES, MOCK_REFINED_GAME } from "../mock-data"
import { StoryCanvas } from "../StoryCanvas"
import { AiMatchTransition } from "../story/AiMatchTransition"
import { MiniPicksList } from "../story/MiniPicksList"
import { RefineInputCard } from "../story/RefineInputCard"

export function CaptureRefine() {
  return (
    <HighlightFrame overlay={["Not perfect?", "Tell AI what to change."]}>
      <StoryCanvas gap="compact">
        <p className="text-center text-3xl font-black leading-tight text-white">
          Not perfect?
          <span className="mt-2 block text-xl font-bold text-white/60">
            Tell AI what to change.
          </span>
        </p>
        <MiniPicksList games={MOCK_RECOMMEND_GAMES} />
        <RefineInputCard />
        <AiMatchTransition />
        <div className="w-full">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-emerald-300/90">
            Refined pick
          </p>
          <RecommendResultCardView
            rank={1}
            game={MOCK_REFINED_GAME}
            density="page"
            showViewDetails
            budgetLine={MOCK_REFINED_GAME.budgetNote ?? null}
          />
        </div>
      </StoryCanvas>
    </HighlightFrame>
  )
}
