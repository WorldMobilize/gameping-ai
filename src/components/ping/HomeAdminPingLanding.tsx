"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Admin-only landing slot — visual prototype disabled; non-admins render nothing. */
export default function HomeAdminPingLanding() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", data.user.id)
        .maybeSingle();

      setIsAdmin(profile?.plan === "admin");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isAdmin !== true) return null;

  return (
    <div className="gp-ping-landing gp-ping-landing-disabled">
      <p className="gp-ping-prototype-disabled">PING prototype disabled</p>
    </div>
  );
}
