// Where an order came from (ad, post, email), carried from the landing URL through Stripe
// metadata to orders.attribution. Shared by create-checkout-session (sanitise the browser's
// values) and stripe-webhook (rebuild them from metadata). Self-contained so Deno and Vitest
// can both load it. Unit-tested in src/lib/__tests__/attribution.test.ts.

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "landing_path",
] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

const MAX_LEN = 150;

function clean(value: unknown): string {
  // Printable characters only, trimmed and capped (Stripe metadata values allow 500).
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_LEN);
}

/** Keeps only the known keys with non-empty string values. null when nothing is left. */
export function sanitizeAttribution(input: unknown): Attribution | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v !== "string") continue;
    const c = clean(v);
    if (c) out[key] = c;
  }
  if (out.landing_path && !out.landing_path.startsWith("/")) delete out.landing_path;
  return Object.keys(out).length > 0 ? out : null;
}

/** The attribution keys stored in a Checkout Session's metadata, for orders.attribution. */
export function attributionFromMetadata(metadata: Record<string, string> | null | undefined): Attribution | null {
  return sanitizeAttribution(metadata ?? null);
}
