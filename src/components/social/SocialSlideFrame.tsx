import type { ReactNode } from "react"
import { SOCIAL_SLIDE_HEIGHT, SOCIAL_SLIDE_WIDTH } from "@/lib/social-export"

type SocialSlideFrameProps = {
  children: ReactNode
  footer?: ReactNode
  /** Vertically center children in the space between header and footer. */
  centerContent?: boolean
  /** Optional top nudge when not using centerContent (e.g. CTA slide). */
  contentOffsetTop?: number
  "data-social-slide"?: string
}

/** Fixed 1080×1920 export canvas with safe margins for Reels/TikTok UI. */
export default function SocialSlideFrame({
  children,
  footer,
  centerContent = false,
  contentOffsetTop = 0,
  "data-social-slide": slideId = "slide",
}: SocialSlideFrameProps) {
  return (
    <div
      data-social-slide={slideId}
      style={{
        width: SOCIAL_SLIDE_WIDTH,
        height: SOCIAL_SLIDE_HEIGHT,
        boxSizing: "border-box",
        padding: "64px 72px 100px",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(168,85,247,0.22), transparent 50%), linear-gradient(165deg, #07070f 0%, #0c0a14 45%, #050508 100%)",
        color: "#ffffff",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#22d3ee",
          }}
        >
          GamePing AI
        </span>
        <span style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
          gamepingai.com
        </span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          paddingTop: centerContent ? 0 : contentOffsetTop,
          alignItems: centerContent ? "center" : undefined,
          justifyContent: centerContent ? "center" : undefined,
        }}
      >
        {centerContent ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
      {footer ? (
        <div style={{ flexShrink: 0, paddingTop: 24, paddingBottom: 4 }}>{footer}</div>
      ) : null}
    </div>
  )
}
