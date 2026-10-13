// Shipping rule shown on the checkout page. The create-checkout-session Edge Function applies
// the same rule when it builds the Stripe session — keep the two in sync, since Stripe's total
// is what the customer actually pays. All amounts are AUD and GST-inclusive.
export const FREE_SHIPPING_THRESHOLD = 50;
export const FLAT_SHIPPING_FEE = 5.99;

export function calculateShipping(subtotal: number, isBookingsOnly = false): number {
  if (isBookingsOnly || subtotal > FREE_SHIPPING_THRESHOLD) return 0;
  return FLAT_SHIPPING_FEE;
}

// GST component of a GST-inclusive amount (1/11th), for display only.
export function gstIncluded(total: number): number {
  return total / 11;
}
