"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Footer "Creator program" link — admin-only. The Footer is a server component,
 * so this tiny client child owns the profiles.plan read (the same one the drawer,
 * landing and /upgrade use) and renders nothing for anyone who isn't an admin.
 *
 * The page itself is admin-gated in the middleware (ADMIN_ONLY_PREFIXES); this
 * just keeps the public footer from linking to a route the public gets a 404 on,
 * while still surfacing it for admins. Kept out until the referral programme can
 * actually pay people. Read-only: reads the session, never writes or touches auth.
 */
export default function AdminCreatorFooterLink({ className }: { className?: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
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
      if (!cancelled) setIsAdmin(profile?.plan === "admin");
    }

    void loadAdmin();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadAdmin();
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/creators" className={className}>
      Creator program
    </Link>
  );
}
