"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [hasEmailPassword, setHasEmailPassword] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      <main className="min-h-screen bg-[#05060f] text-white">
        <Navbar />
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/50">
          Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Settings</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Account</h1>
          <p className="mt-4 text-white/60">
            Manage how your GamePing account is stored. For privacy rights and processors, see the{" "}
            <Link href="/privacy" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-10 rounded-3xl border border-red-400/25 bg-red-500/[0.06] p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-200/90">
              Danger zone
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Delete account</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Permanently delete your GamePing account, saved recommendation runs, tracked games,
              alert history tied to those games, profile row, and outbound-click records linked to
              your user ID. This cannot be undone.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/60">
              If you have an active Premium subscription, cancel it in Stripe (use the billing links
              from Stripe&apos;s emails) before deleting your account so you are not charged again.
              GamePing does not cancel Stripe subscriptions automatically from this screen.
            </p>
            <button
              type="button"
              onClick={() => {
                setModalOpen(true);
                setConfirmPhrase("");
                setPassword("");
                setConfirmEmail("");
              }}
              className="mt-6 rounded-full border border-red-400/50 bg-red-500/20 px-8 py-3.5 text-sm font-black text-red-100 transition hover:bg-red-500/30"
            >
              Delete my account…
            </button>
          </div>

          <p className="mt-10 text-sm text-white/45">
            <Link href="/dashboard" className="font-semibold text-cyan-300 hover:underline">
              ← Back to dashboard
            </Link>
          </p>
        </div>
      </section>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={() => !submitting && setModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#0b0c18] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-account-title" className="text-xl font-black text-white">
              Confirm account deletion
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              This permanently removes your account and associated GamePing data. Type{" "}
              <span className="font-mono font-bold text-red-200">DELETE</span> in the box below to
              confirm you understand this is irreversible.
            </p>

            <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-white/50">
              Type DELETE
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm outline-none focus:border-red-400/50"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              autoComplete="off"
              placeholder="DELETE"
            />

            {hasEmailPassword ? (
              <>
                <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-white/50">
                  Account password
                </label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-400/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Your password"
                />
              </>
            ) : (
              <>
                <p className="mt-5 text-sm text-white/60">
                  You signed in with a social provider. Enter your full GamePing account email (
                  <span className="font-semibold text-white">{userEmail ?? "—"}</span>) to confirm.
                </p>
                <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-white/50">
                  Email confirmation
                </label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-400/50"
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
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDeleteAccount()}
                className="rounded-full bg-red-500 px-6 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {submitting ? "Deleting…" : "Delete account permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
