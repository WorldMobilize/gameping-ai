import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";

export default function NotFound() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-xl" className="py-20 md:py-28">
        <div className="text-center md:text-left">
          <p className={APP_KICKER}>404</p>
          <h1 className={APP_PAGE_TITLE}>Page not found</h1>
          <p className={APP_PAGE_LEAD}>
            That URL doesn&apos;t match anything on GamePing AI. You might have followed an old
            link—here are a few useful places to go instead.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <Link href="/" className={APP_PRIMARY_CTA_SM}>
              Back home
            </Link>
            <Link href="/recommend" className={APP_SECONDARY_CTA}>
              Try AI recommendations
            </Link>
            <Link href="/games" className={APP_SECONDARY_CTA}>
              Browse games
            </Link>
          </div>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
