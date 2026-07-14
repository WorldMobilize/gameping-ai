/**
 * The maintenance page, as a self-contained HTML document.
 *
 * Why a string and not a React page: a React page cannot set an HTTP status code in
 * the App Router, and the status is the whole point here. Google treats 503 as "the
 * site is temporarily down, keep what you have indexed and come back"; it treats a
 * redirect to a noindex page as "these pages are gone", and starts dropping them.
 * With a few hundred URLs in the sitemap that is not a risk worth taking to save a
 * component file.
 *
 * So the middleware answers with this markup directly, at 503. That also means the
 * page has no dependencies at all — no Tailwind, no bundle, no data. It still renders
 * when everything else is broken, which is exactly when you need it to.
 *
 * Single source: the middleware and /maintenance both render this. Do not fork it.
 */

export function maintenanceHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>We&rsquo;ll be right back — GamePing AI</title>
<link rel="icon" href="/favicon.ico">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5rem 1.5rem;
    text-align: center;
    background-color: #05060f;
    background-image:
      radial-gradient(900px 600px at 50% -10%, rgba(34, 211, 238, 0.16), transparent 60%),
      radial-gradient(700px 500px at 90% 110%, rgba(139, 92, 246, 0.14), transparent 60%);
    color: #e2e8f0;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 34rem; display: flex; flex-direction: column; align-items: center; }
  .logo { width: 64px; height: 64px; border-radius: 16px; }
  .kicker {
    margin: 2rem 0 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #67e8f9;
  }
  h1 {
    margin: 1rem 0 0;
    font-size: clamp(2.25rem, 6vw, 3rem);
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
  }
  p { margin: 1.25rem 0 0; font-size: 1rem; line-height: 1.75; color: #cbd5e1; }
  .muted { margin-top: 2rem; font-size: 0.875rem; color: #64748b; }
</style>
</head>
<body>
  <main class="wrap">
    <img class="logo" src="/icon.png" alt="GamePing" width="64" height="64">
    <p class="kicker">Maintenance</p>
    <h1>We&rsquo;ll be right back</h1>
    <p>
      GamePing is getting an upgrade. The site is briefly offline while we finish the
      work &mdash; your account, your picks and your tracked prices are all safe.
    </p>
    <p class="muted">Thanks for your patience. Check back shortly.</p>
  </main>
</body>
</html>`;
}

/** Headers that go with it. `Retry-After` is what makes 503 mean "temporary". */
export const MAINTENANCE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "Retry-After": "3600",
} as const;
