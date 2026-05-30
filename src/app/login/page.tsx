"use client";

import {
  getEmailVerificationRedirectUrl,
  VERIFY_SUCCESS_PATH,
} from "@/lib/auth-redirects";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ToastProvider";
import { validateSignupPassword } from "@/lib/auth-email-verification";
import { trackProductEvent } from "@/lib/product-analytics/client";

const DEFAULT_POST_AUTH_REDIRECT = "/";

/** Only same-origin paths; blocks open redirects and external URLs. */
function sanitizeInternalRedirect(raw: string | null): string {
  if (raw == null || raw === "") return DEFAULT_POST_AUTH_REDIRECT;

  let candidate = raw.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }
  if (candidate.includes("://")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  const noHash = candidate.split("#")[0] ?? "";
  if (!noHash.startsWith("/")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  return noHash || DEFAULT_POST_AUTH_REDIRECT;
}

function LoginForm() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const redirectParam =
    searchParams.get("redirect") ?? searchParams.get("next");
  const emailVerified = searchParams.get("verified") === "1";
  const authCode = searchParams.get("code");
  const safeRedirect = useMemo(
    () => sanitizeInternalRedirect(redirectParam),
    [redirectParam]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (authCode && !emailVerified) {
      const next = encodeURIComponent(VERIFY_SUCCESS_PATH);
      window.location.replace(
        `/auth/callback?code=${encodeURIComponent(authCode)}&next=${next}`
      );
    }
  }, [authCode, emailVerified]);

  useEffect(() => {
    if (!emailVerified) return;
    showToast({
      variant: "success",
      message: "Email verified. You can now log in.",
    });
  }, [emailVerified, showToast]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.includes("type=recovery")) return;
    if (!hash.includes("access_token")) return;

    let cancelled = false;
    void (async () => {
      await supabase.auth.signOut();
      if (cancelled) return;
      window.location.replace(VERIFY_SUCCESS_PATH);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const redirectAfterAuth = useCallback(() => {
    window.location.href = safeRedirect;
  }, [safeRedirect]);

  const signUp = async () => {
    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      showToast({ variant: "error", message: passwordError });
      return;
    }

    const emailRedirectTo =
      typeof window !== "undefined"
        ? getEmailVerificationRedirectUrl(window.location.origin)
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });

    if (error) {
      showToast({ variant: "error", message: error.message });
      return;
    }

    const user = data.user;

    if (user) {
      await fetch("/api/create-profile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
        }),
      });
      trackProductEvent("signup_completed");
    }

    if (user && !data.session) {
      showToast({
        variant: "success",
        message:
          "Account created. Check your email to verify your account before using recommendations, saved runs, tracking, and Premium.",
      });
      return;
    }

    showToast({
      variant: "success",
      message: "Account created. Redirecting…",
    });
    setTimeout(() => {
      redirectAfterAuth();
    }, 500);
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast({ variant: "error", message: error.message });
    } else {
      showToast({
        variant: "success",
        message: "Signed in. Redirecting…",
      });
      setTimeout(() => {
        redirectAfterAuth();
      }, 500);
    }
  };

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <div className="relative flex items-center justify-center px-6 py-24">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h1 className="text-center text-3xl font-black">
            Welcome to <span className="text-cyan-300">GamePing AI</span>
          </h1>

          <p className="mt-3 text-center text-sm text-white/60">
            Save your game preferences and get smart alerts.
          </p>

          {emailVerified ? (
            <p
              className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-100"
              role="status"
            >
              Email verified. You can now log in.
            </p>
          ) : null}

          <ul className="mt-6 space-y-2 text-sm leading-relaxed text-white/55">
            <li className="flex gap-2">
              <span className="text-cyan-400/90">✓</span>
              <span>Save recommendation runs to your dashboard</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400/90">✓</span>
              <span>Track games and get price alerts</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400/90">✓</span>
              <span>Keep your game discovery organized</span>
            </li>
          </ul>

          <p className="mt-5 text-center">
            <Link
              href="/upgrade"
              className="text-xs font-semibold text-white/45 underline-offset-4 transition hover:text-cyan-300 hover:underline"
            >
              Compare Free vs Premium
            </Link>
          </p>

          <input
            className="mt-8 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-cyan-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-cyan-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="mt-2 text-xs text-white/45">
            Password: at least 8 characters with one letter and one number.
          </p>

          <p className="mt-2 text-right">
            <Link
              href="/reset-password"
              className="text-xs font-semibold text-white/45 underline-offset-4 transition hover:text-cyan-300 hover:underline"
            >
              Forgot password?
            </Link>
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={signIn}
              className="w-full rounded-full bg-cyan-400 py-3 font-bold text-black transition hover:bg-cyan-300"
            >
              Login
            </button>

            <button
              type="button"
              onClick={signUp}
              className="w-full rounded-full border border-white/20 py-3 font-bold transition hover:bg-white/10"
            >
              Sign up
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-cyan-300">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="underline hover:text-cyan-300">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/cookies" className="underline hover:text-cyan-300">
              Cookie Policy
            </Link>
            , and{" "}
            <Link href="/disclaimer" className="underline hover:text-cyan-300">
              Disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-sm text-white/50">
        Loading…
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
