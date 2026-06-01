import { HighlightFrame } from "../HighlightFrame"
import { StoryCanvas } from "../StoryCanvas"

/** Persistent taste + premium (story 06 — keep working composition). */
export function CaptureTaste() {
  return (
    <HighlightFrame overlay={["GamePing learns what you love."]}>
      <StoryCanvas gap="compact">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_60px_rgba(168,85,247,0.1)]">
          <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Coming soon</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Persistent taste profile
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Your long-term game taste profile
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/70">
            Soon, GamePing learns from saved searches, tracked games, and optional Steam library
            import — so recommendations and deal alerts feel more personal over time.
          </p>
          <span className="mt-8 inline-flex rounded-full bg-white px-8 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(255,255,255,0.1)]">
            Find games for me
          </span>
        </div>

        <div className="w-full rounded-[2rem] border border-cyan-400/25 bg-cyan-400/10 p-7 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Premium</p>
          <ul className="mt-4 space-y-3 text-base text-white/75">
            <li>✔ Persistent taste memory across sessions</li>
            <li>✔ Sharper AI match explanations over time</li>
            <li>✔ Deal alerts tuned to what you actually play</li>
          </ul>
        </div>
      </StoryCanvas>
    </HighlightFrame>
  )
}
