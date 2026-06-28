/**
 * Branded welcome email. Sent best-effort, once, when a new profile is created
 * (see src/app/api/create-profile). Sending must never block signup.
 */
import {
  EMAIL_BRAND,
  emailButtonHtml,
  escapeEmailHtml,
  renderEmailShell,
} from "@/lib/email/branding";

export const WELCOME_EMAIL_SUBJECT = "Welcome to GamePing AI";

type WelcomeEmailParams = {
  /** Absolute site origin, e.g. https://gamepingai.com (no trailing slash). */
  siteOrigin: string;
};

function normalizeOrigin(siteOrigin: string): string {
  return siteOrigin.replace(/\/$/, "");
}

export function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const c = EMAIL_BRAND.colors;
  const origin = normalizeOrigin(params.siteOrigin);
  const recommendUrl = `${origin}/recommend`;
  const settingsUrl = `${origin}/settings/account`;
  const support = escapeEmailHtml(EMAIL_BRAND.supportEmail);

  const bodyHtml = `
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${c.text};">
                GamePing AI is your personal game-discovery engine. Tell it what you feel like
                playing and it finds games that actually fit your taste — then watches their
                prices so you never overpay.
              </p>
              <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:${c.accentText};">Two quick steps to get the most out of it</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${c.text};">
                <strong style="color:${c.textOnDark};">1. Get your first recommendation.</strong>
                Describe a mood, a favorite game, or a genre — GamePing does the rest.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${c.text};">
                <strong style="color:${c.textOnDark};">2. Import your Steam library.</strong>
                It sharpens every recommendation and unlocks your GamePing taste profile.
              </p>
              <div style="margin:4px 0 8px;">${emailButtonHtml("Get my first recommendation →", recommendUrl)}</div>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${c.muted};">
                Prefer to start with Steam? <a href="${escapeEmailHtml(settingsUrl)}" style="color:${c.accentText};">Import your library</a> from your account settings.
              </p>`;

  const footerHtml = `
              <p style="margin:0 0 8px;">You're receiving this because you created a GamePing AI account.</p>
              <p style="margin:0;">Questions? <a href="mailto:${support}" style="color:${c.accentText};">${support}</a></p>`;

  return renderEmailShell({
    preheader: "Find games that fit your taste — and never overpay.",
    eyebrow: "Welcome aboard",
    heading: "Welcome to GamePing AI",
    bodyHtml,
    footerHtml,
  });
}

export function buildWelcomeEmailText(params: WelcomeEmailParams): string {
  const origin = normalizeOrigin(params.siteOrigin);
  return [
    "Welcome to GamePing AI",
    "",
    "GamePing AI is your personal game-discovery engine. Tell it what you feel",
    "like playing and it finds games that fit your taste — then watches their",
    "prices so you never overpay.",
    "",
    "Two quick steps:",
    `1. Get your first recommendation: ${origin}/recommend`,
    `2. Import your Steam library to sharpen results: ${origin}/settings/account`,
    "",
    `Questions? ${EMAIL_BRAND.supportEmail}`,
    "",
    "— GamePing AI",
  ].join("\n");
}
