import Image from "next/image";

/** Native Steam library header ratio (460×215). */
export const STEAM_HEADER_ASPECT = "aspect-[460/215]" as const;

/** Blurred fill — bleeds art into the frame so letterboxing feels intentional. */
const BACKDROP_IMAGE_CLASS =
  "scale-[1.35] object-cover object-[42%_50%] opacity-[0.52] blur-lg saturate-150 brightness-[0.88]";

/**
 * Hybrid foreground: contain + slight overscale clips only edges, not logos.
 * Steam headers anchor left-of-center where titles/logos usually sit.
 */
const FOREGROUND_IMAGE_CLASS =
  "z-[1] scale-[1.1] object-contain object-[42%_50%] transition duration-500 group-hover:scale-[1.13]";

type CuratedGameArtProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  /** Collection cards use a fixed-width column on desktop; carousel fills card width. */
  variant?: "carousel" | "collection";
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

  return (
    <div
      className={
        isCollection
          ? `relative w-full shrink-0 overflow-hidden bg-[#080a14] ${STEAM_HEADER_ASPECT} md:w-[min(280px,42%)] md:max-w-[300px] md:self-start`
          : `relative w-full overflow-hidden bg-[#080a14] ${STEAM_HEADER_ASPECT}`
      }
    >
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
        className={FOREGROUND_IMAGE_CLASS}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] shadow-[inset_0_0_56px_rgba(5,6,15,0.4)]"
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-[#05060f]/80 via-[#05060f]/10 to-[#05060f]/25 ${
          isCollection
            ? "md:bg-gradient-to-br md:from-[#05060f]/85 md:via-[#05060f]/20 md:to-transparent"
            : ""
        }`}
        aria-hidden
      />
    </div>
  );
}
