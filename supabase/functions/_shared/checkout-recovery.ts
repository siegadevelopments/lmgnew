// Abandoned-checkout reminders. Pure helpers shared by create-checkout-session (session settings)
// and stripe-webhook (checkout.session.expired), unit-tested in src/lib/__tests__.
//
// Australian Spam Act: a cart reminder is a commercial email, so it is only sent with consent:
// the shopper ticked the unticked opt-in box at checkout, or is already a newsletter subscriber.
// Every reminder identifies LMG and says how to unsubscribe.

// Self-contained (no sibling imports) so both Deno and the Vitest/tsc setup can load it.
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** How long a Stripe Checkout session stays open before it expires and the reminder can go out. */
export const CHECKOUT_EXPIRY_HOURS = 3;
/** Never send the same address more than one reminder in this window. */
export const REMINDER_COOLDOWN_DAYS = 7;

const SITE_URL = "https://www.lifestylemedicinegateway.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Unix seconds for Stripe's expires_at (Stripe allows 30 minutes to 24 hours). */
export function checkoutExpiresAt(nowMs: number): number {
  return Math.floor(nowMs / 1000) + CHECKOUT_EXPIRY_HOURS * 3600;
}

/** The shopper's email from an expired session, lower-cased, or "" when there isn't a valid one. */
export function sessionEmail(session: {
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  metadata?: Record<string, string> | null;
}): string {
  const raw = session.customer_details?.email || session.customer_email || session.metadata?.email || "";
  const email = String(raw).trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 254 ? email : "";
}

export interface RecoveryFacts {
  paymentStatus: string | null | undefined;
  email: string;
  recoveryUrl: string | null | undefined;
  optedIn: boolean;
  isSubscriber: boolean;
  purchasedSince: boolean;
  remindedRecently: boolean;
}

/** Why no reminder should be sent, or null when it should. */
export function recoverySkipReason(f: RecoveryFacts): string | null {
  if (f.paymentStatus === "paid") return "paid";
  if (!f.email) return "no email";
  if (!f.recoveryUrl) return "no recovery link";
  if (!f.optedIn && !f.isSubscriber) return "no consent";
  if (f.purchasedSince) return "already purchased";
  if (f.remindedRecently) return "reminded recently";
  return null;
}

export interface RecoveryItem {
  name: string;
  quantity: number;
  amountCents: number;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function recoveryEmail(opts: { firstName?: string | null; items: RecoveryItem[]; totalCents: number; recoveryUrl: string }) {
  const name = String(opts.firstName ?? "").trim();
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const rows = opts.items
    .slice(0, 10)
    .map(
      (i) =>
        `<tr><td style="padding: 6px 0;">${escapeHtml(i.name)} × ${Math.max(1, Math.floor(i.quantity))}</td><td style="padding: 6px 0; text-align: right;">${money(i.amountCents)}</td></tr>`,
    )
    .join("");
  const subject = "You left something in your cart";
  const html = `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
    <h1 style="color: #10b981; font-size: 22px;">Still thinking it over?</h1>
    <p>${greeting}</p>
    <p>You didn't quite finish checking out on Lifestyle Medicine Gateway. We've saved your cart, so you can pick up where you left off.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">${rows}
      <tr><td style="padding: 8px 0; font-weight: bold;">Total</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${money(opts.totalCents)}</td></tr>
    </table>
    <p style="margin: 24px 0;">
      <a href="${escapeHtml(opts.recoveryUrl)}" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Return to your cart</a>
    </p>
    <p style="font-size: 13px; color: #64748b;">Shipping is free on orders over $50, and Afterpay is available at checkout. Prices and stock can change, so we can't hold items for you.</p>
    <p style="font-size: 12px; color: #64748b;">You're receiving this because you agreed to emails from Lifestyle Medicine Gateway (<a href="${SITE_URL}" style="color: #64748b;">lifestylemedicinegateway.com</a>). To unsubscribe, reply to this email with "unsubscribe" and we'll remove you.</p>
  </div>`;
  return { subject, html };
}
