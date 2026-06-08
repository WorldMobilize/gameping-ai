import SocialSlideFrame from "@/components/social/SocialSlideFrame"
import {
  aiGameRequestSeriesTitle,
  socialAiRequestQuoteFontSize,
} from "@/lib/social-export"

type SocialAiGameRequestSlideProps = {
  prompt: string
  episodeNumber: number
}

export default function SocialAiGameRequestSlide({
  prompt,
  episodeNumber,
}: SocialAiGameRequestSlideProps) {
  const request = prompt.trim() || "Describe the game you're looking for"
  const quoteSize = socialAiRequestQuoteFontSize(request)

  return (
    <SocialSlideFrame data-social-slide="ai-request" centerContent>
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 40,
        }}
      >
        <h2
          style={{
            margin: 0,
            padding: "0 16px",
            fontSize: 44,
            fontWeight: 900,
            lineHeight: 1.2,
            color: "#22d3ee",
            letterSpacing: "-0.01em",
          }}
        >
          {aiGameRequestSeriesTitle(episodeNumber)}
        </h2>
        <p
          style={{
            margin: 0,
            padding: "0 24px",
            fontSize: quoteSize,
            fontWeight: 800,
            lineHeight: 1.32,
            maxWidth: 880,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          &ldquo;{request}&rdquo;
        </p>
      </div>
    </SocialSlideFrame>
  )
}
