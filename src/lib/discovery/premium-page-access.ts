import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasPremiumDiscoveryAccess } from "@/lib/discovery/premium-access";

/**
 * Server-side access resolver for the personalized premium pages
 *   /weekly-picks · /deals-for-you · /monthly-recap
 *
 * Target access model (per spec):
 *   admin   → full access, can test every state
 *   premium → full access, personalized content
 *   free    → locked preview + upgrade CTA
 *   anon    → locked preview + login/signup CTA
 *
 * BUT these pages are not exposed publicly yet. While PREMIUM_DISCOVERY_PUBLIC is
 * false, only admins can reach the route (everyone else gets a 404 via the page's
 * notFound()), exactly like the previous admin-only gate. All of the premium /
 * free / anon rendering logic is built and ready — flip the flag to go live.
 */

/** Master switch. Set to true to expose these pages to premium + the public preview. */
export const PREMIUM_DISCOVERY_PUBLIC = false;

export type PremiumViewer = "admin" | "premium" | "free" | "anon";

export type PremiumPageAccess = {
  /** Whether the route should render at all (else the page calls notFound()). */
  reachable: boolean;
  /** Resolved viewer category. */
  viewer: PremiumViewer;
  /** Whether this viewer should see personalized content (admin/premium). */
  canViewPersonalized: boolean;
  /** Authenticated user id (null when anonymous). */
  userId: string | null;
};

async function resolveViewer(): Promise<{ viewer: PremiumViewer; userId: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { viewer: "anon", userId: null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = profile?.plan ?? "free";
    if (plan === "admin") return { viewer: "admin", userId: user.id };
    if (hasPremiumDiscoveryAccess(plan)) return { viewer: "premium", userId: user.id };
    return { viewer: "free", userId: user.id };
  } catch {
    return { viewer: "anon", userId: null };
  }
}

export async function resolvePremiumPageAccess(): Promise<PremiumPageAccess> {
  const { viewer, userId } = await resolveViewer();
  const canViewPersonalized = viewer === "admin" || viewer === "premium";

  // Dormant exposure: until the public flag flips, only admins reach the route.
  const reachable = PREMIUM_DISCOVERY_PUBLIC ? true : viewer === "admin";

  return { reachable, viewer, canViewPersonalized, userId };
}
