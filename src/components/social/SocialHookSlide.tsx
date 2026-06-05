import SocialSlideFrame from "@/components/social/SocialSlideFrame"
import { promptToSocialHook } from "@/lib/social-export"

type SocialHookSlideProps = {
  prompt: string
}

export default function SocialHookSlide({ prompt }: SocialHookSlideProps) {
  const hook = promptToSocialHook(prompt)

  return (
    <SocialSlideFrame data-social-slide="hook" centerContent>
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
        {hook}
      </h1>
    </SocialSlideFrame>
  )
}
