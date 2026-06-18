import { APP_BRAND_ICON_IMG } from "@/components/app/app-styles";

type PlatformBrandIconProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Platform logos shipped as white-filled SVGs — invert in light mode for contrast. */
export default function PlatformBrandIcon({ src, alt, className = "" }: PlatformBrandIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`${APP_BRAND_ICON_IMG} ${className}`} />
  );
}
