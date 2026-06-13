"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomeLoggedInStrip() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setLoggedIn(!!data.session?.user);
      }
    }

    sync();

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
    <div className="border-b border-white/[0.06] bg-[#0c0f18]/95 px-6 py-3">
      <div className="mx-auto flex max-w-[var(--gp-max,1180px)] flex-col gap-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-white/50">
          Welcome back — pick up where you left off.
        </span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/dashboard"
            className="font-medium text-teal-200/90 transition hover:text-teal-100"
          >
            Dashboard
          </Link>
          <Link
            href="/recommend"
            className="font-medium text-teal-200/90 transition hover:text-teal-100"
          >
            New recommendation
          </Link>
        </div>
      </div>
    </div>
  );
}
