"use client"

import { useCallback, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useToast } from "@/components/ToastProvider"
import SocialExportDeck from "@/components/social/SocialExportDeck"
import {
  buildSocialExportSlidePlan,
  delay,
  exportSocialSlideElement,
  preloadSocialImages,
  socialExportFilename,
  waitForSlideImages,
  type SocialExportGame,
  type SocialExportSlideId,
} from "@/lib/social-export"

type ExportSocialCardsButtonProps = {
  prompt: string
  games: SocialExportGame[]
  hasBudgetFilter?: boolean
  includeCta?: boolean
  className?: string
}

export default function ExportSocialCardsButton({
  prompt,
  games,
  hasBudgetFilter = false,
  includeCta = true,
  className = "",
}: ExportSocialCardsButtonProps) {
  const { showToast } = useToast()
  const deckRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [activeSlideId, setActiveSlideId] = useState<SocialExportSlideId | null>(
    null
  )

  const runExport = useCallback(async () => {
    if (exporting || games.length === 0) return

    const plan = buildSocialExportSlidePlan(games, includeCta)
    await preloadSocialImages(
      games.map((g) => g.image),
      games.map((g, i) => `preload-${i + 1}-${g.title}`)
    )

    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready
    }

    let fileIndex = 1
    for (const slide of plan) {
      flushSync(() => setActiveSlideId(slide.id))
      await delay(80)

      const root = deckRef.current
      const slideEl = root?.querySelector<HTMLElement>("[data-social-slide]")
      if (!slideEl) {
        throw new Error(`Export slide not ready: ${slide.id}`)
      }

      if (slide.id.startsWith("game-") && slide.gameIndex !== undefined) {
        const game = games[slide.gameIndex]
        await preloadSocialImages(
          [game.image],
          [`export-${slide.id}-${game.title}`]
        )
        await waitForSlideImages(slideEl)
      }

      await exportSocialSlideElement(
        slideEl,
        socialExportFilename(fileIndex, slide.filenamePart)
      )
      fileIndex += 1
      await delay(300)
    }

    flushSync(() => setActiveSlideId(null))
  }, [exporting, games, includeCta])

  const onClick = useCallback(async () => {
    setExporting(true)
    try {
      await runExport()
      showToast({
        variant: "success",
        message: "Social cards exported — check your downloads.",
      })
    } catch (err) {
      console.error("[social-export]", err)
      const message =
        err instanceof Error
          ? err.message
          : "Export failed. Try again or use games with cover images."
      showToast({ variant: "error", message })
    } finally {
      flushSync(() => setActiveSlideId(null))
      setExporting(false)
    }
  }, [runExport, showToast])

  return (
    <>
      <button
        type="button"
        disabled={exporting || games.length === 0}
        onClick={() => {
          void onClick()
        }}
        className={
          className ||
          "rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-xs font-bold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {exporting ? "Exporting…" : "Export social cards"}
      </button>
      <SocialExportDeck
        ref={deckRef}
        prompt={prompt}
        games={games}
        hasBudgetFilter={hasBudgetFilter}
        activeSlideId={activeSlideId}
      />
    </>
  )
}
