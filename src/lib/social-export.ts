import { toPng } from "html-to-image"

export const SOCIAL_SLIDE_WIDTH = 1080
export const SOCIAL_SLIDE_HEIGHT = 1920

export type SocialExportGame = {
  title: string
  match: number
  reason: string
  image?: string | null
  matchTier?: "best_match" | "good_alternative" | "partial_match"
  matchNote?: string
  budgetNote?: string | null
  budgetStatus?: "within_budget" | "above_budget" | "unknown_price"
}

/** Same-origin proxy so canvas export is not tainted by RAWG CDN CORS. */
export function proxiedSocialImageUrl(
  imageUrl: string | null | undefined,
  cacheKey?: string
): string | null {
  if (!imageUrl?.trim()) return null
  try {
    const parsed = new URL(imageUrl.trim())
    if (parsed.protocol !== "https:") return null
    const base = `/api/social-image?url=${encodeURIComponent(parsed.toString())}`
    if (!cacheKey?.trim()) return base
    return `${base}&k=${encodeURIComponent(cacheKey.trim())}`
  } catch {
    return null
  }
}

export type SocialExportSlideId = "prompt" | "cta" | `game-${number}`

export type SocialExportSlidePlan = {
  id: SocialExportSlideId
  filenamePart: string
  gameIndex?: number
}

export function buildSocialExportSlidePlan(
  games: SocialExportGame[],
  includeCta: boolean
): SocialExportSlidePlan[] {
  const plan: SocialExportSlidePlan[] = [
    { id: "prompt", filenamePart: "your-search" },
    ...games.map((game, index) => ({
      id: `game-${index + 1}` as const,
      filenamePart: slugifyForSocialFilename(game.title),
      gameIndex: index,
    })),
  ]
  if (includeCta) {
    plan.push({ id: "cta", filenamePart: "try-gameping" })
  }
  return plan
}

export async function waitForSlideImages(root: HTMLElement) {
  const imgs = [...root.querySelectorAll("img")]
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode?.().catch(() => undefined) ?? Promise.resolve()
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      })
    })
  )
}

export function slugifyForSocialFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "game"
  )
}

export function socialExportFilename(
  index: number,
  part: string
): string {
  return `gameping-social-${String(index).padStart(2, "0")}-${part}.png`
}

export async function preloadSocialImages(
  urls: Array<string | null | undefined>,
  cacheKeys?: Array<string | undefined>
) {
  const unique = [
    ...new Set(
      urls
        .map((url, index) =>
          proxiedSocialImageUrl(url, cacheKeys?.[index] ?? `preload-${index}`)
        )
        .filter(Boolean) as string[]
    ),
  ]
  const results = await Promise.allSettled(
    unique.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve()
          img.onerror = () =>
            reject(new Error(`Could not load image for export: ${src}`))
          img.src = src
        })
    )
  )
  const failed = results.filter((r) => r.status === "rejected").length
  if (failed === unique.length && unique.length > 0) {
    throw new Error("Could not load game images for export. Try again in a moment.")
  }
}

export async function exportSocialSlideElement(
  node: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(node, {
    width: SOCIAL_SLIDE_WIDTH,
    height: SOCIAL_SLIDE_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    skipFonts: false,
    /** Avoid embedding images from sibling slides when the deck was stacked. */
    includeQueryParams: true,
  })

  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  link.click()
}

/** Brief pause between downloads so browsers do not block multiple saves. */
export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
