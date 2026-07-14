import Image from "next/image";

/** Native Steam library header ratio (460×215). */
export const STEAM_HEADER_ASPECT = "aspect-[460/215]" as const;

/**
 * The `row` variant states a width and keeps the native ratio, so the box IS the
 * image: the height follows from the aspect-ratio and the row grows to match it.
 * The art is what sizes the card, not the other way round.
 */
const ROW_ART = "sm:w-[420px]";

/** Blurred fill — bleeds art into the frame so letterboxing feels intentional. */
const BACKDROP_IMAGE_CLASS =
  "scale-[1.35] object-cover object-[42%_50%] opacity-[0.52] blur-lg saturate-150 brightness-[0.88]";

/**
 * Hybrid foreground: contain + slight overscale clips only edges, not logos.
 * Steam headers anchor left-of-center where titles/logos usually sit.
 */
const FOREGROUND_IMAGE_CLASS =
  "z-[1] scale-[1.1] object-contain object-[42%_50%] transition duration-500 group-hover:scale-[1.13]";

/**
 * `row` shows the header WHOLE — no overscale, no crop, centered. The box already
 * matches the native 460:215 ratio, so contain fills it edge to edge with nothing
 * cut off. Hover brightens instead of zooming, since a zoom would crop again.
 */
const ROW_FOREGROUND_IMAGE_CLASS =
  "z-[1] object-contain object-center transition duration-500 group-hover:brightness-110";

type CuratedGameArtProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  /**
   * carousel   — fills the card width (art on top of the card).
   * collection — fixed-width column on desktop.
   * row        — fills the ROW height on desktop; the width follows from the native
   *              460:215 ratio, so the art never stretches or crops.
   */
  variant?: "carousel" | "collection" | "row";
};

/**
 * Steam header art for curated cards — readable logos with cinematic fill.
 * Blurred backdrop + slightly scaled contain avoids both aggressive crop and floating thumbnails.
 */
export default function CuratedGameArt({
  src,
  alt,
  sizes,
  priority,
  loading,
  variant = "carousel",
}: CuratedGameArtProps) {
  const isCollection = variant === "collection";
  const isRow = variant === "row";

  const containerClass = isCollection
    ? `relative w-full shrink-0 overflow-hidden bg-[#080a14] ${STEAM_HEADER_ASPECT} md:w-[min(280px,42%)] md:max-w-[300px] md:self-start`
    : isRow
      ? `relative w-full shrink-0 overflow-hidden bg-[#080a14] ${STEAM_HEADER_ASPECT} ${ROW_ART}`
      : `relative w-full overflow-hidden bg-[#080a14] ${STEAM_HEADER_ASPECT}`;

  return (
    <div className={containerClass}>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        loading="lazy"
        className={BACKDROP_IMAGE_CLASS}
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        className={isRow ? ROW_FOREGROUND_IMAGE_CLASS : FOREGROUND_IMAGE_CLASS}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] shadow-[inset_0_0_56px_rgba(5,6,15,0.4)]"
        aria-hidden
      />
      {/* No darkening veil on `row` — nothing sits on top of the art there, and the
          gradient would hide the bottom third of the header. */}
      {isRow ? null : (
        <div
          className={`pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-[#05060f]/80 via-[#05060f]/10 to-[#05060f]/25 ${
            isCollection
              ? "md:bg-gradient-to-br md:from-[#05060f]/85 md:via-[#05060f]/20 md:to-transparent"
              : ""
          }`}
          aria-hidden
        />
      )}
    </div>
  );
}
