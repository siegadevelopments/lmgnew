import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  shouldFulfil,
  escapeHtml,
  formatBookingDate,
  buildOrderItems,
  buildEarnings,
  buildBookings,
  allocateShipping,
  computeRefundReversals,
  statusAfterRefund,
  orderConfirmationEmail,
  refundEmail,
  type PaidLineItem,
} from "../../../supabase/functions/_shared/order-fulfilment";

const item = (meta: Record<string, string>, over: Partial<PaidLineItem> = {}): PaidLineItem => ({
  quantity: 2,
  amount_total: 6000,
  product: { name: "Tonic", metadata: { product_id: "7", vendor_id: "v1", slug: "tonic", image: "https://x/y.jpg", ...meta } },
  ...over,
});

describe("shouldFulfil", () => {
  it("fulfils a paid completed session", () => {
    expect(shouldFulfil("checkout.session.completed", "paid")).toBe(true);
  });

  it("does not fulfil a delayed payment that hasn't settled (regression: was marked paid)", () => {
    expect(shouldFulfil("checkout.session.completed", "unpaid")).toBe(false);
  });

  it("fulfils a delayed payment once it settles", () => {
    expect(shouldFulfil("checkout.session.async_payment_succeeded", "paid")).toBe(true);
  });

  it("ignores failed payments and unrelated events", () => {
    expect(shouldFulfil("checkout.session.async_payment_failed", "unpaid")).toBe(false);
    expect(shouldFulfil("payment_intent.succeeded", "paid")).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("neutralises markup from customer-supplied fields (regression)", () => {
    expect(escapeHtml('<a href="https://evil.example">Pay here</a>')).toBe(
      "&lt;a href=&quot;https://evil.example&quot;&gt;Pay here&lt;/a&gt;",
    );
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml("O'Brien & Co")).toBe("O&#39;Brien &amp; Co");
  });
});

describe("formatBookingDate", () => {
  it("shows Australian date order in Sydney time, not UTC", () => {
    const s = formatBookingDate("2026-11-03T23:30:00Z"); // 10:30 am AEDT on 4 Nov
    expect(s).toMatch(/4 November 2026/);
    expect(s).toMatch(/10:30/);
  });
});

describe("row builders", () => {
  it("builds order items with per-unit price", () => {
    const [row] = buildOrderItems("o1", [item({ variant_id: "3" })]);
    expect(row).toMatchObject({ order_id: "o1", product_id: 7, price: 30, quantity: 2, vendor_id: "v1", variant_id: 3 });
  });

  it("splits earnings by vendor commission, defaulting to 10%", () => {
    const [a, b] = buildEarnings("o1", [item({}), item({ vendor_id: "v2" })], { v1: 20 });
    expect(a).toMatchObject({ vendor_id: "v1", amount: 48, platform_fee: 12 });
    expect(b).toMatchObject({ vendor_id: "v2", amount: 54, platform_fee: 6 });
  });

  it("passes shipping to vendors in full, split by their share of the order", () => {
    // $40 + $20 of goods, $5.99 shipping: vendor 1 gets 2/3, vendor 2 gets 1/3, no commission.
    const [a, b] = buildEarnings("o1", [item({}, { amount_total: 4000 }), item({ vendor_id: "v2" }, { amount_total: 2000 })], {}, 599);
    expect(a.platform_fee).toBeCloseTo(4);
    expect(b.platform_fee).toBeCloseTo(2);
    expect(a.amount).toBeCloseTo(36 + 3.99);
    expect(b.amount).toBeCloseTo(18 + 2.0);
  });

  it("leaves earnings unchanged when there is no shipping", () => {
    const [a] = buildEarnings("o1", [item({})], {}, 0);
    expect(a.amount).toBeCloseTo(54);
  });

  it("splits shipping in whole cents that add up exactly", () => {
    const three = [item({}, { amount_total: 1000 }), item({ vendor_id: "v2" }, { amount_total: 1000 }), item({ vendor_id: "v3" }, { amount_total: 1000 })];
    const shares = allocateShipping(three, 599);
    expect(shares.reduce((x, y) => x + y, 0)).toBe(599);
    expect(shares.every((c) => Number.isInteger(c))).toBe(true);
    expect(shares).toEqual([199, 199, 201]);
  });

  it("gives no shipping to items without a vendor", () => {
    const shares = allocateShipping([item({ vendor_id: "" }), item({})], 599);
    expect(shares).toEqual([599]);
  });

  it("creates bookings only for booked items", () => {
    const rows = buildBookings("o1", "u1", [
      item({}),
      item({ booking_start: "2026-11-04T00:00:00Z", booking_end: "2026-11-04T01:00:00Z" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ order_id: "o1", customer_id: "u1", vendor_id: "v1", status: "confirmed" });
  });
});

// Regression: the webhook used the synchronous constructEvent, which always throws in Deno.
describe("stripe-webhook source", () => {
  const src = readFileSync(path.resolve(import.meta.dirname, "../../../supabase/functions/stripe-webhook/index.ts"), "utf8");

  it("verifies signatures with the async API and SubtleCrypto provider", () => {
    expect(src).toMatch(/constructEventAsync\(/);
    expect(src).toMatch(/createSubtleCryptoProvider\(\)/);
    expect(src).not.toMatch(/stripe\.webhooks\.constructEvent\(/);
  });

  it("returns 500 on processing failures so Stripe retries", () => {
    expect(src).toMatch(/status: 500/);
  });
});

// Regression: the webhook selected vendor_profiles.representative_email, which doesn't exist, so
// the query failed and the first real order stopped before vendor earnings were written (and the
// old webhook silently never sent vendor emails). Columns it reads must exist on the table.
describe("stripe-webhook reads only real vendor_profiles columns", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const src = readFileSync(path.join(root, "supabase/functions/stripe-webhook/index.ts"), "utf8");
  const types = readFileSync(path.join(root, "src/integrations/supabase/types.ts"), "utf8");
  const row = types.slice(types.indexOf("vendor_profiles: {"), types.indexOf("Insert:", types.indexOf("vendor_profiles: {")));

  it("selects only columns present in the vendor_profiles type", () => {
    const m = src.match(/from\("vendor_profiles"\)\s*\.select\("([^"]+)"\)/);
    expect(m).not.toBeNull();
    for (const col of m![1].split(",").map((c) => c.trim())) {
      expect(row, `vendor_profiles.${col}`).toMatch(new RegExp(`\\b${col}:`));
    }
  });

  it("gets the vendor's email from their auth account", () => {
    expect(src).toMatch(/auth\.admin\.getUserById\(vendorId\)/);
    expect(src).not.toMatch(/\?\.representative_email/); // code, not the explanatory comment
  });
});

describe("earnings are whole cents", () => {
  it("stores exact amounts (regression: 6.890000000000001)", () => {
    const [row] = buildEarnings("o1", [item({}, { amount_total: 100, quantity: 1 })], {}, 599);
    expect(row.amount).toBe(6.89);
    expect(row.platform_fee).toBe(0.1);
  });
});

describe("computeRefundReversals", () => {
  // Test order: $1 product + $5.99 shipping, 10% → vendor 6.89, platform 0.10, charge 699c.
  const earned = [{ vendor_id: "v1", amount: 6.89, platform_fee: 0.1 }];

  it("reverses everything on a full refund", () => {
    const rows = computeRefundReversals("o1", earned, 699, 699, 0);
    expect(rows).toEqual([{ vendor_id: "v1", order_id: "o1", amount: -6.89, platform_fee: -0.1, status: "pending" }]);
  });

  it("reverses in proportion on a partial refund", () => {
    const two = [{ vendor_id: "v1", amount: 40, platform_fee: 4 }, { vendor_id: "v2", amount: 20, platform_fee: 2 }];
    const rows = computeRefundReversals("o1", two, 6600, 3300, 0); // half refunded
    expect(rows.map((r) => [r.vendor_id, r.amount, r.platform_fee])).toEqual([["v1", -20, -2], ["v2", -10, -1]]);
  });

  it("never double-counts a replayed event", () => {
    expect(computeRefundReversals("o1", earned, 699, 699, 699)).toEqual([]);
  });

  it("a later refund completing the total reverses exactly what is left", () => {
    const first = computeRefundReversals("o1", earned, 699, 233, 0);
    const after = [...earned, ...first.map((r) => ({ vendor_id: r.vendor_id, amount: r.amount, platform_fee: r.platform_fee }))];
    const second = computeRefundReversals("o1", after, 699, 699, 233);
    const net = after.reduce((s, r) => s + Math.round(r.amount * 100), 0) + Math.round(second[0].amount * 100);
    expect(net).toBe(0);
  });

  it("only uses statuses the table allows", () => {
    for (const r of computeRefundReversals("o1", earned, 699, 699, 0)) expect(["pending", "paid"]).toContain(r.status);
  });
});

describe("statusAfterRefund", () => {
  it("cancels an unshipped order on a full refund", () => {
    expect(statusAfterRefund("confirmed", true)).toEqual({ status: "cancelled", payment_status: "refunded" });
  });
  it("keeps a shipped order's status, marks it refunded", () => {
    expect(statusAfterRefund("delivered", true)).toEqual({ status: "delivered", payment_status: "refunded" });
  });
  it("leaves a partially refunded order paid", () => {
    expect(statusAfterRefund("confirmed", false)).toEqual({ status: "confirmed", payment_status: "paid" });
  });
});

describe("customer emails", () => {
  const base = {
    reference: "LMG-495E4D57",
    firstName: "Ernest",
    items: [item({}, { amount_total: 100, quantity: 1 })],
    subtotalCents: 100,
    shippingCents: 599,
    totalCents: 699,
    address: { line: "1 Test St", city: "Brisbane", state: "QLD", zip: "4000" },
    hasAccount: true,
  };

  it("confirms the order with reference, items, shipping, total and address", () => {
    const { subject, html } = orderConfirmationEmail(base);
    expect(subject).toBe("Order confirmed: LMG-495E4D57");
    for (const text of ["Hi Ernest,", "Tonic", "Subtotal: $1.00", "Shipping: $5.99", "Total paid: $6.99 AUD", "1 Test St", "My Account"]) {
      expect(html).toContain(text);
    }
  });

  it("escapes customer and product text", () => {
    const { html } = orderConfirmationEmail({
      ...base,
      firstName: "<b>x</b>",
      items: [item({}, { product: { name: "<script>alert(1)</script>", metadata: { vendor_id: "v1" } } } as any)],
      address: { line: '<a href="https://evil.example">x</a>', city: "", state: "", zip: "" },
    });
    expect(html).not.toMatch(/<script>|<b>x<\/b>|href="https:\/\/evil/);
  });

  it("shows free shipping and booking times, and no delivery address for a bookings-only order", () => {
    const booking = item({ booking_start: "2026-11-03T23:30:00Z", booking_end: "2026-11-04T00:30:00Z" }, { amount_total: 8000, quantity: 1 });
    const { html } = orderConfirmationEmail({ ...base, items: [booking], shippingCents: 0, subtotalCents: 8000, totalCents: 8000 });
    expect(html).toContain("Shipping: Free");
    expect(html).toMatch(/Booking: .*4 November 2026/);
    expect(html).not.toContain("Delivery address");
  });

  it("tells guests to keep the email instead of pointing to an account", () => {
    const { html } = orderConfirmationEmail({ ...base, hasAccount: false });
    expect(html).not.toContain("My Account");
    expect(html).toContain("Keep this email");
  });

  it("confirms full and partial refunds", () => {
    expect(refundEmail({ reference: "LMG-1", firstName: "", refundedCents: 699, full: true }).html).toContain("$6.99 AUD");
    expect(refundEmail({ reference: "LMG-1", firstName: "", refundedCents: 300, full: false }).html).toContain("partial refund");
  });
});
