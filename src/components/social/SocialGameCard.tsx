import RecommendResultCardView from "@/components/recommend/RecommendResultCardView"
import SocialSlideFooter from "@/components/social/SocialSlideFooter"
import SocialSlideFrame from "@/components/social/SocialSlideFrame"
import {
  prefersItalianRecommendCopy,
  resolveRecommendResultBudgetLine,
} from "@/lib/recommend-result-card-budget"
import { proxiedSocialImageUrl, slugifyForSocialFilename } from "@/lib/social-export"
import type { SocialExportGame } from "@/lib/social-export"

type SocialGameCardProps = {
  rank: number
  game: SocialExportGame
  userPrompt?: string
  hasBudgetFilter?: boolean
}

export default function SocialGameCard({
  rank,
  game,
  userPrompt = "",
  hasBudgetFilter = false,
}: SocialGameCardProps) {
  const imageCacheKey = `game-${rank}-${slugifyForSocialFilename(game.title)}`
  const imageSrc = proxiedSocialImageUrl(game.image, imageCacheKey)
  const budgetLine = resolveRecommendResultBudgetLine({
    budgetNote: game.budgetNote,
    hasBudgetFilter,
    preferItalian: prefersItalianRecommendCopy(userPrompt),
  })

  return (
    <SocialSlideFrame
      data-social-slide={`game-${rank}`}
      centerContent
      footer={<SocialSlideFooter />}
    >
      <div className="w-full">
        <RecommendResultCardView
          rank={rank}
          game={game}
          budgetLine={budgetLine}
          imageSrc={imageSrc}
          imageCacheKey={imageCacheKey}
          density="export"
          showViewDetails={false}
          fitMetaLine="Generated from your search vibe"
        />
      </div>
    </SocialSlideFrame>
  )
}
