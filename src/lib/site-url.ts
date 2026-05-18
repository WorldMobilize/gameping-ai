/** Public site origin for Stripe return URLs and outbound links. */
export function getSiteOrigin(requestOrigin?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const fromRequest = requestOrigin?.trim().replace(/\/$/, "");
  if (fromRequest) return fromRequest;

  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
