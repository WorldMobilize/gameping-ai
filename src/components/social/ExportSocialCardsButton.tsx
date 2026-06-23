"use client"

import { useCallback, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { APP_INPUT } from "@/components/app/app-styles"
import { useToast } from "@/components/ToastProvider"
import SocialExportDeck from "@/components/social/SocialExportDeck"
import {
  buildAiGameRequestSlidePlan,
  buildSocialExportSlidePlan,
  delay,
  exportSocialSlideElement,
  normalizeAiGameRequestEpisode,
  preloadSocialImages,
  socialExportFilename,
  waitForSlideImages,
  type SocialExportGame,
  type SocialExportSlideId,
  type SocialExportSlidePlan,
} from "@/lib/social-export"

type ExportSocialCardsButtonProps = {
  prompt: string
  games: SocialExportGame[]
  hasBudgetFilter?: boolean
  includeCta?: boolean
  className?: string
}

const BUTTON_CLASS =
  "rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-xs font-semibold text-[color:var(--page-accent-text)] transition hover:border-[color:var(--page-accent-strong)] hover:bg-[var(--page-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"

const AI_BUTTON_CLASS =
  "inline-flex min-w-[9.5rem] shrink-0 items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-center text-xs font-semibold leading-snug text-[color:var(--page-accent-text)] transition hover:border-[color:var(--page-accent-strong)] hover:bg-[var(--page-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"

export default function ExportSocialCardsButton({
  prompt,
  games,
  hasBudgetFilter = false,
  includeCta = true,
  className = "",
}: ExportSocialCardsButtonProps) {
  const { showToast } = useToast()
  const deckRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<"standard" | "ai-game-request" | null>(
    null
  )
  const [activeSlideId, setActiveSlideId] = useState<SocialExportSlideId | null>(
    null
  )
  const [episodeNumber, setEpisodeNumber] = useState(1)

  const runExport = useCallback(
    async (plan: SocialExportSlidePlan[], episode: number) => {
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
    },
    [games]
  )

  const onStandardExport = useCallback(async () => {
    if (exporting || games.length === 0) return

    setExporting("standard")
    try {
      const plan = buildSocialExportSlidePlan(games, includeCta)
      await runExport(plan, episodeNumber)
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
      setExporting(null)
    }
  }, [exporting, games, includeCta, runExport, showToast, episodeNumber])

  const onAiGameRequestExport = useCallback(async () => {
    if (exporting || games.length === 0) return

    const episode = normalizeAiGameRequestEpisode(episodeNumber)
    setExporting("ai-game-request")
    try {
      const plan = buildAiGameRequestSlidePlan(games, episode)
      await runExport(plan, episode)
      showToast({
        variant: "success",
        message: `AI Game Request #${episode} deck exported — check your downloads.`,
      })
    } catch (err) {
      console.error("[social-export:ai-game-request]", err)
      const message =
        err instanceof Error
          ? err.message
          : "Export failed. Try again or use games with cover images."
      showToast({ variant: "error", message })
    } finally {
      flushSync(() => setActiveSlideId(null))
      setExporting(null)
    }
  }, [exporting, games, episodeNumber, runExport, showToast])

  const busy = exporting !== null

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          type="button"
          disabled={busy || games.length === 0}
          onClick={() => {
            void onStandardExport()
          }}
          className={BUTTON_CLASS}
        >
          {exporting === "standard" ? "Exporting…" : "Export social cards"}
        </button>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="ai-game-request-episode">
            Episode number
          </label>
          <input
            id="ai-game-request-episode"
            type="number"
            min={1}
            max={999}
            value={episodeNumber}
            disabled={busy}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              setEpisodeNumber(normalizeAiGameRequestEpisode(Number.isFinite(n) ? n : 1))
            }}
            className={`${APP_INPUT} w-14 rounded-full px-2 py-2.5 text-center text-xs font-bold`}
            title="Episode number"
          />
          <button
            type="button"
            disabled={busy || games.length === 0}
            onClick={() => {
              void onAiGameRequestExport()
            }}
            className={AI_BUTTON_CLASS}
          >
            {exporting === "ai-game-request"
              ? "Exporting…"
              : "Export AI Game Request"}
          </button>
        </div>
      </div>
      <SocialExportDeck
        ref={deckRef}
        prompt={prompt}
        games={games}
        hasBudgetFilter={hasBudgetFilter}
        episodeNumber={normalizeAiGameRequestEpisode(episodeNumber)}
        activeSlideId={activeSlideId}
      />
    </>
  )
}
