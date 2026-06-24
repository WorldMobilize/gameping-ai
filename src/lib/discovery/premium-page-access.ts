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
 * LIVE: the pages are public. premium/admin get real personalized content,
 * free/anon get a locked preview + upgrade/login CTA (handled in each page). The
 * pages stay noindex (buildNoIndexMetadata) and out of the sitemap because the
 * content is personalized/private. Set PREMIUM_DISCOVERY_PUBLIC back to false to
 * re-gate them to admins only (everyone else 404s) without other changes.
 */

/** Master switch. true = pages reachable by everyone (premium content vs locked preview). */
export const PREMIUM_DISCOVERY_PUBLIC = true;

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
