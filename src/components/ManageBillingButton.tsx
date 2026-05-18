"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type ManageBillingButtonProps = {
  className?: string;
  label?: string;
  loadingLabel?: string;
};

export default function ManageBillingButton({
  className = "inline-flex rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60",
  label = "Manage billing",
  loadingLabel = "Opening…",
}: ManageBillingButtonProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function openBillingPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        showToast({
          variant: "error",
          message:
            typeof body.message === "string" && body.message.length > 0
              ? body.message
              : "Could not open billing portal. Try again.",
        });
        return;
      }

      const url = typeof body.url === "string" ? body.url : null;
      if (!url) {
        showToast({
          variant: "error",
          message: "No billing portal URL returned.",
        });
        return;
      }

      window.location.href = url;
    } catch {
      showToast({
        variant: "error",
        message: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void openBillingPortal()}
      className={className}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
