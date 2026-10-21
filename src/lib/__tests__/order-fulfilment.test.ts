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
