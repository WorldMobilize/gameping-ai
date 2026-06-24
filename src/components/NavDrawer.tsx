"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  DISCOVERY_NAV_ITEMS,
  isSiteNavItemActive,
  PARTIES_NAV_ITEM,
  PARTIES_SUBNAV_ITEMS,
  PREMIUM_DISCOVERY_NAV_ITEMS,
  SITE_NAV_ITEMS,
  type SiteNavItem,
} from "@/lib/site-nav";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
};

export default function NavDrawer({ open, onClose, theme = "light" }: Props) {
  const isLight = theme === "light";
  const pathname = usePathname();
  // Discovery + premium feature pages and GamePing Parties are admin-only for now.
  // Same profiles.plan === "admin" check used by AdminOnlyPageGate — no new auth.
  const [isAdmin, setIsAdmin] = useState(false);
  const [partiesOpen, setPartiesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
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

      if (!cancelled) {
        setIsAdmin(profile?.plan === "admin");
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
        className={`rounded-xl border px-4 py-3.5 text-sm font-bold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] ${
          active
            ? isLight
              ? "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[color:var(--page-accent-text)] shadow-sm"
              : "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[color:var(--page-accent-text)] shadow-[0_0_20px_var(--page-accent-glow)]"
            : isLight
              ? "border-transparent text-slate-700 hover:border-[color:var(--page-accent-border)] hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)]"
              : "border-transparent text-white/80 hover:border-[color:var(--page-accent-border)] hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)]"
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
            ? "border-[color:var(--page-accent-border)] bg-white/98 shadow-[8px_0_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80"
            : "border-[color:var(--page-accent-border)] bg-[#070818]/98 shadow-[8px_0_48px_rgba(0,0,0,0.55)] ring-1 ring-[color:var(--page-accent-border)]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        {isLight ? (
          <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-[var(--page-accent-soft)] blur-3xl" />
        ) : (
          <>
            <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-[var(--page-accent-soft)] blur-3xl" />
            <div className="pointer-events-none absolute bottom-16 left-0 h-32 w-32 rounded-full bg-[var(--page-accent-soft)] blur-3xl" />
          </>
        )}

        <div
          className={`relative flex items-center justify-between border-b px-5 py-4 ${
            isLight ? "border-slate-200/80" : "border-white/10"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[color:var(--page-accent-text)]">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-text)] ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                : "border-white/15 bg-white/[0.06] text-white/70"
            }`}
          >
            Close
          </button>
        </div>

        <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {SITE_NAV_ITEMS.map(renderNavItem)}

          {/* Discovery — global public pages (visible to everyone). */}
          <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-cyan-400/30 pt-4">
            <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">
              Discovery
            </p>
            {DISCOVERY_NAV_ITEMS.map(renderNavItem)}
          </div>

          {isAdmin ? (
            <>
              {/* Premium — per-user personalized features. */}
              <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-cyan-400/30 pt-4">
                <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">
                  Premium
                </p>
                {PREMIUM_DISCOVERY_NAV_ITEMS.map(renderNavItem)}
              </div>

              {/* Community / future. */}
              <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-cyan-400/30 pt-4">
                <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">
                  Community
                </p>
                <div className="mt-1 flex items-stretch gap-1">
                <Link
                  href={PARTIES_NAV_ITEM.href}
                  onClick={onClose}
                  className={`flex-1 rounded-xl border px-4 py-3.5 text-sm font-bold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                    isSiteNavItemActive(pathname, PARTIES_NAV_ITEM)
                      ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200"
                      : isLight
                        ? "border-transparent text-slate-700 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-700"
                        : "border-transparent text-white/80 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200"
                  }`}
                >
                  {PARTIES_NAV_ITEM.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setPartiesOpen((v) => !v)}
                  aria-expanded={partiesOpen}
                  aria-controls="parties-submenu"
                  aria-label={
                    partiesOpen
                      ? "Collapse GamePing Parties categories"
                      : "Expand GamePing Parties categories"
                  }
                  className={`flex w-11 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                    isLight
                      ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-400/40 hover:text-cyan-700"
                      : "border-white/15 bg-white/[0.06] text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${partiesOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              </div>
                {partiesOpen ? (
                  <div
                    id="parties-submenu"
                    className="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto pl-3"
                  >
                    {PARTIES_SUBNAV_ITEMS.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onClose}
                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                          isLight
                            ? "text-slate-600 hover:bg-cyan-500/10 hover:text-cyan-700"
                            : "text-white/75 hover:bg-cyan-500/10 hover:text-cyan-200"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </nav>

        <p
          className={`relative border-t px-5 py-4 text-[11px] leading-relaxed ${
            isLight
              ? "border-slate-200/80 text-slate-600"
              : "border-white/10 text-white/70"
          }`}
        >
          Discovery that learns your taste over time.
        </p>
      </aside>
    </div>,
    document.body
  );
}
