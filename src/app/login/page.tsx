"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
    }

    showToast({
      variant: "success",
      message: "Account created. Redirecting…",
    });
    setTimeout(() => {
      window.location.href = "/";
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
        window.location.href = "/";
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
          <h1 className="text-3xl font-black text-center">
            Welcome to <span className="text-cyan-300">GamePing AI</span>
          </h1>

          <p className="mt-3 text-center text-white/60 text-sm">
            Save your game preferences and get smart alerts.
          </p>

          <input
            className="mt-8 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="mt-4 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={signIn}
              className="w-full rounded-full bg-cyan-400 py-3 font-bold text-black hover:bg-cyan-300 transition"
            >
              Login
            </button>

            <button
              onClick={signUp}
              className="w-full rounded-full border border-white/20 py-3 font-bold hover:bg-white/10 transition"
            >
              Sign up
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            By continuing you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-cyan-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}