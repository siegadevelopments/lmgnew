// Validation for pay-in-store bookings (supabase/functions/confirm-booking). No imports, so it is
// unit-tested from src/lib/__tests__/booking-rules.test.ts.

export const MAX_BOOKING_HOURS = 12;
export const MAX_DAYS_AHEAD = 365;
export const MAX_BOOKINGS_PER_DAY = 5;

export type Check = { ok: true } | { ok: false; status: number; error: string };

/** Times come from the browser: they must parse, be in the future and make sense as a slot. */
export function validateSlot(startIso: unknown, endIso: unknown, now: Date): Check {
  const start = new Date(String(startIso ?? ""));
  const end = new Date(String(endIso ?? ""));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { ok: false, status: 400, error: "Please choose a valid time." };
  if (end <= start) return { ok: false, status: 400, error: "The booking must end after it starts." };
  if (start <= now) return { ok: false, status: 400, error: "Please choose a time in the future." };
  if (end.getTime() - start.getTime() > MAX_BOOKING_HOURS * 3600_000) {
    return { ok: false, status: 400, error: "That booking is too long." };
  }
  if (start.getTime() - now.getTime() > MAX_DAYS_AHEAD * 86400_000) {
    return { ok: false, status: 400, error: "Bookings can only be made up to a year ahead." };
  }
  return { ok: true };
}

export interface ServiceRow {
  status: string;
  product_type: string | null;
  vendor_id: string | null;
  vendor_profiles: { is_approved: boolean | null; is_live: boolean | null } | null;
}

/** Only published services from approved, live stores can be booked. */
export function validateService(p: ServiceRow | null): Check {
  if (!p || p.status !== "published" || p.product_type !== "service" || !p.vendor_id) {
    return { ok: false, status: 404, error: "This service isn't available for booking." };
  }
  if (!p.vendor_profiles?.is_approved || p.vendor_profiles?.is_live === false) {
    return { ok: false, status: 404, error: "This service isn't available for booking." };
  }
  return { ok: true };
}

/** Two slots overlap when each starts before the other ends. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

/** Australian mobile/landline-ish: digits, spaces, +, brackets, hyphens; 8 to 15 digits. */
export function cleanPhone(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (!/^[+\d\s()-]+$/.test(s)) return null;
  const digits = s.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? s : null;
}
