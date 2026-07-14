import { type ReactNode } from "react";

/**
 * TEMPORARILY OPEN FOR UI/UX REVIEW.
 *
 * This was a client-side admin-only PAGE-VISIBILITY gate (profiles.plan ===
 * "admin" → notFound() for everyone else). During the product polish pass every
 * implemented page is made visible to all users so the team can review them as
 * normal users. Re-enable the admin check before public launch.
 *
 * NOTE: this only ever gated which pages RENDER — it never protected a sensitive
 * action, mutation, or API route, so exposing it changes no security boundary.
 */
export default function AdminOnlyPageGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
