"use client";

import { useToast } from "@/components/ToastProvider";
import { FEEDBACK_MESSAGE_MAX, FEEDBACK_TYPES, type FeedbackType } from "@/lib/feedback";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type FeedbackButtonProps = {
  className?: string;
};

export default function FeedbackButton({ className = "" }: FeedbackButtonProps) {
  const { showToast } = useToast();
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>(FEEDBACK_TYPES[0].value);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = useCallback(() => {
    if (submitting) return;
    setOpen(false);
  }, [submitting]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.href.slice(0, 2048) : null;

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: trimmed,
          pageUrl,
          email: email.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        showToast({
          variant: "error",
          message: data.error ?? "Could not send feedback. Please try again.",
        });
        return;
      }

      setOpen(false);
      setMessage("");
      setEmail("");
      setType(FEEDBACK_TYPES[0].value);
      showToast({
        variant: "success",
        message: "Thanks — this genuinely helps improve GamePing.",
      });
    } catch {
      showToast({
        variant: "error",
        message: "Could not send feedback. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "text-left text-sm text-slate-400 transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        }
      >
        Share feedback
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
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
            className="relative z-[101] w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#0a0b14] shadow-[0_0_60px_rgba(34,211,238,0.12)]"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300/90">
                    Early access
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
              <p id={descId} className="mt-3 text-sm leading-relaxed text-white/60">
                GamePing is still evolving. If something feels wrong, confusing, inaccurate, or
                just not great, let us know — your feedback genuinely helps improve recommendations
                and pricing quality.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor={`${titleId}-category`} className="text-xs font-bold text-white/50">
                  Category
                </label>
                <select
                  id={`${titleId}-category`}
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
                >
                  {FEEDBACK_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0b14]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${titleId}-message`} className="text-xs font-bold text-white/50">
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
                  className="mt-2 w-full resize-y rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
                />
                <p className="mt-1 text-right text-[11px] text-white/35">
                  {message.length} / {FEEDBACK_MESSAGE_MAX}
                </p>
              </div>

              <div>
                <label htmlFor={`${titleId}-email`} className="text-xs font-bold text-white/50">
                  Email <span className="font-normal text-white/35">(optional)</span>
                </label>
                <input
                  id={`${titleId}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
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
                  className="rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Help improve GamePing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
