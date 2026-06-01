import RecommendResultCardView from "@/components/recommend/RecommendResultCardView"

import { HighlightFrame } from "../HighlightFrame"
import { MOCK_RECOMMEND_GAMES } from "../mock-data"
import { StoryCanvas } from "../StoryCanvas"
import { AiMatchTransition } from "../story/AiMatchTransition"
import { PromptInputCard } from "../story/PromptInputCard"

export function CaptureRecommend() {
  const topPick = MOCK_RECOMMEND_GAMES[0]

  return (
    <HighlightFrame overlay={["Describe what you want.", "Let AI find it."]}>
      <StoryCanvas gap="compact">
        <PromptInputCard />
        <AiMatchTransition />
        <RecommendResultCardView
          rank={1}
          game={topPick}
          density="page"
          showViewDetails
          budgetLine={topPick.budgetNote ?? null}
        />
      </StoryCanvas>
    </HighlightFrame>
  )
}
