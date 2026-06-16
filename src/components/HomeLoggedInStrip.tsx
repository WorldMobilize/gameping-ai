"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomeTheme } from "@/components/home/home-theme";
import { supabase } from "@/lib/supabase";

type HomeLoggedInStripProps = {
  theme?: HomeTheme;
};

export default function HomeLoggedInStrip({ theme = "light" }: HomeLoggedInStripProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setLoggedIn(!!data.session?.user);
      }
    }

    void sync();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!loggedIn) return null;

  return (
    <div
      className={`border-b px-6 py-3 ${
        isDark
          ? "border-slate-800/80 bg-slate-900/90"
          : "border-cyan-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-violet-50/80"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className={isDark ? "text-slate-400" : "text-slate-600"}>
          Welcome back — pick up where you left off.
        </span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/dashboard"
            className={`font-semibold transition ${
              isDark ? "text-cyan-300 hover:text-cyan-200" : "text-cyan-700 hover:text-cyan-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/recommend"
            className={`font-semibold transition ${
              isDark ? "text-violet-300 hover:text-violet-200" : "text-violet-700 hover:text-violet-800"
            }`}
          >
            New recommendation
          </Link>
        </div>
      </div>
    </div>
  );
}
