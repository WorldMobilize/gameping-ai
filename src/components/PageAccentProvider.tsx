"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

/**
 * Sets `data-page-accent` on <html> from the current route so the page-accent
 * CSS variables (see page-accent.css) resolve to the right identity. UI only —
 * no routing/behaviour changes.
 */
function accentForPath(pathname: string): string {
  if (pathname === "/upgrade") return "premium";
  if (pathname === "/recommend") return "recommend";
  if (pathname === "/games-like" || pathname.startsWith("/games-like/")) return "curated";
  if (pathname === "/collections" || pathname.startsWith("/collections/")) return "curated";
  if (pathname === "/hidden-gems") return "hidden-gems";
  if (pathname === "/games-of-the-week") return "gotw";
  if (pathname === "/weekly-picks") return "weekly";
  if (pathname === "/deals-for-you") return "deals";
  if (pathname === "/monthly-recap") return "recap";
  if (pathname === "/dashboard" || pathname.startsWith("/settings")) return "account";
  // Auth pages share the Account/Dashboard (silver) identity.
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/check-email" ||
    pathname === "/reset-password" ||
    pathname === "/update-password" ||
    pathname === "/verify-success"
  ) {
    return "account";
  }
  if (pathname === "/game" || pathname.startsWith("/game/")) return "games";
  if (pathname === "/games" || pathname.startsWith("/games/")) return "games";
  return "cyan";
}

function applyAccent(pathname: string): void {
  document.documentElement.dataset.pageAccent = accentForPath(pathname || "/");
}

// Apply before paint on the client (useLayoutEffect), but fall back to useEffect
// on the server to avoid the SSR layout-effect warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function PageAccentProvider() {
  const pathname = usePathname();

  // Apply BEFORE paint so a restored page (e.g. /recommend after browser Back on
  // mobile, where bfcache is often evicted and the route reloads fresh) never
  // paints with the previous/default accent. The recommend page restores its
  // results in a layout effect too, so the accent must land in the SAME pre-paint
  // phase or the restored results flash/persist with the wrong colors.
  useIsomorphicLayoutEffect(() => {
    applyAccent(pathname || "/");
  }, [pathname]);

  // bfcache restore / browser Back can reveal a frozen (or freshly reloaded) tree
  // without re-running React effects. Re-apply the accent for the CURRENT URL on
  // pageshow/popstate so styling always matches the visible route — keeping mobile
  // (bfcache-evicted) and desktop (bfcache-restored) visually consistent. UI only.
  useEffect(() => {
    const reapply = () => applyAccent(window.location.pathname || "/");
    window.addEventListener("pageshow", reapply);
    window.addEventListener("popstate", reapply);
    return () => {
      window.removeEventListener("pageshow", reapply);
      window.removeEventListener("popstate", reapply);
    };
  }, []);

  return null;
}
