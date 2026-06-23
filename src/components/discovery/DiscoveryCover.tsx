"use client";

import { useState } from "react";

/**
 * Cover image with a graceful, accent-tinted fallback. Uses a plain <img> (not
 * next/image) so an unexpected store-CDN miss degrades to a branded placeholder
 * instead of a broken image — important while covers come from static IDs.
 */
export default function DiscoveryCover({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[var(--page-accent-soft)] via-slate-900/30 to-slate-900/60 ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="px-4 text-center text-sm font-bold text-white/85">{alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
