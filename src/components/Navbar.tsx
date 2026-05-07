"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type NavbarProps = {
  ctaLabel?: string;
  ctaHref?: string;
};

export default function Navbar({
  ctaLabel = "Try it",
  ctaHref = "/recommend",
}: NavbarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    window.location.href = "/";
  };

  return (
    <nav className="border-b border-white/10 bg-[#05060f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-black tracking-tight">
          GamePing <span className="text-cyan-300">AI</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/upgrade"
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-bold text-white/70 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            Premium
          </Link>

          <Link
            href={ctaHref}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-bold hover:bg-white/20 transition"
          >
            {ctaLabel}
          </Link>

          {userEmail && (
            <Link
              href="/dashboard"
              className="text-sm text-white/70 hover:text-cyan-300 transition"
            >
              Dashboard
            </Link>
          )}

          {!userEmail && (
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold hover:bg-white/10 transition"
            >
              Login
            </Link>
          )}

          {userEmail && (
            <>
              <span className="hidden text-sm text-white/60 sm:block">
                {userEmail}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-400/10 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}