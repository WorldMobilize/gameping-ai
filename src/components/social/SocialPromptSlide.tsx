import SocialSlideFrame from "@/components/social/SocialSlideFrame"

export default function SocialPromptSlide() {
  return (
    <SocialSlideFrame data-social-slide="prompt" centerContent>
      <p
        style={{
          margin: 0,
          padding: "0 24px",
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.28,
          maxWidth: 820,
          textAlign: "center",
          color: "rgba(34,211,238,0.92)",
        }}
      >
        I asked GamePing AI to find them
      </p>
    </SocialSlideFrame>
  )
}
