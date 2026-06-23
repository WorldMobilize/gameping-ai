"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_INPUT,
  APP_MUTED,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import ManageBillingButton from "@/components/ManageBillingButton";
import SteamLibraryImportSection from "@/components/SteamLibraryImportSection";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type PlanKey = "free" | "premium" | "admin" | null;

function planLabel(plan: PlanKey): string {
  if (plan === "premium") return "Premium";
  if (plan === "admin") return "Admin";
  if (plan === "free") return "Free";
  return "Unknown";
}

const DANGER_ZONE_CARD =
  "rounded-3xl border border-slate-200/90 bg-white/70 p-8 shadow-sm shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-slate-950/40";

const DANGER_DELETE_BTN =
  "rounded-full border border-rose-300 bg-rose-50 px-8 py-3.5 text-sm font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [hasEmailPassword, setHasEmailPassword] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanKey>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);

  // Return focus to the trigger button when the delete-account modal closes (a11y).
  useEffect(() => {
    if (!modalOpen) return;
    const trigger = deleteTriggerRef.current;
    return () => {
      trigger?.focus();
    };
  }, [modalOpen]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login?redirect=%2Fsettings%2Faccount");
        return;
      }
      if (cancelled) return;
      setUserEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        const raw = profile?.plan;
        if (raw === "premium" || raw === "admin" || raw === "free") {
          setPlan(raw);
        } else {
          setPlan("free");
        }
      }

      try {
        const res = await fetch("/api/account-auth-hint", { credentials: "include" });
        const json = (await res.json()) as {
          hasEmailPassword?: boolean;
          email?: string | null;
        };
        if (!cancelled && res.ok) {
          if (typeof json.hasEmailPassword === "boolean") {
            setHasEmailPassword(json.hasEmailPassword);
          }
          if (typeof json.email === "string" && json.email) {
            setUserEmail(json.email);
          }
        }
      } catch {
        /* default hasEmailPassword true */
      }

      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleDeleteAccount() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmPhrase,
          password: hasEmailPassword ? password : undefined,
          confirmEmail: hasEmailPassword ? undefined : confirmEmail,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };

      if (!res.ok) {
        showToast({
          variant: "error",
          message: json.error || "Could not delete account.",
        });
        return;
      }

      await supabase.auth.signOut();
      showToast({
        variant: "success",
        message: "Your account and associated data have been deleted.",
      });
      router.replace("/");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <AppPageShell>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600 dark:text-slate-400">
          Loading…
        </div>
      </AppPageShell>
    );
  }

  const isPaid = plan === "premium" || plan === "admin";
  const isPremium = plan === "premium";

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-account-bg" />
        <AppSection maxWidth="max-w-3xl">
        <EmailVerificationNotice className="mb-8" theme="light" />

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Settings
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          Account
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">
          Manage how your GamePing account is stored. For privacy rights and processors, see the{" "}
          <Link
            href="/privacy"
            className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-10 space-y-6">
          <section className={`${APP_CARD} p-8`}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
              Account
            </p>
            <dl className="mt-5 space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="text-sm text-slate-600 dark:text-slate-300">Email</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-white">{userEmail ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="text-sm text-slate-600 dark:text-slate-300">Current plan</dt>
                <dd className="text-sm font-semibold text-[color:var(--page-accent-text)]">{planLabel(plan)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-[color:var(--page-accent-border)] bg-white p-8 shadow-sm dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
              Plan
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {isPaid
                ? "You have access to higher daily limits and more saved searches. Billing is managed through Stripe."
                : "Upgrade for higher daily recommendation limits, more saved runs, and more tracked games."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isPaid ? (
                <Link href="/dashboard" className={APP_SECONDARY_CTA}>
                  Open dashboard
                </Link>
              ) : (
                <Link href="/upgrade" className={APP_PRIMARY_CTA_SM}>
                  Upgrade to Premium
                </Link>
              )}
              {isPremium ? <ManageBillingButton /> : null}
              <Link href="/upgrade" className={APP_SECONDARY_CTA}>
                {isPaid ? "View plan details" : "Compare plans"}
              </Link>
            </div>
            {isPremium ? (
              <p className={`mt-4 ${APP_MUTED}`}>
                Cancel or update your subscription in Stripe&apos;s secure billing portal. You
                will return here when finished.
              </p>
            ) : null}
          </section>

          <SteamLibraryImportSection />

          <section className={`${APP_CARD} p-8`}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
              Preferences & notifications
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Price-drop emails are sent when you track games from their game pages. Alert
              preferences per game (pause/resume) are available on your{" "}
              <Link href="/dashboard" className="font-semibold text-[color:var(--page-accent-text)] underline-offset-2 hover:underline">
                dashboard
              </Link>
              .
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Global notification settings (email frequency, digest mode) are coming soon.
            </p>
          </section>

          <section className={DANGER_ZONE_CARD}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-700 dark:text-rose-300">
              Danger zone
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Delete account</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Permanently delete your GamePing account, saved recommendation runs, tracked games,
              imported Steam library data, alert history tied to those games, profile row, and
              outbound-click records linked to your user ID. This cannot be undone.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
              If you have an active Premium subscription, cancel it in Stripe (use the billing links
              from Stripe&apos;s emails) before deleting your account so you are not charged again.
              GamePing does not cancel Stripe subscriptions automatically from this screen.
            </p>
            <button
              ref={deleteTriggerRef}
              type="button"
              onClick={() => {
                setModalOpen(true);
                setConfirmPhrase("");
                setPassword("");
                setConfirmEmail("");
              }}
              className={`mt-6 ${DANGER_DELETE_BTN}`}
            >
              Delete my account…
            </button>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-300">
          <Link
            href="/dashboard"
            className="font-semibold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </p>
        </AppSection>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={() => !submitting && setModalOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !submitting) setModalOpen(false);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-account-title" className="text-xl font-extrabold text-slate-900">
              Confirm account deletion
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This permanently removes your account and associated GamePing data. Type{" "}
              <span className="font-mono font-semibold text-rose-700">DELETE</span> in the box below to
              confirm you understand this is irreversible.
            </p>

            <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Type DELETE
            </label>
            <input
              className={`${APP_INPUT} mt-2 font-mono`}
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              autoComplete="off"
              placeholder="DELETE"
              autoFocus
            />

            {hasEmailPassword ? (
              <>
                <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Account password
                </label>
                <input
                  type="password"
                  className={`${APP_INPUT} mt-2`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Your password"
                />
              </>
            ) : (
              <>
                <p className="mt-5 text-sm text-slate-600">
                  You signed in with a social provider. Enter your full GamePing account email (
                  <span className="font-semibold text-slate-900">{userEmail ?? "—"}</span>) to confirm.
                </p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email confirmation
                </label>
                <input
                  type="email"
                  className={`${APP_INPUT} mt-2`}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
                className={APP_SECONDARY_CTA}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDeleteAccount()}
                className={`${DANGER_DELETE_BTN} disabled:opacity-50`}
              >
                {submitting ? "Deleting…" : "Delete account permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  );
}
