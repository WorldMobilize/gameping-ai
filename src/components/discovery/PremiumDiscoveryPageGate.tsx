"use client";

import { useEffect, useState, type ReactNode } from "react";
import PremiumDiscoveryUpsell from "@/components/discovery/PremiumDiscoveryUpsell";
import { hasPremiumDiscoveryAccess } from "@/lib/discovery/premium-access";
import { supabase } from "@/lib/supabase";

type GateStatus = "loading" | "allowed" | "denied";

/** Client gate — profiles.plan === "premium" or "admin". Denied users see upsell, not 404. */
export default function PremiumDiscoveryPageGate({ children }: { children: ReactNode }) {
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
      setStatus(hasPremiumDiscoveryAccess(profile?.plan) ? "allowed" : "denied");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div
        className="gp-game-skeleton-bar-light mt-12 h-48 animate-pulse rounded-3xl border border-slate-200/90 bg-white motion-reduce:animate-none"
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  if (status === "denied") return <PremiumDiscoveryUpsell />;

  return <>{children}</>;
}
