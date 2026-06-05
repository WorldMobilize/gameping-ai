import SocialSlideFrame from "@/components/social/SocialSlideFrame"
import { SOCIAL_ENGAGEMENT_HOOK } from "@/lib/social-export"

export default function SocialEngagementSlide() {
  return (
    <SocialSlideFrame data-social-slide="engagement" centerContent>
      <h1
        style={{
          margin: 0,
          padding: "0 24px",
          fontSize: 52,
          fontWeight: 900,
          lineHeight: 1.18,
          maxWidth: 920,
          textAlign: "center",
          color: "#ffffff",
          letterSpacing: "-0.02em",
        }}
      >
        {SOCIAL_ENGAGEMENT_HOOK}
      </h1>
    </SocialSlideFrame>
  )
}
