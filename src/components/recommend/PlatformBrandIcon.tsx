type PlatformBrandIconProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Platform logos rendered via CSS mask so the glyph paints in `currentColor`
 * instead of a hardcoded black/white fill. The parent sets the text colour
 * (e.g. the page accent), so the icon inherits the page identity and adapts to
 * light/dark. The SVG file supplies only the shape (its own fill is ignored).
 */
export default function PlatformBrandIcon({ src, alt, className = "" }: PlatformBrandIconProps) {
  const mask = `url("${src}") center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label={alt}
      className={`block h-full w-full bg-current ${className}`}
      style={{ WebkitMask: mask, mask }}
    />
  );
}
