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
    <div className="border-b border-cyan-400/20 bg-cyan-400/[0.06] px-6 py-3.5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-white/65">
          Welcome back — jump back into discovery or review what you saved.
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-bold">
          <Link
            href="/dashboard"
            className="text-cyan-300 transition hover:text-cyan-200 hover:underline"
          >
            Continue to dashboard
          </Link>
          <Link
            href="/recommend"
            className="text-cyan-300 transition hover:text-cyan-200 hover:underline"
          >
            Start a new recommendation
          </Link>
        </div>
      </div>
    </div>
  );
}
