"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sets `data-page-accent` on <html> from the current route so the page-accent
 * CSS variables (see page-accent.css) resolve to the right identity. UI only —
 * no routing/behaviour changes.
 */
function accentForPath(pathname: string): string {
  if (pathname === "/upgrade") return "premium";
  if (pathname === "/recommend") return "recommend";
  if (pathname === "/curated" || pathname.startsWith("/curated/")) return "curated";
  if (pathname === "/hidden-gems") return "hidden-gems";
  if (pathname === "/games-of-the-week") return "gotw";
  if (pathname === "/weekly-picks") return "weekly";
  if (pathname === "/deals-for-you") return "deals";
  if (pathname === "/monthly-recap") return "recap";
  if (pathname === "/dashboard" || pathname.startsWith("/settings")) return "account";
  if (pathname === "/game" || pathname.startsWith("/game/")) return "games";
  if (pathname === "/games" || pathname.startsWith("/games/")) return "games";
  return "cyan";
}

export default function PageAccentProvider() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.pageAccent = accentForPath(pathname || "/");
  }, [pathname]);

  return null;
}
