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
  applyHomeThemeToDocument,
  readStoredHomeTheme,
  storeHomeTheme,
  type HomeTheme,
} from "@/components/home/home-theme";
import { supabase } from "@/lib/supabase";

type HomeThemeContextValue = {
  theme: HomeTheme;
  toggleTheme: () => void;
  ready: boolean;
  /** Only admins may switch theme; everyone else is locked to dark. */
  canToggleTheme: boolean;
};

const HomeThemeContext = createContext<HomeThemeContextValue | null>(null);

export function HomeThemeProvider({ children }: { children: ReactNode }) {
  // Dark for everyone by default (matches the pre-paint init script and SSR).
  // Only admins may switch — non-admins stay dark regardless of any old
  // stored preference.
  const [theme, setTheme] = useState<HomeTheme>("dark");
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const { data } = await supabase.auth.getUser();
      let admin = false;
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", data.user.id)
          .maybeSingle();
        admin = profile?.plan === "admin";
      }
      if (cancelled) return;
      setIsAdmin(admin);
      // Admins get their saved preference; everyone else is forced to dark.
      setTheme(admin ? readStoredHomeTheme() : "dark");
      setReady(true);
    }

    void resolve();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void resolve();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyHomeThemeToDocument(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    if (!isAdmin) return; // locked to dark for non-admins
    setTheme((current) => {
      const next: HomeTheme = current === "light" ? "dark" : "light";
      storeHomeTheme(next);
      return next;
    });
  }, [isAdmin]);

  const value = useMemo(
    () => ({ theme, toggleTheme, ready, canToggleTheme: isAdmin }),
    [theme, toggleTheme, ready, isAdmin]
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
