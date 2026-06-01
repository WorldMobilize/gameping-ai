import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { CaptureHowItWorks } from "./captures/CaptureHowItWorks"
import { CaptureIntro } from "./captures/CaptureIntro"
import { CapturePrice } from "./captures/CapturePrice"
import { CaptureRecommend } from "./captures/CaptureRecommend"
import { CaptureRefine } from "./captures/CaptureRefine"
import { CaptureTaste } from "./captures/CaptureTaste"

export type HighlightSlideDef = {
  filename: string
  render: () => ReactElement
}

export const HIGHLIGHT_SLIDES: HighlightSlideDef[] = [
  { filename: "01-intro.png", render: () => <CaptureIntro /> },
  { filename: "02-how-it-works.png", render: () => <CaptureHowItWorks /> },
  { filename: "03-recommendations.png", render: () => <CaptureRecommend /> },
  { filename: "04-refine.png", render: () => <CaptureRefine /> },
  { filename: "05-price-alerts.png", render: () => <CapturePrice /> },
  { filename: "06-taste-profile.png", render: () => <CaptureTaste /> },
]

export function renderSlideDocument(markup: string, cssFileUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1080, initial-scale=1" />
  <link rel="stylesheet" href="${cssFileUrl}" />
  <title>GamePing highlight</title>
</head>
<body style="margin:0;background:#05060f;">
${markup}
</body>
</html>`
}

export function renderSlideHtml(slide: HighlightSlideDef, cssFileUrl: string): string {
  const markup = renderToStaticMarkup(slide.render())
  return renderSlideDocument(markup, cssFileUrl)
}
