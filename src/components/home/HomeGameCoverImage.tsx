"use client";

import Image from "next/image";
import { useState } from "react";

export type HomeCoverSize = "thumb" | "card" | "showcase" | "hero" | "tile";

const SIZE_CLASS: Record<HomeCoverSize, string> = {
  thumb: "relative aspect-[3/4] w-[4.5rem] min-w-[4.5rem] shrink-0 overflow-hidden rounded-lg",
  card: "relative aspect-[3/4] w-full min-w-0 overflow-hidden rounded-xl sm:w-28 sm:shrink-0",
  showcase: "relative aspect-[3/4] w-full min-w-[6rem] overflow-hidden rounded-xl sm:w-36 sm:shrink-0",
  hero: "relative aspect-[3/4] w-full overflow-hidden rounded-xl",
  tile: "relative aspect-[3/4] w-full overflow-hidden rounded-lg",
};

const BACKDROP_CLASS =
  "scale-[1.35] object-cover object-[42%_50%] opacity-[0.45] blur-lg saturate-150 brightness-[0.88]";

const FOREGROUND_CLASS = "z-[1] object-contain object-center";

type HomeGameCoverImageProps = {
  src: string;
  alt: string;
  size?: HomeCoverSize;
  fallbackClassName: string;
  className?: string;
  priority?: boolean;
};

/** Steam header art — contain foreground + blurred fill (homepage mockups only). */
export function HomeGameCoverImage({
  src,
  alt,
  size = "card",
  fallbackClassName,
  className = "",
  priority = false,
}: HomeGameCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${SIZE_CLASS[size]} bg-gradient-to-br ${fallbackClassName} ${className}`}
        role="img"
        aria-label={alt}
      />
    );
  }

  const sizes =
    size === "hero"
      ? "(max-width: 768px) 100vw, 360px"
      : size === "showcase" || size === "tile"
        ? "(max-width: 768px) 40vw, 128px"
        : size === "card"
          ? "112px"
          : "72px";

  return (
    <div className={`${SIZE_CLASS[size]} bg-[#0a0e18] ${className}`}>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        priority={priority}
        sizes={sizes}
        className={BACKDROP_CLASS}
        onError={() => setFailed(true)}
      />
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={FOREGROUND_CLASS}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
