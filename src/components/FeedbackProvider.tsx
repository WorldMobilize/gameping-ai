"use client";

import { FEEDBACK_MESSAGE_MAX, FEEDBACK_TYPES, type FeedbackType } from "@/lib/feedback";
import { loadFeedbackRecommendContext } from "@/lib/feedback-recommend-context";
import { trackProductEvent } from "@/lib/product-analytics/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type FormStatus = "idle" | "success" | "error";

type FeedbackContextValue = {
  openFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>(FEEDBACK_TYPES[0].value);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const resetForm = useCallback(() => {
    setMessage("");
    setEmail("");
    setType(FEEDBACK_TYPES[0].value);
    setStatus("idle");
    setStatusMessage("");
  }, []);

  const close = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    resetForm();
  }, [submitting, resetForm]);

  const openFeedback = useCallback(() => {
    resetForm();
    setOpen(true);
  }, [resetForm]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.href.slice(0, 2048) : null;
      const recommendationContext = loadFeedbackRecommendContext();

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: trimmed,
          pageUrl,
          email: email.trim() || undefined,
          ...(recommendationContext
            ? { recommendationContext }
            : {}),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setStatusMessage(data.error ?? "Could not send feedback. Please try again.");
        return;
      }

      setStatus("success");
      trackProductEvent("feedback_submitted", {
        metadata: { type },
      });
      setStatusMessage("Thanks — this genuinely helps improve GamePing.");
      setMessage("");
      setEmail("");
      setType(FEEDBACK_TYPES[0].value);
    } catch {
      setStatus("error");
      setStatusMessage("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FeedbackContext.Provider value={{ openFeedback }}>
      {children}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={close}
            aria-label="Close feedback form"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-[101] flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#0a0b14] shadow-[0_0_60px_rgba(37,99,235,0.12)]"
          >
            <div className="shrink-0 border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300/90">
                    Feedback
                  </p>
                  <h2 id={titleId} className="mt-2 text-xl font-black text-white">
                    What could GamePing do better?
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p id={descId} className="mt-3 text-sm leading-relaxed text-white/75">
                GamePing is still evolving. If something feels wrong, confusing, inaccurate, or
                just not great, let us know — your feedback genuinely helps improve recommendations
                and pricing quality.
              </p>
            </div>

            {status === "success" ? (
              <div className="overflow-y-auto px-6 py-8 space-y-5">
                <p
                  className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-sm font-semibold leading-relaxed text-blue-100"
                  role="status"
                >
                  {statusMessage}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full bg-blue-800 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
                {status === "error" && statusMessage ? (
                  <p
                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-100"
                    role="alert"
                  >
                    {statusMessage}
                  </p>
                ) : null}

                <div>
                  <label htmlFor={`${titleId}-category`} className="text-xs font-bold text-white/70">
                    Category
                  </label>
                  <select
                    id={`${titleId}-category`}
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                    disabled={submitting}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/25"
                  >
                    {FEEDBACK_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0a0b14]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${titleId}-message`} className="text-xs font-bold text-white/70">
                    Your feedback
                  </label>
                  <textarea
                    id={`${titleId}-message`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                    required
                    rows={5}
                    maxLength={FEEDBACK_MESSAGE_MAX}
                    placeholder="What felt off, confusing, or worth improving?"
                    className="mt-2 w-full resize-y rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/25"
                  />
                  <p className="mt-1 text-right text-[11px] text-white/65">
                    {message.length} / {FEEDBACK_MESSAGE_MAX}
                  </p>
                </div>

                <div>
                  <label htmlFor={`${titleId}-email`} className="text-xs font-bold text-white/70">
                    Email <span className="font-normal text-white/65">(optional)</span>
                  </label>
                  <input
                    id={`${titleId}-email`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/25"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={close}
                    disabled={submitting}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="rounded-full bg-blue-800 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : "Help improve GamePing"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}
