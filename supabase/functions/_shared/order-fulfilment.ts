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

/** One earnings row per line item with a vendor; commission defaults to 10%. */
export function buildEarnings(
  orderId: string,
  lineItems: PaidLineItem[],
  commissionByVendor: Record<string, number | null | undefined>,
) {
  return lineItems
    .filter((item) => item.product.metadata.vendor_id)
    .map((item) => {
      const vendorId = item.product.metadata.vendor_id as string;
      const rate = commissionByVendor[vendorId] ?? 10;
      const itemTotal = item.amount_total / 100;
      const platformFee = itemTotal * (rate / 100);
      return { vendor_id: vendorId, order_id: orderId, amount: itemTotal - platformFee, platform_fee: platformFee, status: "pending" };
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
