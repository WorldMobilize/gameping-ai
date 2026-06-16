"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import NavDrawer from "@/components/NavDrawer";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type NavbarProps = {
  ctaLabel?: string;
  ctaHref?: string;
  theme?: "dark" | "light";
  showHomeThemeToggle?: boolean;
  onHomeThemeToggle?: () => void;
};

function displayNameFromMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null;
  for (const key of ["full_name", "name", "display_name"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstAvatarLetter(value: string): string | null {
  const match = value.trim().match(/[a-zA-Z0-9]/);
  return match ? match[0].toUpperCase() : null;
}

function avatarInitial(displayName: string | null, email: string): string {
  if (displayName) {
    const fromName = firstAvatarLetter(displayName);
    if (fromName) return fromName;
  }
  const local = email.split("@")[0]?.trim() ?? email.trim();
  return firstAvatarLetter(local) ?? "?";
}

function shortEmailLabel(email: string, max = 22): string {
  if (email.length <= max) return email;
  return `${email.slice(0, max - 1)}…`;
}

type MenuCoords = { top: number; right: number };

/** Core links shown inline from xl (container handles the breakpoint). */
const HOME_NAV_CORE_LINKS = [
  { label: "Recommend", href: "/recommend" },
  { label: "Curated", href: "/curated" },
  { label: "Games", href: "/games" },
  { label: "How it works", href: "#how-it-works" },
] as const;

/** Discovery links shown inline only at 2xl. */
const HOME_NAV_DISCOVERY_LINKS = [
  { label: "Hidden gems", href: "/hidden-gems" },
  { label: "Games of the week", href: "/games-of-the-week" },
] as const;

/** Admin-only preview links — desktop nav shows these only when plan === "admin". */
const HOME_NAV_ADMIN_LINKS = [
  { label: "Weekly picks", href: "/weekly-picks" },
  { label: "Deals for you", href: "/deals-for-you" },
] as const;

export default function Navbar({
  ctaLabel = "Try GamePing",
  ctaHref = "/recommend",
  theme = "light",
  showHomeThemeToggle = false,
  onHomeThemeToggle,
}: NavbarProps) {
  const isLight = theme === "light";
  const { showToast } = useToast();
  const homeNavLinkClass = `${isLight ? "text-slate-600 hover:text-cyan-700" : "text-slate-400 hover:text-cyan-300"} shrink-0 items-center whitespace-nowrap text-sm font-semibold transition`;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<MenuCoords | null>(null);

  const accountMenuButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setUserEmail(user?.email ?? null);
      setUserDisplayName(displayNameFromMetadata(user?.user_metadata));
    };

    void getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserEmail(user?.email ?? null);
      setUserDisplayName(displayNameFromMetadata(user?.user_metadata));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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

      if (!cancelled) setIsAdmin(profile?.plan === "admin");
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

  const closeAccountMenu = useCallback(() => setAccountMenuOpen(false), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const updateMenuPosition = useCallback(() => {
    const btn = accountMenuButtonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setMenuCoords({
      top: r.bottom + 8,
      right: Math.max(8, window.innerWidth - r.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!accountMenuOpen) {
      requestAnimationFrame(() => {
        setMenuCoords(null);
      });
      return;
    }
    requestAnimationFrame(() => {
      updateMenuPosition();
    });
  }, [accountMenuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [accountMenuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (accountMenuButtonRef.current?.contains(t)) return;
      if (accountMenuPanelRef.current?.contains(t)) return;
      closeAccountMenu();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAccountMenu();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountMenuOpen, closeAccountMenu]);

  const handleLogout = async () => {
    closeAccountMenu();
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserDisplayName(null);
    showToast({ variant: "success", message: "You’re logged out." });
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  const accountMenu =
    accountMenuOpen && userEmail && menuCoords ? (
      <div
        ref={accountMenuPanelRef}
        id="account-menu"
        role="menu"
        aria-labelledby="account-menu-button"
        style={{
          position: "fixed",
          top: menuCoords.top,
          right: menuCoords.right,
          zIndex: 9999,
        }}
        className={`w-[min(calc(100vw-1rem),17.5rem)] rounded-2xl border py-2 shadow-lg backdrop-blur-xl pointer-events-auto ${
          isLight
            ? "border-slate-200/90 bg-white/98 shadow-slate-200/60 ring-1 ring-slate-200/80"
            : "border-white/10 bg-[#0b0c18]/98 shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-cyan-400/10"
        }`}
      >
        <div
          className={`border-b px-4 py-3 sm:hidden ${
            isLight ? "border-slate-200/80" : "border-white/10"
          }`}
        >
          <p
            className={`truncate text-xs font-bold ${
              isLight ? "text-slate-700" : "text-white/80"
            }`}
          >
            {userEmail}
          </p>
        </div>

        <div className="flex flex-col">
          <Link
            href="/dashboard"
            role="menuitem"
            className={`flex w-full items-center px-4 py-3 text-sm font-bold no-underline transition focus-visible:outline-none ${
              isLight
                ? "text-slate-800 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:bg-cyan-50"
                : "text-white/90 hover:bg-cyan-400/10 hover:text-cyan-200 focus-visible:bg-cyan-400/10"
            }`}
            onClick={closeAccountMenu}
          >
            Dashboard
          </Link>

          <Link
            href="/settings/account"
            role="menuitem"
            className={`flex w-full flex-col items-stretch px-4 py-3 text-left text-sm font-bold no-underline transition focus-visible:outline-none ${
              isLight
                ? "text-slate-800 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:bg-cyan-50"
                : "text-white/90 hover:bg-cyan-400/10 hover:text-cyan-200 focus-visible:bg-cyan-400/10"
            }`}
            onClick={closeAccountMenu}
          >
            <span className="block w-full">Account settings</span>
            <span
              className={`mt-0.5 block w-full text-[11px] font-semibold leading-snug ${
                isLight ? "text-slate-500" : "text-white/45"
              }`}
            >
              Privacy, deletion, account data
            </span>
          </Link>

          <Link
            href="/upgrade"
            role="menuitem"
            className={`flex w-full items-center px-4 py-3 text-sm font-bold no-underline transition focus-visible:outline-none ${
              isLight
                ? "text-slate-800 hover:bg-violet-50 hover:text-violet-800 focus-visible:bg-violet-50"
                : "text-white/90 hover:bg-purple-500/15 hover:text-purple-200 focus-visible:bg-purple-500/15"
            }`}
            onClick={closeAccountMenu}
          >
            Premium / Billing
          </Link>

          <div
            className={`my-1 border-t ${isLight ? "border-slate-200/80" : "border-white/10"}`}
            role="separator"
          />

          <button
            type="button"
            role="menuitem"
            className={`flex w-full items-center px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none ${
              isLight
                ? "text-violet-700 hover:bg-violet-50 focus-visible:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-400/35"
                : "text-purple-200/95 hover:bg-purple-500/10 focus-visible:bg-purple-500/10 focus-visible:ring-2 focus-visible:ring-purple-400/35"
            }`}
            onClick={() => void handleLogout()}
          >
            Logout
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
    <nav
      className={`gp-nav-bar relative z-30 w-full border-b backdrop-blur-xl ${
        isLight
          ? "border-slate-200/80 bg-white/85 shadow-sm shadow-slate-200/40"
          : showHomeThemeToggle
            ? "border-slate-800/80 bg-[#0b0f1a]/90"
            : "border-white/10 bg-[#05060f]/80"
      }`}
    >
      <div
        className={`gp-nav-inner flex w-full items-center py-4 sm:py-5 ${
          showHomeThemeToggle ? "gp-nav-home-layout" : "justify-between gap-4"
        }`}
      >
        <div className="gp-nav-brand relative z-0 flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-cyan-500/40"
                : "border-white/15 bg-white/[0.06] text-white/80 hover:border-cyan-400/40 hover:bg-white/10 hover:text-cyan-200 focus-visible:ring-cyan-400/50"
            }`}
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link
            href="/"
            className="flex min-w-0 shrink flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
          >
          <span className={`truncate text-lg font-black tracking-tight sm:text-xl ${isLight ? "text-slate-900" : ""}`}>
            GamePing <span className="text-cyan-600">AI</span>
          </span>
          <span
            className={`w-fit shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] sm:hidden ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-white/10 bg-white/[0.04] text-white/45"
            }`}
            title="GamePing early access"
          >
            Early access
          </span>
          <span
            className={`hidden w-fit shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] lg:inline ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-white/10 bg-white/[0.04] text-white/45"
            }`}
            title="GamePing early access"
          >
            Early Access
          </span>
          </Link>
        </div>

        {showHomeThemeToggle ? (
          <nav className="gp-nav-home-links" aria-label="Primary navigation">
            {HOME_NAV_CORE_LINKS.map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  className={`inline-flex ${homeNavLinkClass}`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex ${homeNavLinkClass}`}
                >
                  {item.label}
                </Link>
              )
            )}

            <span className="hidden items-center gap-7 2xl:flex">
              {HOME_NAV_DISCOVERY_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex ${homeNavLinkClass}`}
                >
                  {item.label}
                </Link>
              ))}
            </span>

            {isAdmin ? (
              <span className="hidden items-center gap-7 2xl:flex">
                <span
                  className={`h-5 w-px shrink-0 ${isLight ? "bg-slate-200" : "bg-white/15"}`}
                  aria-hidden
                />
                <span
                  className={`shrink-0 text-[10px] font-black uppercase tracking-[0.22em] ${
                    isLight ? "text-amber-700" : "text-amber-300/90"
                  }`}
                >
                  Admin
                </span>
                {HOME_NAV_ADMIN_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex ${homeNavLinkClass}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </span>
            ) : null}
          </nav>
        ) : null}

        <div
          className={`gp-nav-actions relative z-0 flex shrink-0 items-center gap-3 ${
            showHomeThemeToggle ? "ml-auto" : ""
          }`}
        >
          {showHomeThemeToggle && onHomeThemeToggle ? (
            <button
              type="button"
              onClick={onHomeThemeToggle}
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border p-0 transition focus-visible:outline-none focus-visible:ring-2 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-cyan-500/40"
                  : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800 focus-visible:ring-cyan-400/40"
              }`}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            >
              {isLight ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                </svg>
              )}
            </button>
          ) : null}

          <Link
            href="/upgrade"
            className={`relative z-0 hidden shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:inline-flex sm:items-center sm:px-4 sm:py-2 ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                : showHomeThemeToggle
                  ? "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
            }`}
          >
            Premium
          </Link>

          {!userEmail ? (
            <>
              <Link
                href={ctaHref}
                className={`relative z-0 shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold shadow-md transition sm:px-5 sm:py-2.5 xl:px-6 xl:py-3 xl:text-base ${
                  isLight || showHomeThemeToggle
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-cyan-600/25 hover:-translate-y-0.5 hover:from-cyan-700 hover:to-cyan-600 hover:shadow-lg hover:shadow-cyan-600/30"
                    : "bg-white/10 shadow-none hover:bg-white/20"
                }`}
              >
                {showHomeThemeToggle ? (
                  <>
                    <span className="hidden xl:inline">{ctaLabel}</span>
                    <span className="xl:hidden">Try GamePing</span>
                  </>
                ) : (
                  ctaLabel
                )}
              </Link>

              <Link
                href="/login"
                className={`relative z-0 inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition sm:px-4 sm:py-2.5 md:px-5 md:py-3 md:text-base ${
                  isLight
                    ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    : showHomeThemeToggle
                      ? "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                      : "border-white/20 hover:bg-white/10"
                }`}
              >
                Login
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/recommend"
                className={`relative z-0 hidden rounded-full px-5 py-2 text-sm font-bold transition sm:inline-flex sm:items-center ${
                  isLight
                    ? "bg-cyan-600 text-white hover:bg-cyan-700"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="whitespace-nowrap">New recommendation</span>
              </Link>

              <div className="relative z-0 shrink-0">
                <button
                  ref={accountMenuButtonRef}
                  type="button"
                  className={`flex max-w-[min(100vw-8rem,14rem)] items-center gap-1.5 rounded-full border py-1.5 pl-1.5 pr-2 text-left transition focus-visible:outline-none focus-visible:ring-2 sm:gap-2 sm:pl-2 sm:pr-2.5 ${
                    isLight
                      ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-cyan-500/40"
                      : "border-white/15 bg-white/[0.06] hover:border-cyan-400/35 hover:bg-white/[0.1] focus-visible:ring-cyan-400/50"
                  }`}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="account-menu"
                  id="account-menu-button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold leading-none ${
                      isLight
                        ? "border-slate-200 bg-slate-100 text-slate-700"
                        : "border-white/15 bg-[#141824] text-white/90"
                    }`}
                    aria-hidden
                  >
                    {avatarInitial(userDisplayName, userEmail)}
                  </span>
                  <span className="hidden min-w-0 flex-1 flex-col sm:flex">
                    <span
                      className={`truncate text-[11px] font-bold leading-tight ${
                        isLight ? "text-slate-700" : "text-white/85"
                      }`}
                    >
                      {shortEmailLabel(userEmail, 26)}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isLight ? "text-slate-400" : "text-white/35"
                      }`}
                    >
                      Account
                    </span>
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 transition sm:h-4 sm:w-4 ${
                      isLight ? "text-slate-400" : "text-white/45"
                    } ${accountMenuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {typeof document !== "undefined" && accountMenu
                ? createPortal(accountMenu, document.body)
                : null}
            </>
          )}
        </div>
      </div>
      <NavDrawer open={navOpen} onClose={closeNav} theme={theme} />
    </nav>
    {userEmail ? (
      <div
        className={`relative z-20 border-b ${
          isLight ? "border-slate-200/80 bg-cyan-50/50" : "border-white/10 bg-[#05060f]/90"
        }`}
      >
        <div className="gp-nav-inner py-2">
          <EmailVerificationNotice compact theme={isLight ? "light" : "dark"} />
        </div>
      </div>
    ) : null}
    </>
  );
}
