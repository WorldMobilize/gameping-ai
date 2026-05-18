function SuccessCheckIcon() {
  return (
    <svg
      className="h-7 w-7 text-cyan-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" stroke="currentColor" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 12.5l2.2 2.2 4.8-5"
      />
    </svg>
  );
}

export default function VerifySuccessPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060f] px-6 py-12 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[38%] h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-purple-600/12 blur-[90px]" />
        <div className="absolute -right-12 top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />
      </div>

      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0b14]/80 px-10 py-11 text-center shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_24px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-md"
        role="status"
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 via-[#0f1428] to-purple-600/25 shadow-[0_0_28px_rgba(34,211,238,0.22)]"
          aria-hidden
        >
          <SuccessCheckIcon />
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-300/75">
          GamePing AI
        </p>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-white md:text-[1.65rem]">
          Email verified
        </h1>

        <p className="mx-auto mt-4 max-w-[18rem] text-pretty text-sm leading-6 text-white/62">
          You can close this page and return to GamePing AI to{" "}
          <span className="whitespace-nowrap">log in.</span>
        </p>
      </div>
    </main>
  );
}
