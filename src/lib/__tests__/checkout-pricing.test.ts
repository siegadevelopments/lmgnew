import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  calculateShipping,
  gstIncluded,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_FEE,
  FREE_SHIPPING_TEXT,
} from "../checkout-pricing";

describe("calculateShipping", () => {
  it("charges flat fee at or under the threshold", () => {
    expect(calculateShipping(20)).toBe(5.99);
    expect(calculateShipping(50)).toBe(5.99);
  });
  it("is free over the threshold", () => {
    expect(calculateShipping(50.01)).toBe(0);
  });
  it("is free for bookings-only carts", () => {
    expect(calculateShipping(20, true)).toBe(0);
  });
});

describe("gstIncluded", () => {
  it("returns one eleventh", () => {
    expect(gstIncluded(110)).toBeCloseTo(10);
  });
});

// Regression: the announcement bar and product page promised free shipping over $100 while
// checkout charged $5.99 up to $50, and the support chat promised express shipping that didn't
// exist. Customer-facing copy now comes from these constants; the Edge Function (which sets what
// Stripe charges) must use the same numbers.
describe("shipping rule stays consistent", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const read = (f: string) => readFileSync(path.join(root, f), "utf8");

  it("the checkout Edge Function charges the same rule as the site shows", () => {
    const fn = read("supabase/functions/create-checkout-session/index.ts");
    const m = fn.match(/subtotal > (\d+(?:\.\d+)?) \? 0 : (\d+(?:\.\d+)?)/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBe(FREE_SHIPPING_THRESHOLD);
    expect(Number(m![2])).toBe(FLAT_SHIPPING_FEE);
  });

  it("customer-facing copy uses the shared wording", () => {
    expect(FREE_SHIPPING_TEXT).toBe(`Free shipping on orders over $${FREE_SHIPPING_THRESHOLD}`);
    expect(read("src/components/AnnouncementBar.tsx")).toContain("{FREE_SHIPPING_TEXT}");
    expect(read("app/products/[slug]/page.tsx")).toContain("Over ${FREE_SHIPPING_THRESHOLD}");
    const chat = read("src/components/chat/GlobalChat.tsx");
    expect(chat).toContain("${SHIPPING_RULE_TEXT}");
    expect(chat).not.toMatch(/Express Shipping/i);
  });
});

describe("vendor-facing shipping copy", () => {
  it("tells vendors they receive the shipping fee, using the shared amounts", () => {
    const page = readFileSync(path.resolve(import.meta.dirname, "../../../app/sell-with-us/page.tsx"), "utf8");
    expect(page).toContain("the shipping fee customers pay goes to you in full");
    expect(page).toContain("${FLAT_SHIPPING_FEE.toFixed(2)}");
    expect(page).toContain("${FREE_SHIPPING_THRESHOLD}");
  });
});
