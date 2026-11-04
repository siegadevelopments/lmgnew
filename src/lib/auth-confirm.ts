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

export const LAST_PAGE_KEY = "lmg_last_page";
const MAX_RETURN_PATH_LENGTH = 512;

/** Pages that should never be remembered as "the page before registering". */
export function isRememberablePath(path: string): boolean {
  return !/^\/(signup|login|auth)(\/|\?|$)/.test(path);
}

/** A stored/metadata return path, accepted only if it is a short same-site path. Otherwise null. */
export function sanitizeReturnPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > MAX_RETURN_PATH_LENGTH) return null;
  const safe = safeNextPath(raw, "");
  return safe && isRememberablePath(safe) ? safe : null;
}

/**
 * Where to send someone after their signup email is confirmed.
 * - admin (from the profiles table, which users cannot edit) -> /admin
 * - vendor (profile role, or the role they asked for at signup) -> /vendor
 * - otherwise the last page they viewed before registering, then the link's `next`, then "/".
 * `requestedRole` and `returnTo` come from user-editable metadata, so they only ever pick a
 * landing page; they never grant access to anything.
 */
export function resolvePostConfirmPath(input: {
  profileRole?: string | null;
  requestedRole?: unknown;
  returnTo?: unknown;
  next?: string | null;
}): string {
  if (input.profileRole === "admin") return "/admin";
  if (input.profileRole === "vendor" || input.requestedRole === "vendor") return "/vendor";
  return sanitizeReturnPath(input.returnTo) ?? safeNextPath(input.next, "/");
}
