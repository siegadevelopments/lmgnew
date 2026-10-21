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
