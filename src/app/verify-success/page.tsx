import Navbar from "@/components/Navbar";

export default function VerifySuccessPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <div className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-6 py-16">
        <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-16 right-10 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

        <div
          className="relative z-10 w-full max-w-md rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-10 text-center shadow-[0_0_48px_rgba(52,211,153,0.12)] backdrop-blur-xl"
          role="status"
        >
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300/90">
            GamePing AI
          </p>

          <h1 className="mt-5 text-2xl font-black leading-tight text-white md:text-3xl">
            Email verified successfully.
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-white/65">
            You can close this page and return to GamePing AI to log in.
          </p>
        </div>
      </div>
    </main>
  );
}
