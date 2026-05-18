export default function VerifySuccessPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#05060f] px-6 py-12 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-600/[0.06] blur-3xl" />
      </div>

      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        role="status"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/70">
          GamePing AI
        </p>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
          Email verified
        </h1>

        <p className="mt-4 text-pretty text-sm leading-6 text-white/60">
          You can close this page and return to GamePing AI to{" "}
          <span className="whitespace-nowrap">log in.</span>
        </p>
      </div>
    </main>
  );
}
