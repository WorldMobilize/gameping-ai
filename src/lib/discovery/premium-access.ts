/** Premium Discovery routes — premium or admin plans only (UI gate). */
export function hasPremiumDiscoveryAccess(plan: string | null | undefined): boolean {
  return plan === "premium" || plan === "admin";
}
