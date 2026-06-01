import type { ReactNode } from "react"

/** Horizontal safe inset on 1080px story (80px each side). */
export const STORY_SAFE_PADDING_PX = 80

/** Usable content width inside safe padding. */
export const STORY_CONTENT_MAX_WIDTH_PX = 1080 - STORY_SAFE_PADDING_PX * 2

type StoryCanvasProps = {
  children: ReactNode
  className?: string
  /** Tighter vertical gap when stacking many blocks. */
  gap?: "normal" | "compact"
}

/** Centers story blocks inside the 1080×1920 canvas with 80px safe padding. */
export function StoryCanvas({ children, className = "", gap = "normal" }: StoryCanvasProps) {
  const gapClass = gap === "compact" ? "gap-5" : "gap-8"

  return (
    <div
      className={`box-border flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-visible p-20 pb-44 ${gapClass} ${className}`.trim()}
    >
      <div className={`flex w-full max-w-[920px] flex-col items-stretch ${gapClass}`}>
        {children}
      </div>
    </div>
  )
}
