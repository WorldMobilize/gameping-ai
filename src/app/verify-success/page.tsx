import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { APP_AUTH_CARD } from "@/components/app/app-styles";

function SuccessCheckIcon() {
  return (
    <svg
      className="h-7 w-7 text-[color:var(--page-accent-text)]"
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
  return (
    <AppPageShell bare hideAmbient>
      {/* Same cinematic background + account (silver) accent as /dashboard and /settings/account. */}
      <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden className="gp-account-bg" />
        <AppSection maxWidth="max-w-md" className="flex min-h-screen items-center justify-center py-12">
          <div className={`w-full text-center ${APP_AUTH_CARD}`} role="status">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] shadow-sm"
              aria-hidden
            >
              <SuccessCheckIcon />
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-[color:var(--page-accent-text)]">
              GamePing AI
            </p>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white gp-home-display md:text-[1.65rem]">
              Email verified
            </h1>

            <p className="mx-auto mt-4 max-w-[18rem] text-pretty text-sm leading-6 text-slate-700 dark:text-slate-300">
              You can close this page and return to GamePing AI to{" "}
              <span className="whitespace-nowrap">log in.</span>
            </p>
          </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
