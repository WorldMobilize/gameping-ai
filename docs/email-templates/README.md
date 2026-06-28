# GamePing AI — Email Templates

GamePing sends two kinds of email:

| Email | Owner | Where it lives |
| --- | --- | --- |
| Auth (confirm signup, reset password, magic link, email change) | **Supabase** | Supabase dashboard → these HTML files |
| Welcome | App | `src/lib/email/welcome-email.ts` |
| Price-drop alerts | App | `src/lib/tracked-price-alerts.ts` (sent from `src/app/api/cron/route.ts`) |

The app-owned emails share one shell: `src/lib/email/branding.ts`. The auth
templates below are hand-written copies of that same shell because the Supabase
dashboard only accepts plain HTML (it can't import the TypeScript module). If you
change the brand tokens in `branding.ts`, mirror the change here.

## Installing the auth templates in Supabase

Supabase auth emails are **not** in the codebase — they are configured in the
dashboard. To apply the GamePing branding:

1. Open **Supabase → Authentication → Emails → Templates**.
2. For each template, paste the matching file's contents into the **Message body
   (HTML)** field:
   - **Confirm signup** → `confirm-signup.html`
   - **Reset password** → `reset-password.html`
   - **Magic Link** → `magic-link.html`
   - **Change Email Address** → `change-email.html`
3. Leave the Supabase merge variables intact — `{{ .ConfirmationURL }}` is what
   Supabase replaces with the real action link. Do not hard-code URLs.
4. Save each template and send yourself a test from the dashboard.

> The app actively uses **Confirm signup** (`auth.signUp`) and **Reset password**
> (`auth.resetPasswordForEmail`). Magic Link and Change Email are included so the
> whole set stays on-brand if those flows are ever enabled.

## Email-client compatibility notes

- **No background images / gradients.** Gmail strips `background-image` and most
  gradient shorthands. The "cinematic" look is a solid near-black canvas
  (`#05060f`), a soft card (`#0b0d18`), and a thin cyan accent line on the card
  top — all widely supported.
- **Table layout + inline styles only.** No `<style>` blocks, no flexbox/grid.
- **`border-radius`** is used for the rounded/glass feel (supported in Gmail,
  Apple Mail, Outlook mobile; older desktop Outlook squares the corners, which is
  an acceptable graceful degradation).
- Every CTA includes a plain-text fallback link in case the button is stripped.

## Brand tokens (keep in sync with `branding.ts`)

| Token | Value |
| --- | --- |
| Canvas | `#05060f` |
| Card | `#0b0d18` |
| Accent (CTA) | `#22d3ee` |
| Accent text | `#67e8f9` |
| Body text | `#e5e7eb` |
| Support | `support@gamepingai.com` |
