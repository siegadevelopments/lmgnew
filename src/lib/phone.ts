// Phone numbers typed by vendors (store setup, dashboard prompt, settings). Kept deliberately
// loose so Australian mobiles, landlines, 1300/1800 numbers and international numbers all pass,
// but strict enough that the SMS sender (supabase/functions/_shared/booking-rules.ts cleanPhone)
// accepts whatever is saved: only digits, spaces, +, (, ), - and 8 to 15 digits.

/** Trimmed, single-spaced phone number, or null when it isn't a plausible number. */
export function normalisePhone(raw: unknown): string | null {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!s || s.length > 25) return null;
  if (!/^\+?[\d\s()-]+$/.test(s)) return null;
  const digits = s.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? s : null;
}

export const PHONE_HELP = "Enter a phone number we can reach you on, e.g. 0412 345 678 or +61 7 5555 1234.";
