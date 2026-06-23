"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { supabase } from "@/lib/supabase";

/** Admin-only homepage tools — uses existing profiles.plan check; no PING robot. */
export default function HomeAdminSection() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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

      setIsAdmin(profile?.plan === "admin");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isAdmin !== true) return null;

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8"
      aria-label="Admin tools"
    >
      <div
        className={`rounded-[28px] border border-dashed p-6 sm:p-8 ${
          isDark
            ? "border-amber-500/30 bg-amber-950/20"
            : "border-amber-300/80 bg-amber-50/60"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}
            >
              Admin only
            </p>
            <h3 className={`mt-2 text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              PING preview &amp; tools
            </h3>
            <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Internal testing area — not shown to public visitors. Text-only roadmap copy is used
              on the public page; no PING robot is rendered here.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/recommend?mode=ping"
              className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${
                isDark
                  ? "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                  : "bg-amber-200/80 text-amber-900 hover:bg-amber-200"
              }`}
            >
              Open PING mode
            </Link>
            <Link
              href="/dashboard"
              className={`inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${
                isDark
                  ? "border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-900/60"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
