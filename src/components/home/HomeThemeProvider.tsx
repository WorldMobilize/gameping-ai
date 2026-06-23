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
import { supabase } from "@/lib/supabase";
import {
  applyHomeThemeToDocument,
  readStoredHomeTheme,
  storeHomeTheme,
  type HomeTheme,
} from "@/components/home/home-theme";

type HomeThemeContextValue = {
  theme: HomeTheme;
  toggleTheme: () => void;
  ready: boolean;
  /** Light mode is admin-only (live testing) — true only for confirmed admins. */
  canToggleTheme: boolean;
};

const HomeThemeContext = createContext<HomeThemeContextValue | null>(null);

export function HomeThemeProvider({ children }: { children: ReactNode }) {
  // The admin's chosen theme (persisted). Non-admins never apply this.
  const [storedTheme, setStoredTheme] = useState<HomeTheme>("dark");
  // null = still resolving. Light mode is gated on this being true.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  // Light mode is admin-only: non-admins (and the loading state) always resolve
  // to dark, ignoring any previously saved "light" localStorage value.
  const theme: HomeTheme = isAdmin === true ? storedTheme : "dark";

  useEffect(() => {
    setStoredTheme(readStoredHomeTheme());
    setReady(true);
  }, []);

  // Same profiles.plan === "admin" check used by Navbar / AdminOnlyPageGate — no
  // new role system, no schema change. Re-runs on auth changes (login/logout).
  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user) {
          setIsAdmin(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (!cancelled) setIsAdmin(profile?.plan === "admin");
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }

    void loadAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadAdmin();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Apply the RESOLVED theme to the document whenever it changes (dark for
  // everyone until/unless admin is confirmed, then the admin's stored theme).
  useEffect(() => {
    applyHomeThemeToDocument(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    // No-op for non-admins; their theme stays dark and nothing is persisted.
    if (isAdmin !== true) return;
    setStoredTheme((current) => {
      const next: HomeTheme = current === "light" ? "dark" : "light";
      storeHomeTheme(next);
      return next;
    });
  }, [isAdmin]);

  const value = useMemo(
    () => ({ theme, toggleTheme, ready, canToggleTheme: isAdmin === true }),
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
