import { HighlightFrame } from "../HighlightFrame"
import { HADES_HEADER_IMAGE } from "../mock-data"
import { StoryCanvas } from "../StoryCanvas"

export function CapturePrice() {
  return (
    <HighlightFrame overlay={["Track games.", "Catch price drops."]}>
      <StoryCanvas gap="compact">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HADES_HEADER_IMAGE}
            alt="Hades"
            className="mx-auto h-52 w-full object-contain object-center"
          />
        </div>

        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Hades</p>
          <h2 className="mt-2 text-4xl font-black">Best verified store price</h2>
        </div>

        <div className="w-full rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-7 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
          <p className="text-5xl font-black">$8.24</p>
          <p className="mt-3 text-base leading-relaxed text-white/65">
            Trusted store link — Steam. Other offers listed when available.
          </p>
          <span className="mt-6 flex w-full justify-center rounded-full border border-cyan-400/40 bg-black/30 px-6 py-4 text-base font-black text-cyan-200">
            Track price
          </span>
        </div>

        <p className="text-center text-base leading-7 text-white/50">
          We&apos;ll email you when we detect a verified price drop for this game. Alerts use your
          region (<span className="font-semibold text-white/70">US / USD</span>).
        </p>
      </StoryCanvas>
    </HighlightFrame>
  )
}
