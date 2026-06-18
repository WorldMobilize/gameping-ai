"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  isSiteNavItemActive,
  PREMIUM_DISCOVERY_NAV_ITEMS,
  SITE_NAV_ITEMS,
  type SiteNavItem,
} from "@/lib/site-nav";
import { hasPremiumDiscoveryAccess } from "@/lib/discovery/premium-access";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
};

export default function NavDrawer({ open, onClose, theme = "light" }: Props) {
  const isLight = theme === "light";
  const pathname = usePathname();
  const [hasPremiumDiscovery, setHasPremiumDiscovery] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPremiumDiscovery() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        setHasPremiumDiscovery(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!cancelled) setHasPremiumDiscovery(hasPremiumDiscoveryAccess(profile?.plan));
    }

    void loadPremiumDiscovery();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadPremiumDiscovery();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const renderNavItem = (item: SiteNavItem) => {
    const active = isSiteNavItemActive(pathname, item);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`rounded-xl px-4 py-3.5 text-sm font-bold no-underline transition focus-visible:outline-none focus-visible:ring-2 ${
          active
            ? isLight
              ? "border border-cyan-200 bg-cyan-50 text-cyan-800 shadow-sm focus-visible:ring-cyan-500/30"
              : "border border-cyan-400/35 bg-cyan-400/10 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)] focus-visible:ring-cyan-400/50"
            : isLight
              ? "border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-cyan-500/30"
              : "border border-transparent text-white/80 hover:border-white/10 hover:bg-white/[0.06] hover:text-white focus-visible:ring-cyan-400/50"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className={`absolute inset-0 backdrop-blur-[2px] ${
          isLight ? "bg-slate-900/35" : "bg-black/65"
        }`}
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18.5rem)] flex-col border-r backdrop-blur-xl ${
          isLight
            ? "border-slate-200/90 bg-white/98 shadow-[8px_0_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80"
            : "border-cyan-400/20 bg-[#070818]/98 shadow-[8px_0_48px_rgba(0,0,0,0.55)] ring-1 ring-purple-500/15"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        {isLight ? (
          <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl" />
        ) : (
          <>
            <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-16 left-0 h-32 w-32 rounded-full bg-purple-600/20 blur-3xl" />
          </>
        )}

        <div
          className={`relative flex items-center justify-between border-b px-5 py-4 ${
            isLight ? "border-slate-200/80" : "border-white/10"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-[0.32em] ${
              isLight ? "text-cyan-700" : "text-cyan-200/90"
            }`}
          >
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                : "border-white/15 bg-white/[0.06] text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
            }`}
          >
            Close
          </button>
        </div>

        <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {SITE_NAV_ITEMS.map(renderNavItem)}

          {hasPremiumDiscovery ? (
            <div
              className={`mt-4 flex flex-col gap-1 border-t border-dashed pt-4 ${
                isLight ? "border-violet-300/70" : "border-violet-400/25"
              }`}
            >
              <p
                className={`px-4 pb-2 text-[10px] font-black uppercase tracking-[0.28em] ${
                  isLight ? "text-violet-700" : "text-violet-300/90"
                }`}
              >
                Premium discovery
              </p>
              {PREMIUM_DISCOVERY_NAV_ITEMS.map(renderNavItem)}
            </div>
          ) : null}
        </nav>

        <p
          className={`relative border-t px-5 py-4 text-[11px] leading-relaxed ${
            isLight
              ? "border-slate-200/80 text-slate-500"
              : "border-white/10 text-white/40"
          }`}
        >
          Discovery that learns your taste over time.
        </p>
      </aside>
    </div>,
    document.body
  );
}
