"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";

/** Routes that render their own footer (or none). */
const FOOTERLESS_PATHS = new Set(["/", "/verify-success"]);

/** Routes with a fixed cinematic background → translucent glass footer. */
const CINEMATIC_FOOTER_PATHS = new Set([
  "/upgrade",
  "/recommend",
  "/curated",
  "/games",
  "/hidden-gems",
  "/games-of-the-week",
  "/weekly-picks",
  "/deals-for-you",
  "/monthly-recap",
  "/dashboard",
  "/settings/account",
]);

export default function ConditionalFooter() {
  const pathname = usePathname();
  const { theme } = useHomeTheme();

  if (pathname && FOOTERLESS_PATHS.has(pathname)) {
    return null;
  }

  // Pages with a fixed cinematic background get a translucent glass footer that
  // blends in; the footer's accent COLOUR follows the current page via the
  // --page-accent-* variables, so no per-page colour is needed here.
  const p = pathname ?? "";
  const isCinematic =
    CINEMATIC_FOOTER_PATHS.has(p) ||
    p.startsWith("/curated/") ||
    p.startsWith("/games/") ||
    p.startsWith("/game/");

  return <Footer theme={theme} accent={isCinematic ? "themed" : "default"} />;
}
