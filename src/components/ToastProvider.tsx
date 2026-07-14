"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
};

type ToastOptions = {
  variant: ToastVariant;
  message: string;
  title?: string;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (opts: ToastOptions) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function variantStyles(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-blue-400/40 bg-[#0b0c18]/95 text-white shadow-[0_0_24px_rgba(37,99,235,0.15)]";
    case "error":
      return "border-red-400/35 bg-[#0b0c18]/95 text-white shadow-[0_0_24px_rgba(248,113,113,0.12)]";
    default:
      return "border-purple-400/35 bg-[#0b0c18]/95 text-white shadow-[0_0_24px_rgba(168,85,247,0.12)]";
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const duration = opts.durationMs ?? (opts.variant === "error" ? 5500 : 4200);

      setToasts((prev) => [
        ...prev,
        {
          id,
          variant: opts.variant,
          title: opts.title,
          message: opts.message,
        },
      ]);

      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-stretch gap-2 px-4 sm:inset-x-auto sm:right-6 sm:top-4 sm:bottom-auto sm:left-auto sm:w-[min(22rem,calc(100vw-2rem))]"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 backdrop-blur-xl ${variantStyles(
              t.variant
            )}`}
          >
            {t.title && (
              <p className="text-sm font-black text-white">{t.title}</p>
            )}
            <p
              className={`text-sm leading-6 text-white/85 ${t.title ? "mt-1" : ""}`}
            >
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="mt-2 text-xs font-bold text-white/70 underline-offset-2 hover:text-white/90 hover:underline"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
