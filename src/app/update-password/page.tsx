"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

function readRecoveryHint(): boolean {
  if (typeof window === "undefined") return false;
  const { hash, search } = window.location;
  return (
    hash.includes("type=recovery") ||
    new URLSearchParams(search).get("type") === "recovery"
  );
}

type Phase = "checking" | "invalid" | "ready";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [clientError, setClientError] = useState<string | null>(null);

  const recoveryHintRef = useRef(false);
  const phaseRef = useRef<Phase>("checking");

  const goReady = useCallback(() => {
    phaseRef.current = "ready";
    setPhase("ready");
  }, []);

  useEffect(() => {
    phaseRef.current = "checking";
    recoveryHintRef.current = readRecoveryHint();

    let cancelled = false;
    const code = new URLSearchParams(window.location.search).get("code");

    const tryExchange = async () => {
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (!error) goReady();
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        goReady();
      }
    });

    void tryExchange();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session && recoveryHintRef.current) {
        goReady();
      }
    });

    const t = window.setTimeout(() => {
      if (cancelled) return;
      if (phaseRef.current !== "ready") {
        phaseRef.current = "invalid";
        setPhase("invalid");
      }
    }, 4000);

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [goReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showToast({ variant: "error", message: error.message });
        return;
      }

      showToast({
        variant: "success",
        message: "Your password was updated. Redirecting…",
      });

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 1400);
    } finally {
      setLoading(false);
    }
  };

  if (phase === "checking") {
    return (
      <main className="min-h-screen bg-[#05060f] text-white">
        <Navbar />
        <div className="flex min-h-[50vh] items-center justify-center px-6 text-sm text-white/50">
          Verifying reset link…
        </div>
      </main>
    );
  }

  if (phase === "invalid") {
    return (
      <main className="min-h-screen bg-[#05060f] text-white">
        <Navbar />

        <div className="relative flex items-center justify-center px-6 py-24">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <h1 className="text-2xl font-black text-white">
              Link <span className="text-cyan-300">invalid</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              This reset link is invalid or expired. Please request a new one.
            </p>
            <Link
              href="/reset-password"
              className="mt-8 inline-flex rounded-full bg-cyan-400 px-8 py-3 font-bold text-black transition hover:bg-cyan-300"
            >
              Request new link
            </Link>
            <p className="mt-6 text-sm text-white/50">
              <Link href="/login" className="font-semibold text-cyan-300 underline-offset-4 hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <div className="relative flex items-center justify-center px-6 py-24">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h1 className="text-center text-3xl font-black">
            New <span className="text-cyan-300">password</span>
          </h1>

          <p className="mt-3 text-center text-sm text-white/60">
            Choose a new password for your account (at least 8 characters).
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <label htmlFor="new-password" className="sr-only">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <label htmlFor="confirm-password" className="sr-only">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            {clientError ? (
              <p className="mt-3 text-sm text-red-300/95" role="alert">
                {clientError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-cyan-400 py-3 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            <Link href="/login" className="font-semibold text-cyan-300 underline-offset-4 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
