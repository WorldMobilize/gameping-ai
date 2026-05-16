/** Verified sender for Resend (e.g. `GamePing <alerts@yourdomain.com>`). */
export function isProductionDeploy(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

export function resolveResendFrom(): { from: string } | { error: string } {
  const configured = process.env.RESEND_FROM?.trim();
  if (configured) return { from: configured };
  if (isProductionDeploy()) {
    return {
      error:
        "RESEND_FROM is required in production. Set a verified sender in Resend (e.g. GamePing <alerts@yourdomain.com>).",
    };
  }
  return { from: "GamePing <onboarding@resend.dev>" };
}
