/**
 * Shared GamePing email branding.
 *
 * Every transactional email (welcome, price alerts, and the Supabase auth
 * templates documented in docs/email-templates) should share these tokens and
 * the email-safe shell below so the inbox feels like the rest of the product.
 *
 * Email-client constraints honored here:
 * - Solid background colors only. Gmail strips CSS background-image and most
 *   gradient shorthands, so the "cinematic" look is a solid near-black canvas
 *   plus a soft card and a thin cyan accent line (no unsupported CSS).
 * - Table-based layout with inline styles (no <style> blocks, no flexbox).
 * - border-radius for the rounded/glass feeling (widely supported incl. Gmail).
 */

export const EMAIL_BRAND = {
  name: "GamePing AI",
  supportEmail: "support@gamepingai.com",
  colors: {
    canvas: "#05060f",
    card: "#0b0d18",
    cardBorder: "rgba(255,255,255,0.08)",
    accent: "#22d3ee",
    accentText: "#67e8f9",
    accentSoft: "#a5f3fc",
    text: "#e5e7eb",
    textOnDark: "#ffffff",
    muted: "rgba(255,255,255,0.45)",
    mutedStrong: "rgba(255,255,255,0.65)",
    ctaText: "#03040a",
  },
  fontStack:
    "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
} as const;

export function escapeEmailHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Cyan "GamePing AI" wordmark, matching the in-app navbar lockup. */
export function emailWordmarkHtml(): string {
  const c = EMAIL_BRAND.colors;
  return `<span style="font-size:18px;font-weight:800;letter-spacing:-0.01em;color:${c.textOnDark};">GamePing <span style="color:${c.accentText};">AI</span></span>`;
}

/** Pill CTA button matching the in-app accent button. */
export function emailButtonHtml(label: string, url: string): string {
  const c = EMAIL_BRAND.colors;
  return `<a href="${escapeEmailHtml(url)}" style="display:inline-block;padding:14px 28px;background:${c.accent};color:${c.ctaText};font-weight:800;font-size:15px;text-decoration:none;border-radius:999px;">${escapeEmailHtml(label)}</a>`;
}

export type EmailShellParams = {
  /** Hidden inbox preview text. */
  preheader?: string;
  /** Small uppercase eyebrow above the heading. Defaults to the brand name. */
  eyebrow?: string;
  heading: string;
  /** Pre-rendered, already-escaped HTML for the main body. */
  bodyHtml: string;
  /** Optional standard footer note lines (already-escaped HTML allowed). */
  footerHtml?: string;
};

/**
 * Renders the full email document with the GamePing card shell.
 * `bodyHtml` and `footerHtml` are inserted verbatim — callers must escape
 * any user-provided values with escapeEmailHtml first.
 */
export function renderEmailShell(params: EmailShellParams): string {
  const c = EMAIL_BRAND.colors;
  const eyebrow = escapeEmailHtml(params.eyebrow ?? EMAIL_BRAND.name);
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeEmailHtml(params.preheader)}</div>`
    : "";
  const footer = params.footerHtml
    ? `
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin-top:20px;">
          <tr>
            <td style="font-size:12px;line-height:1.55;color:${c.muted};font-family:${EMAIL_BRAND.fontStack};">
              ${params.footerHtml}
            </td>
          </tr>
        </table>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:${c.canvas};color:${c.text};font-family:${EMAIL_BRAND.fontStack};">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.canvas};padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${c.card};border:1px solid ${c.cardBorder};border-top:3px solid ${c.accent};border-radius:16px;padding:28px;">
          <tr>
            <td>
              <div style="margin:0 0 18px;">${emailWordmarkHtml()}</div>
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${c.accentText};">${eyebrow}</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${c.textOnDark};">${escapeEmailHtml(params.heading)}</h1>
              ${params.bodyHtml}
            </td>
          </tr>
        </table>${footer}
      </td>
    </tr>
  </table>
</body>
</html>`;
}
