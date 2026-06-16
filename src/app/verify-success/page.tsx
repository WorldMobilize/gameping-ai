import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { homeCyanAccentText } from "@/components/app/app-styles";

function SuccessCheckIcon() {
  return (
    <svg
      className="h-7 w-7 text-cyan-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.2 2.2 4.8-5" />
    </svg>
  );
}

export default function VerifySuccessPage() {
  const accent = homeCyanAccentText(false);

  return (
    <AppPageShell bare>
      <AppSection maxWidth="max-w-md" className="flex min-h-screen items-center justify-center py-12">
        <div
          className="w-full rounded-3xl border border-slate-200/90 bg-white px-10 py-11 text-center shadow-lg shadow-slate-200/50"
          role="status"
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-violet-50 shadow-sm"
            aria-hidden
          >
            <SuccessCheckIcon />
          </div>

          <p className={`mt-6 text-[10px] font-bold uppercase tracking-[0.32em] ${accent}`}>
            GamePing AI
          </p>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 gp-home-display md:text-[1.65rem]">
            Email verified
          </h1>

          <p className="mx-auto mt-4 max-w-[18rem] text-pretty text-sm leading-6 text-slate-600">
            You can close this page and return to GamePing AI to{" "}
            <span className="whitespace-nowrap">log in.</span>
          </p>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
