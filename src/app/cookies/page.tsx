import Navbar from "@/components/Navbar";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Cookie Policy</h1>

          <p className="mt-4 text-sm text-white/55">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              This Cookie Policy explains how GamePing AI uses cookies and similar technologies.
              Cookies help the site work reliably, keep you signed in, and (if enabled) measure
              usage so we can improve the product.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">Essential cookies</h2>
              <p className="mt-3">
                Essential cookies are required for core functionality, including authentication,
                security protections, and session management. Disabling essential cookies may break
                login and other core features.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Authentication/session cookies</h2>
              <p className="mt-3">
                If you sign in, we use session cookies to keep you authenticated and to protect your
                account. These cookies are necessary to provide the dashboard and saved searches.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Analytics cookies (only if enabled)</h2>
              <p className="mt-3">
                Some deployments may enable analytics to understand feature usage and improve
                performance. If analytics is disabled, these cookies are not used.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Third-party services</h2>
              <p className="mt-3">
                Depending on features enabled, third-party services such as Supabase (auth/storage),
                Stripe (payments), and analytics/email providers may set or read cookies as part of
                providing their services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">How to control cookies</h2>
              <p className="mt-3">
                You can control cookies through your browser settings. You can typically delete
                cookies, block third-party cookies, or block cookies altogether. If you block
                essential cookies, parts of GamePing AI may not work correctly.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
              This page is provided for general informational purposes and does not constitute legal
              advice.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}