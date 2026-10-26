// Remembers where a visitor came from (UTM tags, Meta/Google click ids) so the order can be
// credited to the ad, post or email that brought them. Last click wins, kept for 30 days in
// this browser only. Checkout sends it to create-checkout-session; the webhook stores it on the
// order (orders.attribution). See supabase/functions/_shared/attribution.ts.

import { ATTRIBUTION_KEYS, sanitizeAttribution, type Attribution } from "../../supabase/functions/_shared/attribution";

const STORAGE_KEY = "lmg_attribution";
export const ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Attribution in a landing URL's query string, or null when it carries none. */
export function attributionFromUrl(search: string, pathname: string): Attribution | null {
  const params = new URLSearchParams(search);
  const raw: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = params.get(key);
    if (v) raw[key] = v;
  }
  if (Object.keys(raw).length === 0) return null;
  raw.landing_path = pathname;
  return sanitizeAttribution(raw);
}

/** Saves the current URL's attribution, if it has any (a new click replaces the old one). */
export function captureAttribution(now = Date.now()): void {
  try {
    const attr = attributionFromUrl(window.location.search, window.location.pathname);
    if (attr) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...attr, captured_at: now }));
  } catch {
    // storage blocked: the order just won't be attributed
  }
}

/** The saved attribution if it's under 30 days old, for sending with checkout. */
export function getAttribution(now = Date.now()): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.captured_at !== "number" || now - parsed.captured_at > ATTRIBUTION_MAX_AGE_MS) return null;
    return sanitizeAttribution(parsed);
  } catch {
    return null;
  }
}
