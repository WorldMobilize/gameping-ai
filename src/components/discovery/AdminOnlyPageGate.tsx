"use client";

import { notFound } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type GateStatus = "loading" | "admin" | "denied";

/** Client gate — same profiles.plan === "admin" check as HomeAdminSection. */
export default function AdminOnlyPageGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        setStatus("denied");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (cancelled) return;
      setStatus(profile?.plan === "admin" ? "admin" : "denied");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "denied") notFound();
  }, [status]);

  // While checking access, render nothing (just navbar + page background) so the
  // admin/future pages don't flash an empty glass card. Content appears once ready.
  if (status !== "admin") return null;

  return <>{children}</>;
}
