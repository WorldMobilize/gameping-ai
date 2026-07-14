/**
 * Single source of truth for the desktop GamePing Companion Windows release.
 *
 * Consumed by the download page (`CompanionDownloadView`) and the public
 * `GET /api/companion/releases/latest` endpoint. Values can be overridden per
 * environment via env vars; the defaults point at the current published
 * installer on Supabase Storage so the download works out of the box.
 *
 *   NEXT_PUBLIC_COMPANION_WINDOWS_URL  installer URL (Supabase Storage public object)
 *   NEXT_PUBLIC_COMPANION_VERSION      e.g. "0.1.2"
 */
export const COMPANION_WINDOWS_URL =
  process.env.NEXT_PUBLIC_COMPANION_WINDOWS_URL?.trim() ||
  "https://ciqaswvazzdapdqxmylo.supabase.co/storage/v1/object/public/releases/companion/windows/GamePing%20Companion_0.1.3_x64_en-US.msi";

export const COMPANION_VERSION =
  process.env.NEXT_PUBLIC_COMPANION_VERSION?.trim() || "0.1.3";
