/**
 * Helpers for the /auth/confirm email-link landing page.
 * Pure functions so the redirect/type allow-lists can be unit tested.
 */

export type ConfirmOtpType = "email" | "recovery" | "invite" | "magiclink" | "email_change";

const OTP_TYPES: Record<string, ConfirmOtpType> = {
  email: "email",
  // Older templates / links use "signup"; verifyOtp expects "email" for it.
  signup: "email",
  recovery: "recovery",
  invite: "invite",
  magiclink: "magiclink",
  email_change: "email_change",
};

/** Map the `type` query param to a verifyOtp type, or null if it isn't allowed. */
export function resolveOtpType(raw: string | null | undefined): ConfirmOtpType | null {
  if (!raw) return null;
  return Object.prototype.hasOwnProperty.call(OTP_TYPES, raw) ? OTP_TYPES[raw] : null;
}

/**
 * Only allow same-site relative paths for the post-confirmation redirect
 * (prevents open redirects). Anything else falls back to `fallback`.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (!raw.startsWith("/")) return fallback;
  // "//evil.com" and "/\evil.com" are treated as protocol-relative by browsers.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(raw)) return fallback;
  return raw;
}

/** Build an own-domain /auth/confirm link from a token_hash (e.g. admin-generated recovery links). */
export function buildConfirmLink(origin: string, tokenHash: string, type: ConfirmOtpType): string {
  const params = new URLSearchParams({ token_hash: tokenHash, type });
  return `${origin}/auth/confirm?${params.toString()}`;
}
