import type { ReactNode } from "react";

/**
 * Premium "brushed steel" icon chip — a metallic gradient with a top sheen and
 * inner highlight, blue accent glyph. Coherent with the dark/blue system.
 * Pass a raw <svg> (e.g. the shared Icon) as children. Presentation only.
 */
export default function PremiumIcon({
  children,
  className = "h-12 w-12",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_22px_-10px_rgba(30,64,175,0.65)] ring-1 ring-blue-400/40 dark:from-blue-500 dark:to-blue-800 dark:ring-blue-400/30 ${className}`}
    >
      {/* brushed-metal top sheen */}
      <span aria-hidden className="pointer-events-none absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-white/35 blur-[7px]" />
      {/* subtle darker base for depth */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-900/40 to-transparent" />
      <span className="relative">{children}</span>
    </span>
  );
}
