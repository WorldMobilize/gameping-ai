import type { ReactNode } from "react"

type HighlightFrameProps = {
  children: ReactNode
  /** Optional short headline at the bottom (inside safe padding). */
  overlay?: readonly [string] | readonly [string, string]
}

export function HighlightFrame({ children, overlay }: HighlightFrameProps) {
  const line1 = overlay?.[0]
  const line2 = overlay?.[1]

  return (
    <div
      id="slide"
      className="relative box-border h-[1920px] w-[1080px] overflow-hidden bg-[#05060f] text-white"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col">{children}</div>

      {line1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-20 pb-16">
          <div
            className="h-40 bg-gradient-to-t from-[#05060f] via-[#05060f]/95 to-transparent"
            aria-hidden
          />
          <p className="relative -mt-32 text-[2.35rem] font-black leading-tight tracking-tight text-white">
            {line1}
          </p>
          {line2 ? (
            <p className="relative mt-2 text-[1.85rem] font-bold leading-snug text-white/70">
              {line2}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
