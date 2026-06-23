"use client";

import { useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const consent = window.localStorage.getItem("cookie_consent");
    return !consent;
  });

  function acceptCookies() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function rejectCookies() {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-md rounded-2xl border border-white/10 bg-[#0b0c18]/90 p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-[slideUp_0.4s_ease-out] motion-reduce:animate-none">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-black text-white">Cookies</p>

          <p className="mt-2 text-sm leading-6 text-white/65">
            We use cookies to improve your experience and understand how GamePing
            is used. You can accept or reject non-essential cookies.
          </p>

          <a
            href="/cookies"
            className="mt-2 inline-block rounded text-sm font-bold text-cyan-300 transition hover:text-cyan-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            Read Cookie Policy
          </a>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={rejectCookies}
            className="flex-1 rounded-full border border-white/15 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Reject
          </button>

          <button
            type="button"
            onClick={acceptCookies}
            className="flex-1 rounded-full bg-cyan-400 px-4 py-3 text-sm font-black text-black transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c18]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}