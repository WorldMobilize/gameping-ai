import SocialSlideFrame from "@/components/social/SocialSlideFrame"
import { aiGameRequestCtaEpisodeLabel } from "@/lib/social-export"

type SocialAiGameRequestCtaSlideProps = {
  episodeNumber: number
}

export default function SocialAiGameRequestCtaSlide({
  episodeNumber,
}: SocialAiGameRequestCtaSlideProps) {
  const nextEpisode = aiGameRequestCtaEpisodeLabel(episodeNumber)

  return (
    <SocialSlideFrame data-social-slide="ai-request-cta" centerContent>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 48,
            fontWeight: 800,
            lineHeight: 1.22,
            maxWidth: 900,
            color: "#ffffff",
          }}
        >
          Drop your request
          <br />
          for episode #{nextEpisode} 👇
        </h1>
        <p
          style={{
            marginTop: 56,
            marginBottom: 0,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.72)",
            maxWidth: 720,
          }}
        >
          Try your own search:
        </p>
        <p
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontSize: 44,
            fontWeight: 800,
            color: "#22d3ee",
            letterSpacing: "0.02em",
          }}
        >
          gamepingai.com
        </p>
      </div>
    </SocialSlideFrame>
  )
}
