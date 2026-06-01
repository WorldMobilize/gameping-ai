import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const OG_IMAGE_CONTENT_TYPE = "image/png";
export const OG_IMAGE_ALT = "GamePing AI — AI game discovery with real prices";

/** Branded 1200×630 social preview (no game artwork). */
export function renderBrandOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 72,
          background: "#05060f",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "rgba(34, 211, 238, 0.12)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(147, 51, 234, 0.1)",
            filter: "blur(90px)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgb(34, 211, 238)",
              marginBottom: 20,
            }}
          >
            AI game discovery + real prices
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#ffffff",
              maxWidth: 900,
            }}
          >
            GamePing AI
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              fontWeight: 600,
              lineHeight: 1.35,
              color: "rgba(248, 250, 252, 0.75)",
              maxWidth: 880,
            }}
          >
            Find games that match your vibe — with real store prices and price alerts.
          </div>
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
