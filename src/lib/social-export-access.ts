/** Client-side gate for social card export (local dev testing / production admin only). */
export function canShowSocialExport(userPlan: string | null | undefined): boolean {
  if (process.env.NODE_ENV === "development") return true
  return userPlan === "admin"
}
