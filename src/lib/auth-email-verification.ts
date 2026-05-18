import type { User } from "@supabase/supabase-js";

export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Please verify your email before using GamePing AI.";

/** Client-safe: Supabase sets this when the user confirms their email. */
export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}

const PASSWORD_MIN_LENGTH = 8;

export function validateSignupPassword(password: string): string | null {
  const value = password.trim();
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]/.test(value)) {
    return "Password must include at least one letter.";
  }
  if (!/[0-9]/.test(value)) {
    return "Password must include at least one number.";
  }
  return null;
}
