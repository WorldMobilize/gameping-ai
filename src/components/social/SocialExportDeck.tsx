"use client"

import { forwardRef, type CSSProperties, type ReactNode } from "react"
import SocialCtaSlide from "@/components/social/SocialCtaSlide"
import SocialGameCard from "@/components/social/SocialGameCard"
import SocialEngagementSlide from "@/components/social/SocialEngagementSlide"
import SocialHookSlide from "@/components/social/SocialHookSlide"
import SocialPromptSlide from "@/components/social/SocialPromptSlide"
import type { SocialExportGame, SocialExportSlideId } from "@/lib/social-export"

type SocialExportDeckProps = {
  prompt: string
  games: SocialExportGame[]
  hasBudgetFilter?: boolean
  /** When set, only this slide is mounted (one-at-a-time export). */
  activeSlideId: SocialExportSlideId | null
}

const HIDDEN_DECK_STYLE: CSSProperties = {
  position: "fixed",
  left: 0,
  top: 0,
  width: 1080,
  pointerEvents: "none",
  zIndex: -1,
  transform: "translateX(-200%)",
}

const SocialExportDeck = forwardRef<HTMLDivElement, SocialExportDeckProps>(
  function SocialExportDeck({ prompt, games, hasBudgetFilter = false, activeSlideId }, ref) {
    if (!activeSlideId) {
      return <div ref={ref} aria-hidden style={HIDDEN_DECK_STYLE} />
    }

    let slide: ReactNode = null
    if (activeSlideId === "hook") {
      slide = <SocialHookSlide prompt={prompt} />
    } else if (activeSlideId === "prompt") {
      slide = <SocialPromptSlide />
    } else if (activeSlideId === "engagement") {
      slide = <SocialEngagementSlide />
    } else if (activeSlideId === "cta") {
      slide = <SocialCtaSlide />
    } else if (activeSlideId.startsWith("game-")) {
      const rank = Number.parseInt(activeSlideId.replace("game-", ""), 10)
      const game = games[rank - 1]
      if (game) {
        slide = (
          <SocialGameCard
            rank={rank}
            game={game}
            userPrompt={prompt}
            hasBudgetFilter={hasBudgetFilter}
          />
        )
      }
    }

    return (
      <div ref={ref} aria-hidden style={HIDDEN_DECK_STYLE}>
        {slide}
      </div>
    )
  }
)

export default SocialExportDeck
