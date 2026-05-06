export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#05060f] px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Contact</h1>

        <div className="mt-10 space-y-6 leading-7 text-white/70">
          <p>
            Need help, want to report an issue, or have a question about your
            data?
          </p>

          <p>
            You can contact GamePing AI at:
          </p>

          <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 font-bold text-cyan-300">
            support@gameping.ai
          </p>

          <p className="text-white/50">
            Replace this email with your real support email before publishing.
          </p>
        </div>
      </div>
    </main>
  );
}