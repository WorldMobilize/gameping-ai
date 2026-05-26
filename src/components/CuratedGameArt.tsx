import Image from "next/image";

/** Native Steam library header ratio (460×215). */
export const STEAM_HEADER_ASPECT = "aspect-[460/215]" as const;

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
 * Steam header art for curated cards — full artwork visible, no aggressive crop.
 * Collection cards use a soft blurred fill behind `object-contain` for a cinematic frame.
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
          ? `relative w-full shrink-0 overflow-hidden bg-[#0a0c16] ${STEAM_HEADER_ASPECT} md:w-[min(280px,42%)] md:max-w-[300px] md:self-start`
          : `relative w-full overflow-hidden bg-[#0a0c16] ${STEAM_HEADER_ASPECT}`
      }
    >
      {isCollection ? (
        <Image
          src={src}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="scale-110 object-cover object-center opacity-35 blur-md saturate-125"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-cyan-950/25 via-[#0a0c16] to-purple-950/20"
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        className="relative z-[1] object-contain object-center transition duration-500 group-hover:scale-[1.02]"
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#05060f]/85 via-[#05060f]/15 to-transparent ${
          isCollection ? "md:bg-gradient-to-r md:from-[#05060f]/90 md:via-[#05060f]/25 md:to-transparent" : ""
        }`}
      />
    </div>
  );
}
