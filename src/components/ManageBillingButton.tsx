"use client";

import { useState } from "react";
import { APP_SECONDARY_CTA } from "@/components/app/app-styles";
import { useToast } from "@/components/ToastProvider";

type ManageBillingButtonProps = {
  className?: string;
  label?: string;
  loadingLabel?: string;
};

export default function ManageBillingButton({
  className = APP_SECONDARY_CTA,
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
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
