export type HomeTheme = "light" | "dark";

export const HOME_THEME_STORAGE_KEY = "gameping-home-theme";

/**
 * Inline script — runs before paint. Light mode is admin-only (live testing), and
 * admin status can't be known synchronously here, so we ALWAYS start in dark. The
 * HomeThemeProvider upgrades confirmed admins to their stored theme after mount.
 * This guarantees non-admins (incl. anyone with a previously saved "light" value)
 * never flash light. Default: dark.
 */
export const HOME_THEME_INIT_SCRIPT = `(function(){try{document.documentElement.setAttribute("data-home-theme","dark");document.documentElement.style.colorScheme="dark";}catch(e){}})();`;

export function readStoredHomeTheme(): HomeTheme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(HOME_THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function storeHomeTheme(theme: HomeTheme): void {
  localStorage.setItem(HOME_THEME_STORAGE_KEY, theme);
}

export function applyHomeThemeToDocument(theme: HomeTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-home-theme", theme);
  document.documentElement.style.colorScheme = theme;
}
