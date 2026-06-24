"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import { isEmailVerified } from "@/lib/auth-email-verification";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import NavDrawer from "@/components/NavDrawer";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type NavbarProps = {
  ctaLabel?: string;
  ctaHref?: string;
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

/** Active-page test for the nav links (hash links are never "active"). */
function isNavLinkActive(href: string, pathname: string): boolean {
  if (href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Classic head-and-shoulders silhouette for the account avatar. */
function UserSilhouetteIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.06 3.58-6.5 8-6.5s8 2.44 8 6.5a.5.5 0 0 1-.5.5h-15A.5.5 0 0 1 4 20z" />
    </svg>
  );
}

/** Small crown for the Premium pill. */
function CrownIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 7.5l4 3.2L12 4l5 6.7 4-3.2-1.6 10.1a1 1 0 0 1-1 .84H5.6a1 1 0 0 1-1-.84L3 7.5z" />
    </svg>
  );
}

/** Thin vertical divider between desktop nav groups. */
function NavGroupSeparator({ isLight }: { isLight: boolean }) {
  return (
    <span
      className={`h-5 w-px shrink-0 ${isLight ? "bg-slate-200" : "bg-white/15"}`}
      aria-hidden
    />
  );
}

type MenuCoords = { top: number; right: number };

/** Core links shown inline from xl (container handles the breakpoint). */
const HOME_NAV_CORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Recommend", href: "/recommend" },
  { label: "Curated", href: "/curated" },
  { label: "Games", href: "/games" },
] as const;

/** Discovery links (public). Shown inline only at 2xl, space permitting. */
const HOME_NAV_DISCOVERY_LINKS = [
  { label: "Hidden gems", href: "/hidden-gems" },
  { label: "Games of the week", href: "/games-of-the-week" },
] as const;

/** Personal discovery links — desktop nav shows these only to admins (admin-only for now). */
const HOME_NAV_PREMIUM_LINKS = [
  { label: "Weekly picks", href: "/weekly-picks" },
  { label: "Deals for you", href: "/deals-for-you" },
  { label: "Monthly recap", href: "/monthly-recap" },
] as const;

export default function Navbar({
  ctaLabel = "Try GamePing",
  ctaHref = "/recommend",
}: NavbarProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { theme, toggleTheme } = useHomeTheme();
  const isLight = theme === "light";
  // Header accents follow the CURRENT PAGE accent via the --page-accent-* CSS
  // variables (set per route in PageAccentProvider): cyan landing, gold premium,
  // green recommend, etc. No per-page colour ternaries here. Visual only.
  const { showToast } = useToast();
  const navLinkLayout = "shrink-0 items-center whitespace-nowrap text-sm font-semibold transition";

  /**
   * A primary nav link with an animated accent active/hover underline that
   * matches the current page identity (driven by --page-accent-*).
   */
  const renderHomeNavLink = (item: { label: string; href: string }) => {
    const active = isNavLinkActive(item.href, pathname);
    const baseText = isLight ? "text-slate-700" : "text-slate-300";
    const colorClass = active
      ? "text-[color:var(--page-accent-text)]"
      : `${baseText} hover:text-[color:var(--page-accent-text)]`;
    const className = `group relative inline-flex ${navLinkLayout} ${colorClass}`;
    const underline = (
      <span
        aria-hidden
        className={`pointer-events-none absolute -bottom-2 left-0 h-[2px] w-full origin-center rounded-full bg-[var(--page-accent-strong)] shadow-[0_0_8px_var(--page-accent-glow)] transition-transform duration-300 ease-out ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    );

    return item.href.startsWith("#") ? (
      <a key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
        <span>{item.label}</span>
        {underline}
      </a>
    ) : (
      <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
        <span>{item.label}</span>
        {underline}
      </Link>
    );
  };
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  // Discovery + personal feature links are admin-only for now. Same
  // profiles.plan === "admin" check used by AdminOnlyPageGate — no new auth.
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
      setEmailUnverified(!!user && !isEmailVerified(user));
      setUserDisplayName(displayNameFromMetadata(user?.user_metadata));
    };

    void getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserEmail(user?.email ?? null);
      setEmailUnverified(!!user && !isEmailVerified(user));
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
            : "border-white/10 bg-[#0b0c18]/98 shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-[color:var(--page-accent-soft)]"
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
                ? "text-slate-800 hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)] focus-visible:bg-[var(--page-accent-soft)]"
                : "text-white/90 hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)] focus-visible:bg-[var(--page-accent-soft)]"
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
                ? "text-slate-800 hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)] focus-visible:bg-[var(--page-accent-soft)]"
                : "text-white/90 hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)] focus-visible:bg-[var(--page-accent-soft)]"
            }`}
            onClick={closeAccountMenu}
          >
            <span className="block w-full">Account settings</span>
            <span
              className={`mt-0.5 block w-full text-[11px] font-semibold leading-snug ${
                isLight ? "text-slate-600" : "text-white/70"
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
                ? "text-slate-800 hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)] focus-visible:bg-[var(--page-accent-soft)]"
                : "text-white/90 hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)] focus-visible:bg-[var(--page-accent-soft)]"
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
                ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300"
                : "text-slate-300 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20"
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
      className={`gp-nav-bar sticky top-0 z-40 w-full border-b backdrop-blur-xl ${
        isLight
          ? "border-[color:var(--page-accent-border)] bg-[rgba(245,247,250,0.82)] shadow-sm shadow-slate-200/40"
          : "border-white/[0.08] bg-gradient-to-b from-[#0b0f1a]/92 to-[#0b0f1a]/78 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_30px_-16px_rgba(0,0,0,0.8)]"
      }`}
    >
      <div className="gp-nav-inner gp-nav-home-layout flex w-full items-center py-4 sm:py-5">
        <div className="gp-nav-brand relative z-0 flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-[color:var(--page-accent-border)]"
                : "border-white/15 bg-white/[0.06] text-white/80 hover:border-[color:var(--page-accent-border)] hover:bg-white/10 hover:text-[color:var(--page-accent-text)] focus-visible:ring-[color:var(--page-accent-border)]"
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
            GamePing{" "}
            <span className="text-[color:var(--page-accent-text)]">AI</span>
          </span>
          <span
            className={`inline-flex w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase leading-none tracking-[0.18em] [text-indent:0.18em] sm:hidden ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-white/10 bg-white/[0.04] text-white/70"
            }`}
            title="GamePing early access"
          >
            Early access
          </span>
          <span
            className={`hidden w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.22em] [text-indent:0.22em] lg:inline-flex ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-white/10 bg-white/[0.04] text-white/70"
            }`}
            title="GamePing early access"
          >
            Early Access
          </span>
          </Link>
        </div>

        <nav className="gp-nav-home-links" aria-label="Primary navigation">
          {HOME_NAV_CORE_LINKS.map((item) => renderHomeNavLink(item))}

          {/* Discovery — global PUBLIC pages (Hidden Gems / Games of the Week).
           * Shown inline at 2xl, space permitting; always available in the drawer. */}
          <span className="hidden items-center gap-7 2xl:flex">
            <NavGroupSeparator isLight={isLight} />
            {HOME_NAV_DISCOVERY_LINKS.map((item) => renderHomeNavLink(item))}
          </span>

          {/* Premium + Parties — admin-only VISIBILITY for now (same
           * profiles.plan === "admin" check). Premium is a tier, Parties is a
           * future feature. No "Admin" product category. */}
          {isAdmin ? (
            <span className="hidden items-center gap-7 2xl:flex">
              {/* Premium — per-user personalized features */}
              <NavGroupSeparator isLight={isLight} />
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--page-accent-text)]">
                Premium
              </span>
              {HOME_NAV_PREMIUM_LINKS.map((item) => renderHomeNavLink(item))}

              {/* Future / community */}
              <NavGroupSeparator isLight={isLight} />
              {renderHomeNavLink({ label: "Parties", href: "/parties" })}
            </span>
          ) : null}
        </nav>

        <div className="gp-nav-actions relative z-0 ml-auto flex shrink-0 items-center gap-3">
          {/* Light mode is admin-only during live testing — the toggle is hidden
           * for anonymous / free / premium (non-admin) users, who stay in dark. */}
          {isAdmin ? (
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border p-0 transition focus-visible:outline-none focus-visible:ring-2 ${
                isLight
                  ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-[color:var(--page-accent-border)]"
                  : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800 focus-visible:ring-[color:var(--page-accent-border)]"
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

          {/* Premium is a right-side action button — intentionally NOT part of
           * the left-nav active-underline system (no underline, no active state). */}
          {/* Premium pill follows the CURRENT page accent via --page-accent-*
           * (cyan landing / gold premium / green recommend / …). No fixed colour. */}
          {/* Filled primary CTA matching the site's gp-page-cta (follows the
           * current page accent automatically). Same position, route, and
           * responsive sizing as before — only the visual language is upgraded. */}
          <Link
            href="/upgrade"
            className="gp-page-cta group z-0 hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] sm:inline-flex sm:px-4 sm:py-2"
          >
            <CrownIcon className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-px" />
            <span>Premium</span>
          </Link>

          {!userEmail ? (
            <>
              <Link
                href={ctaHref}
                className="gp-page-cta relative z-0 shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold sm:px-5 sm:py-2.5 xl:px-6 xl:py-3 xl:text-base"
              >
                {isHomePage ? (
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
                className={`relative z-0 inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition hover:border-[color:var(--page-accent-border)] sm:px-4 sm:py-2.5 md:px-5 md:py-3 md:text-base ${
                  isLight
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Login
              </Link>
            </>
          ) : (
            <>
              <div className="relative z-0 shrink-0">
                <button
                  ref={accountMenuButtonRef}
                  type="button"
                  title={userDisplayName ?? userEmail}
                  className={`group flex shrink-0 items-center gap-1 rounded-full border p-1 pr-1.5 transition hover:border-[color:var(--page-accent-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] ${
                    isLight
                      ? "border-slate-200 bg-white hover:bg-slate-50"
                      : "border-white/12 bg-white/[0.05] hover:bg-white/[0.09]"
                  }`}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="account-menu"
                  aria-label="Open account menu"
                  id="account-menu-button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[color:var(--page-accent-text)]"
                    aria-hidden
                  >
                    <UserSilhouetteIcon className="h-[18px] w-[18px]" />
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
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
    {userEmail && emailUnverified ? (
      <div
        className={`relative z-20 border-b ${
          isLight ? "border-slate-200/80 bg-[var(--page-accent-soft)]" : "border-white/10 bg-[#05060f]/90"
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
