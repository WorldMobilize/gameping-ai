"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredHomeTheme,
  storeHomeTheme,
  type HomeTheme,
} from "@/components/home/home-theme";

type HomeThemeContextValue = {
  theme: HomeTheme;
  toggleTheme: () => void;
  ready: boolean;
};

const HomeThemeContext = createContext<HomeThemeContextValue | null>(null);

export function HomeThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<HomeTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readStoredHomeTheme());
    setReady(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: HomeTheme = current === "light" ? "dark" : "light";
      storeHomeTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, ready }),
    [theme, toggleTheme, ready]
  );

  return <HomeThemeContext.Provider value={value}>{children}</HomeThemeContext.Provider>;
}

export function useHomeTheme(): HomeThemeContextValue {
  const ctx = useContext(HomeThemeContext);
  if (!ctx) {
    throw new Error("useHomeTheme must be used within HomeThemeProvider");
  }
  return ctx;
}
