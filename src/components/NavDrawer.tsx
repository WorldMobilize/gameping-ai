"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { isSiteNavItemActive, SITE_NAV_ITEMS } from "@/lib/site-nav";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NavDrawer({ open, onClose }: Props) {
  const pathname = usePathname();

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

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside
        className="absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18.5rem)] flex-col border-r border-cyan-400/20 bg-[#070818]/98 shadow-[8px_0_48px_rgba(0,0,0,0.55)] backdrop-blur-xl ring-1 ring-purple-500/15"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-16 left-0 h-32 w-32 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200/90">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            Close
          </button>
        </div>

        <nav className="relative flex flex-1 flex-col gap-1 px-3 py-4">
          {SITE_NAV_ITEMS.map((item) => {
            const active = isSiteNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`rounded-xl px-4 py-3.5 text-sm font-bold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                  active
                    ? "border border-cyan-400/35 bg-cyan-400/10 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                    : "border border-transparent text-white/80 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="relative border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-white/40">
          Discovery that learns your taste over time.
        </p>
      </aside>
    </div>,
    document.body
  );
}
