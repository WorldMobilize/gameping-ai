import SocialSlideFrame from "@/components/social/SocialSlideFrame"

export default function SocialCtaSlide() {
  return (
    <SocialSlideFrame data-social-slide="cta" centerContent>
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
            lineHeight: 1.2,
            maxWidth: 900,
            color: "#ffffff",
          }}
        >
          Not sure what to play next?
        </h1>
        <p
          style={{
            marginTop: 48,
            marginBottom: 0,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.72)",
            maxWidth: 720,
          }}
        >
          Describe what you&apos;re looking for.
          <br />
          GamePing AI finds the matches.
        </p>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            maxWidth: 640,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(34,211,238,0.75)",
            }}
          >
            Early Access 🎮
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            GamePing AI is still evolving.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Found a bug or have suggestions?
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Your feedback helps us improve.
          </p>
        </div>
        <p
          style={{
            marginTop: 36,
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
