import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin-only page visibility.
 *
 * This had been emptied out to a pass-through during the UI review pass, with a note
 * to re-enable it before launch. It never was — so /companion, /companion/web,
 * /community-wars and /parties were reachable by anyone with the URL, while their own
 * copy still told the reader that non-admins get a 404. This restores it.
 *
 * SERVER-side, and that is the point. The old gate ran in the browser, which means
 * the page's HTML was still sent to everyone and merely hidden after the fact — the
 * content was one "view source" away. Here the check happens before anything is
 * rendered, and a non-admin gets a real 404 with no payload at all.
 *
 * It still only gates VISIBILITY. It is not a security boundary for actions: the API
 * routes behind these pages do their own checks, and must keep doing them.
 *
 * Any failure — no session, no profile, Supabase unreachable — is treated as "not an
 * admin". The safe default for a page that is not ready to be seen is to stay hidden.
 */
export default async function AdminOnlyPageGate({ children }: { children: ReactNode }) {
  let isAdmin = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      isAdmin = profile?.plan === "admin";
    }
  } catch {
    isAdmin = false;
  }

  if (!isAdmin) notFound();

  return <>{children}</>;
}
