export type HomeTheme = "light" | "dark";

export const HOME_THEME_STORAGE_KEY = "gameping-home-theme";

/**
 * Inline script — runs before paint. Default is DARK for everyone; only an
 * explicit saved "light" preference (admins can set one) shows light. Runs
 * synchronously so there is no theme flash on load.
 */
export const HOME_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${HOME_THEME_STORAGE_KEY}");var theme=t==="light"?"light":"dark";document.documentElement.setAttribute("data-home-theme",theme);document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.setAttribute("data-home-theme","dark");document.documentElement.style.colorScheme="dark";}})();`;

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
