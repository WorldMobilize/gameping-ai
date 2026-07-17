"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  COMPANION_CHILD_ITEMS,
  COMPANION_NAV_ITEM,
  CREATORS_NAV_ITEM,
  DISCOVER_HUB_NAV_ITEM,
  DISCOVERY_CHILD_ITEMS,
  DRAWER_ACCOUNT_ITEMS,
  DRAWER_MORE_ITEMS,
  HOME_NAV_ITEM,
  isSiteNavItemActive,
  WORLDMOBILIZE_CHILD_ITEMS,
  WORLDMOBILIZE_NAV_ITEM,
  type SiteNavItem,
} from "@/lib/site-nav";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { isPremiumOrAdminPlan } from "@/lib/product-copy";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

/** Small padlock — marks Premium links as locked for free/anon users. */
function LockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
};

/**
 * Full ecosystem navigation (the drawer is the navigation source of truth):
 * Discover / Deals / Community / Companion / Account pillars. Community and
 * Companion are admin-only concept/alpha areas and stay hidden for everyone
 * else. Same profiles.plan read used elsewhere — no new auth.
 */
export default function NavDrawer({ open, onClose, theme = "light" }: Props) {
  const isLight = theme === "light";
  const pathname = usePathname();
  const { showToast } = useToast();
  const { toggleTheme } = useHomeTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        setIsAdmin(false);
        setIsPremium(false);
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!cancelled) {
        setIsAdmin(profile?.plan === "admin");
        setIsPremium(isPremiumOrAdminPlan(profile?.plan));
      }
    }

    void loadAccess();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadAccess();
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

  const handleLogout = async () => {
    onClose();
    await supabase.auth.signOut();
    showToast({ variant: "success", message: "You’re logged out." });
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  const itemClass = (active: boolean) =>
    `flex items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-sm font-bold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      active
        ? isLight
          ? "border-blue-200 bg-blue-50 text-blue-800 shadow-sm"
          : "border-blue-400/30 bg-blue-500/10 text-blue-200"
        : isLight
          ? "border-transparent text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
          : "border-transparent text-slate-200 hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-200"
    }`;

  const renderNavItem = (item: SiteNavItem, locked = false) => {
    const active = isSiteNavItemActive(pathname, item);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        title={locked ? "Coming soon" : undefined}
        className={itemClass(active)}
      >
        <span>{item.label}</span>
        {locked ? <LockIcon className="h-3.5 w-3.5 shrink-0 opacity-70" /> : null}
      </Link>
    );
  };

  // Secondary child link under a pillar: smaller, muted, bulleted, slides right
  // slightly on hover. Navigates straight to the tool/module.
  const childClass = (active: boolean) =>
    `flex items-center gap-2 rounded-lg py-1.5 pl-3 pr-2 text-[13px] no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      active
        ? "font-semibold text-blue-700 dark:text-blue-300"
        : isLight
          ? "font-medium text-slate-500 hover:translate-x-0.5 hover:text-blue-700"
          : "font-medium text-slate-400 hover:translate-x-0.5 hover:text-blue-300"
    }`;

  const childGroup = (items: SiteNavItem[]) => (
    <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-slate-200/80 pl-2.5 dark:border-white/10">
      {items.map((child) => {
        // Padlock only — the link still works. Premium pages show their own
        // locked preview; the icon just sets the expectation beforehand.
        const locked = child.premium === true && !isPremium;
        // One label, one destination, whatever you pay. The drawer explains what
        // things ARE; a subscriber's own Taste DNA and Steam library hang off the
        // account menu instead. This used to fork on a premiumHref, so "Taste DNA"
        // meant the explainer or the Steam settings depending on who clicked it.
        const href = child.href;
        return (
          <Link
            key={child.label}
            href={href}
            onClick={onClose}
            title={locked ? "Premium" : undefined}
            className={childClass(isSiteNavItemActive(pathname, child))}
          >
            <span aria-hidden className="text-[13px] leading-none text-blue-500/50">
              •
            </span>
            <span>{child.label}</span>
            {locked ? <LockIcon className="h-3 w-3 shrink-0 opacity-70" /> : null}
          </Link>
        );
      })}
    </div>
  );

  const sectionHeading = (label: string, badge?: string) => (
    <p className="flex items-center gap-2 px-4 pb-1 text-[10px] font-black uppercase tracking-[0.28em] text-blue-900 dark:text-blue-300">
      <span>{label}</span>
      {badge ? (
        <span
          className={`rounded-full border border-dashed px-2 py-0.5 text-[9px] font-bold normal-case tracking-[0.08em] ${
            isLight ? "border-slate-300 text-slate-500" : "border-white/25 text-white/60"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </p>
  );

  const sectionClass =
    "mt-4 flex flex-col gap-1 border-t border-slate-200 pt-4 dark:border-white/10";

  const accountRow = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      active
        ? "text-blue-800 dark:text-blue-200"
        : isLight
          ? "text-slate-700 hover:bg-blue-50 hover:text-blue-800"
          : "text-slate-300 hover:bg-blue-500/10 hover:text-blue-200"
    }`;

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
            ? "border-slate-200/80 bg-white/98 shadow-[8px_0_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80"
            : "border-white/10 bg-[#070818]/98 shadow-[8px_0_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div
          className={`relative flex items-center justify-between border-b px-5 py-4 ${
            isLight ? "border-slate-200/80" : "border-white/10"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-900 dark:text-blue-300">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                : "border-white/15 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Close
          </button>
        </div>

        <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {renderNavItem(HOME_NAV_ITEM)}

          {/* Product pillars — each parent link opens the overview; the indented
           * children below jump straight to a specific tool or module. */}
          <div className={sectionClass}>
            {sectionHeading("Products")}
            {renderNavItem(DISCOVER_HUB_NAV_ITEM)}
            {childGroup(DISCOVERY_CHILD_ITEMS)}
          </div>

          <div className={sectionClass}>
            {renderNavItem({ ...COMPANION_NAV_ITEM, label: "Companion" })}
            {childGroup(COMPANION_CHILD_ITEMS)}
          </div>

          <div className={sectionClass}>
            {renderNavItem({ ...WORLDMOBILIZE_NAV_ITEM, label: "WorldMobilize" }, true)}
            {/* Sub-items reveal what WorldMobilize is — admin-only until launch (no spoilers). */}
            {isAdmin ? childGroup(WORLDMOBILIZE_CHILD_ITEMS) : null}
          </div>

          {/* More — site links (stay in the main nav flow). */}
          <div className={sectionClass}>
            {sectionHeading("More")}
            {DRAWER_MORE_ITEMS.map((item) => renderNavItem(item))}
            {renderNavItem(CREATORS_NAV_ITEM)}
          </div>

          {/* Admin — separate section, admin-only (creator earnings / payouts). */}
          {isAdmin ? (
            <div className={sectionClass}>
              {sectionHeading("Admin")}
              {renderNavItem({
                label: "Site analytics",
                href: "/admin/analytics",
                matchPrefix: "/admin/analytics",
              })}
              {renderNavItem({
                label: "Creator earnings",
                href: "/creators/admin",
                matchPrefix: "/creators/admin",
              })}
            </div>
          ) : null}
        </nav>

        {/* Account & settings — separated bottom area (border + background). */}
        <div className={`relative border-t px-3 pb-3 pt-3 ${isLight ? "border-slate-200 bg-slate-50/80" : "border-white/10 bg-white/[0.02]"}`}>
          <p className="px-3 pb-1 pt-1 text-[10px] font-black uppercase tracking-[0.28em] text-blue-900 dark:text-blue-300">
            Account
          </p>
          {loggedIn
            ? DRAWER_ACCOUNT_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={onClose} className={accountRow(isSiteNavItemActive(pathname, item))}>
                  {item.label}
                </Link>
              ))
            : null}

          {/* Theme toggle — admin-only; everyone else is locked to dark. */}
          {isAdmin ? (
            <button type="button" onClick={toggleTheme} className={accountRow(false)} aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}>
              <span className="flex flex-1 items-center gap-3">
                {isLight ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" /></svg>
                )}
                Theme
              </span>
              <span className="text-xs font-medium opacity-70">{isLight ? "Light" : "Dark"}</span>
            </button>
          ) : null}

          {loggedIn ? (
            <button type="button" onClick={() => void handleLogout()} className={accountRow(false)}>Log out</button>
          ) : (
            <Link href="/login" onClick={onClose} className="mt-2 flex items-center justify-center rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white no-underline transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Log in / Sign up
            </Link>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
