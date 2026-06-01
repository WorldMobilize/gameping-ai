import SocialSlideFrame from "@/components/social/SocialSlideFrame"

type SocialPromptSlideProps = {
  prompt: string
}

function truncatePrompt(text: string, max = 300): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export default function SocialPromptSlide({ prompt }: SocialPromptSlideProps) {
  const trimmed = truncatePrompt(prompt)
  const hasPrompt = Boolean(trimmed)
  const headline = hasPrompt ? trimmed : "GamePing AI recommendations"

  return (
    <SocialSlideFrame data-social-slide="prompt">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "rgba(34,211,238,0.85)",
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          I asked GamePing AI:
        </p>
        <blockquote
          style={{
            marginTop: 36,
            marginBottom: 0,
            padding: "0 24px",
            border: "none",
            fontSize: hasPrompt ? 48 : 52,
            fontWeight: 900,
            lineHeight: 1.22,
            maxWidth: 900,
            color: "#ffffff",
            quotes: "none",
          }}
        >
          {hasPrompt ? `“${headline}”` : headline}
        </blockquote>
        <p
          style={{
            marginTop: 44,
            marginBottom: 0,
            fontSize: 30,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            maxWidth: 720,
            lineHeight: 1.45,
          }}
        >
          Here&apos;s what it picked:
        </p>
      </div>
    </SocialSlideFrame>
  )
}
