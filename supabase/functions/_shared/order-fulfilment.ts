// Pure helpers for the Stripe webhook (supabase/functions/stripe-webhook). No imports, so they
// are unit-tested from src/lib/__tests__/order-fulfilment.test.ts.

/** Events after which an order may be created, provided the money has actually arrived. */
export const FULFIL_EVENTS = [
  "checkout.session.completed",
  // Delayed methods (e.g. direct debit) complete the session first and settle days later.
  "checkout.session.async_payment_succeeded",
];

/**
 * Create the order only when Stripe says the session is paid. checkout.session.completed also
 * fires for delayed payment methods with payment_status "unpaid"; those are fulfilled by the
 * later async_payment_succeeded event, and never if the payment fails.
 */
export function shouldFulfil(eventType: string, paymentStatus: string | null | undefined): boolean {
  return FULFIL_EVENTS.includes(eventType) && paymentStatus === "paid";
}

/** Escapes text for HTML email bodies. Customer- and vendor-supplied values must go through it. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Booking times for Australian customers (the platform's market; the server runs in UTC). */
export function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
    timeZoneName: "short",
  });
}

export interface PaidLineItem {
  quantity: number | null;
  amount_total: number; // cents
  product: { name: string; metadata: Record<string, string | undefined> };
}

export function buildOrderItems(orderId: string, lineItems: PaidLineItem[]) {
  return lineItems.map((item) => {
    const m = item.product.metadata;
    return {
      order_id: orderId,
      product_id: parseInt(m.product_id ?? "", 10),
      product_name: item.product.name,
      product_image: m.image || null,
      product_slug: m.slug || null,
      price: item.amount_total / 100 / (item.quantity || 1),
      quantity: item.quantity,
      vendor_id: m.vendor_id || null,
      variant_id: m.variant_id ? parseInt(m.variant_id, 10) : null,
    };
  });
}

/**
 * Splits the order's shipping charge (in cents) across the line items that have a vendor, in
 * proportion to each item's total. Works in whole cents and gives any rounding remainder to the
 * last item, so the shares always add up to exactly the shipping charged.
 */
export function allocateShipping(lineItems: PaidLineItem[], shippingCents: number): number[] {
  const vendorItems = lineItems.filter((i) => i.product.metadata.vendor_id);
  if (shippingCents <= 0 || vendorItems.length === 0) return vendorItems.map(() => 0);
  const total = vendorItems.reduce((sum, i) => sum + Math.max(0, i.amount_total), 0);
  const shares = vendorItems.map((i) =>
    total > 0
      ? Math.floor((shippingCents * Math.max(0, i.amount_total)) / total)
      : Math.floor(shippingCents / vendorItems.length),
  );
  shares[shares.length - 1] += shippingCents - shares.reduce((a, b) => a + b, 0);
  return shares;
}

/**
 * One earnings row per line item with a vendor. Commission (default 10%) applies to the item
 * price only. Vendors pay their own postage, so the shipping the customer paid is passed to
 * them in full (no commission), split by their share of the order (allocateShipping).
 */
export function buildEarnings(
  orderId: string,
  lineItems: PaidLineItem[],
  commissionByVendor: Record<string, number | null | undefined>,
  shippingCents = 0,
) {
  const shipping = allocateShipping(lineItems, shippingCents);
  return lineItems
    .filter((item) => item.product.metadata.vendor_id)
    .map((item, idx) => {
      const vendorId = item.product.metadata.vendor_id as string;
      const rate = commissionByVendor[vendorId] ?? 10;
      // Whole cents throughout, so stored amounts are exact (was 6.890000000000001).
      const feeCents = Math.round((item.amount_total * rate) / 100);
      return {
        vendor_id: vendorId,
        order_id: orderId,
        amount: (item.amount_total - feeCents + shipping[idx]) / 100,
        platform_fee: feeCents / 100,
        status: "pending",
      };
    });
}

export function buildBookings(orderId: string, userId: string | null, lineItems: PaidLineItem[]) {
  return lineItems
    .filter((item) => item.product.metadata.booking_start && item.product.metadata.booking_end)
    .map((item) => {
      const m = item.product.metadata;
      return {
        order_id: orderId,
        product_id: parseInt(m.product_id ?? "", 10),
        customer_id: userId,
        vendor_id: m.vendor_id || null,
        start_time: m.booking_start,
        end_time: m.booking_end,
        status: "confirmed",
      };
    });
}

// ---------------------------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------------------------

export interface EarningsRow {
  vendor_id: string;
  amount: number; // AUD; reversal rows are negative
  platform_fee: number;
}

const cents = (aud: number) => Math.round(aud * 100);

/**
 * Negative earnings rows that reverse a vendor's share of a refund. vendor_earnings only allows
 * the statuses "pending" and "paid", so a refund is an offsetting "pending" row rather than a
 * status change: admin payouts total each vendor's pending rows, so the refund drops out of the
 * next payout, and if the original earnings were already paid out, it is recovered from it.
 *
 * Stripe reports the cumulative amount refunded on the charge; previouslyRefundedCents is what
 * this order has already reversed, so repeated or replayed refund events never double-count.
 * A partial refund reverses each vendor's original earnings (and fee) in proportion; a refund
 * that completes the full amount reverses exactly whatever is still outstanding.
 */
export function computeRefundReversals(
  orderId: string,
  existing: EarningsRow[],
  chargeCents: number,
  refundedCentsTotal: number,
  previouslyRefundedCents: number,
) {
  const delta = refundedCentsTotal - previouslyRefundedCents;
  if (delta <= 0 || chargeCents <= 0) return [];
  const full = refundedCentsTotal >= chargeCents;

  const byVendor = new Map<string, { earned: number; feeEarned: number; net: number; netFee: number }>();
  for (const row of existing) {
    const v = byVendor.get(row.vendor_id) ?? { earned: 0, feeEarned: 0, net: 0, netFee: 0 };
    if (row.amount > 0) v.earned += cents(row.amount);
    if (row.platform_fee > 0) v.feeEarned += cents(row.platform_fee);
    v.net += cents(row.amount);
    v.netFee += cents(row.platform_fee);
    byVendor.set(row.vendor_id, v);
  }

  const rows = [];
  for (const [vendorId, v] of byVendor) {
    const amount = full ? v.net : Math.min(v.net, Math.round((v.earned * delta) / chargeCents));
    const fee = full ? v.netFee : Math.min(v.netFee, Math.round((v.feeEarned * delta) / chargeCents));
    if (amount <= 0 && fee <= 0) continue;
    rows.push({
      vendor_id: vendorId,
      order_id: orderId,
      amount: -Math.max(0, amount) / 100,
      platform_fee: -Math.max(0, fee) / 100,
      status: "pending",
    });
  }
  return rows;
}

/** Order status after a refund: only a full refund changes it, and shipped orders keep theirs. */
export function statusAfterRefund(currentStatus: string, full: boolean) {
  if (!full) return { status: currentStatus, payment_status: "paid" };
  const notYetShipped = currentStatus === "pending" || currentStatus === "confirmed";
  return { status: notYetShipped ? "cancelled" : currentStatus, payment_status: "refunded" };
}
