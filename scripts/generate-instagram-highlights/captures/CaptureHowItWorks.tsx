import { HighlightFrame } from "../HighlightFrame"
import { HOW_IT_WORKS_FEATURES } from "../mock-data"
import { StoryCanvas } from "../StoryCanvas"

export function CaptureHowItWorks() {
  return (
    <HighlightFrame overlay={["Smart recommendations, without the noise."]}>
      <StoryCanvas gap="compact">
        <div className="w-full text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight">Three steps to better picks</h2>
        </div>

        <div className="flex w-full flex-col gap-4">
          {HOW_IT_WORKS_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(168,85,247,0.06)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-black text-cyan-300">
                {feature.label}
              </div>
              <h3 className="text-2xl font-black">{feature.title}</h3>
              <p className="mt-2 text-base leading-7 text-white/55">{feature.text}</p>
            </div>
          ))}
        </div>
      </StoryCanvas>
    </HighlightFrame>
  )
}
