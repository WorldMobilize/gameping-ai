"use client";

import { useFeedback } from "@/components/FeedbackProvider";
import { useEffect, useState } from "react";

function useCookieBannerVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setVisible(!window.localStorage.getItem("cookie_consent"));
      } catch {
        setVisible(false);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  return visible;
}

export default function FloatingFeedbackButton() {
  const { openFeedback } = useFeedback();
  const cookieBannerVisible = useCookieBannerVisible();

  return (
    <button
      type="button"
      onClick={openFeedback}
      aria-label="Share feedback"
      className={[
        "fixed z-40 flex items-center justify-center gap-1.5 rounded-full border border-white/12",
        "bg-[#0a0b14]/90 text-sm font-bold text-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.45)]",
        "backdrop-blur-md transition hover:border-blue-400/35 hover:text-blue-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 h-10 w-10 sm:left-auto sm:right-6 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5",
        cookieBannerVisible ? "sm:bottom-32" : "sm:bottom-6",
      ].join(" ")}
    >
      <span aria-hidden="true" className="text-base leading-none sm:text-sm">
        💬
      </span>
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );
}
