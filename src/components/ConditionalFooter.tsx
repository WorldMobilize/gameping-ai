"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";

/** Routes that render their own footer (or none). */
const FOOTERLESS_PATHS = new Set(["/", "/verify-success"]);

export default function ConditionalFooter() {
  const pathname = usePathname();
  const { theme } = useHomeTheme();

  if (pathname && FOOTERLESS_PATHS.has(pathname)) {
    return null;
  }

  return <Footer theme={theme} />;
}
