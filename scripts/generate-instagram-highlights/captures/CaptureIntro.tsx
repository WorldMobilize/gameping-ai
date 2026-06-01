import { DEFAULT_SITE_DESCRIPTION } from "@/lib/seo/site"

import { HighlightFrame } from "../HighlightFrame"
import { StoryCanvas } from "../StoryCanvas"
import { LivePreviewCard } from "../story/LivePreviewCard"

export function CaptureIntro() {
  return (
    <HighlightFrame overlay={["Find games that match your vibe"]}>
      <StoryCanvas>
        <div className="w-full text-center">
          <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            AI game discovery + real prices
          </div>
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight">
            Find games that actually match{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
              your vibe.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-[36rem] text-lg leading-8 text-white/65">
            {DEFAULT_SITE_DESCRIPTION}
          </p>
        </div>
        <LivePreviewCard />
      </StoryCanvas>
    </HighlightFrame>
  )
}
