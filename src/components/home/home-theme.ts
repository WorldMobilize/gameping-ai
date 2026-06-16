export type HomeTheme = "light" | "dark";

export const HOME_THEME_STORAGE_KEY = "gameping-home-theme";

export function readStoredHomeTheme(): HomeTheme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(HOME_THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function storeHomeTheme(theme: HomeTheme): void {
  localStorage.setItem(HOME_THEME_STORAGE_KEY, theme);
}
