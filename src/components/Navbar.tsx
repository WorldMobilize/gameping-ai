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

export default function Navbar({
  ctaLabel = "Try GamePing",
  ctaHref = "/recommend",
}: NavbarProps) {
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
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
        className="w-[min(calc(100vw-1rem),17.5rem)] rounded-2xl border border-white/10 bg-[#0b0c18]/98 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl ring-1 ring-cyan-400/10 pointer-events-auto"
      >
        <div className="border-b border-white/10 px-4 py-3 sm:hidden">
          <p className="truncate text-xs font-bold text-white/80">{userEmail}</p>
        </div>

        <div className="flex flex-col">
          <Link
            href="/dashboard"
            role="menuitem"
            className="flex w-full items-center px-4 py-3 text-sm font-bold text-white/90 no-underline transition hover:bg-cyan-400/10 hover:text-cyan-200 focus-visible:bg-cyan-400/10 focus-visible:outline-none"
            onClick={closeAccountMenu}
          >
            Dashboard
          </Link>

          <Link
            href="/settings/account"
            role="menuitem"
            className="flex w-full flex-col items-stretch px-4 py-3 text-left text-sm font-bold text-white/90 no-underline transition hover:bg-cyan-400/10 hover:text-cyan-200 focus-visible:bg-cyan-400/10 focus-visible:outline-none"
            onClick={closeAccountMenu}
          >
            <span className="block w-full">Account settings</span>
            <span className="mt-0.5 block w-full text-[11px] font-semibold leading-snug text-white/45">
              Privacy, deletion, account data
            </span>
          </Link>

          <Link
            href="/upgrade"
            role="menuitem"
            className="flex w-full items-center px-4 py-3 text-sm font-bold text-white/90 no-underline transition hover:bg-purple-500/15 hover:text-purple-200 focus-visible:bg-purple-500/15 focus-visible:outline-none"
            onClick={closeAccountMenu}
          >
            Premium / Billing
          </Link>

          <div className="my-1 border-t border-white/10" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center px-4 py-3 text-left text-sm font-bold text-purple-200/95 transition hover:bg-purple-500/10 focus-visible:bg-purple-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/35"
            onClick={() => void handleLogout()}
          >
            Logout
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
    <nav className="relative z-30 border-b border-white/10 bg-[#05060f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="relative z-0 flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
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
          <span className="truncate font-black tracking-tight">
            GamePing <span className="text-cyan-300">AI</span>
          </span>
          <span
            className="w-fit shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:hidden"
            title="GamePing early access"
          >
            Early access
          </span>
          <span
            className="hidden w-fit shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45 sm:inline"
            title="GamePing early access"
          >
            Early Access
          </span>
          </Link>
        </div>

        <div className="relative z-0 flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/upgrade"
            className="relative z-0 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-cyan-400/40 hover:text-cyan-200 sm:px-4 sm:text-xs"
          >
            Premium
          </Link>

          {!userEmail ? (
            <>
              <Link
                href={ctaHref}
                className="relative z-0 rounded-full bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20 sm:px-5 sm:text-sm"
              >
                {ctaLabel}
              </Link>

              <Link
                href="/login"
                className="relative z-0 rounded-full border border-white/20 px-3 py-2 text-xs font-bold transition hover:bg-white/10 sm:px-5 sm:text-sm"
              >
                Login
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/recommend"
                className="relative z-0 hidden rounded-full bg-white/10 px-5 py-2 text-sm font-bold transition hover:bg-white/20 sm:inline-flex sm:items-center"
              >
                <span className="whitespace-nowrap">New recommendation</span>
              </Link>

              <div className="relative z-0 shrink-0">
                <button
                  ref={accountMenuButtonRef}
                  type="button"
                  className="flex max-w-[min(100vw-8rem,14rem)] items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-1.5 pr-2 text-left transition hover:border-cyan-400/35 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 sm:gap-2 sm:pl-2 sm:pr-2.5"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="account-menu"
                  id="account-menu-button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#141824] text-sm font-bold leading-none text-white/90"
                    aria-hidden
                  >
                    {avatarInitial(userDisplayName, userEmail)}
                  </span>
                  <span className="hidden min-w-0 flex-1 flex-col sm:flex">
                    <span className="truncate text-[11px] font-bold leading-tight text-white/85">
                      {shortEmailLabel(userEmail, 26)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Account
                    </span>
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-white/45 transition sm:h-4 sm:w-4 ${accountMenuOpen ? "rotate-180" : ""}`}
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
      <NavDrawer open={navOpen} onClose={closeNav} />
    </nav>
    {userEmail ? (
      <div className="relative z-20 border-b border-white/10 bg-[#05060f]/90">
        <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <EmailVerificationNotice compact />
        </div>
      </div>
    ) : null}
    </>
  );
}
