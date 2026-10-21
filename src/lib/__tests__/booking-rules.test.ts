import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { validateSlot, validateService, overlaps, cleanPhone, MAX_BOOKINGS_PER_DAY } from "../../../supabase/functions/_shared/booking-rules";

const now = new Date("2026-10-21T00:00:00Z");

describe("validateSlot", () => {
  it("accepts a future slot", () => {
    expect(validateSlot("2026-10-22T00:00:00Z", "2026-10-22T01:00:00Z", now)).toEqual({ ok: true });
  });
  it.each([
    ["not-a-date", "2026-10-22T01:00:00Z"],
    ["2026-10-22T01:00:00Z", "2026-10-22T00:00:00Z"], // ends before it starts
    ["2026-10-20T00:00:00Z", "2026-10-20T01:00:00Z"], // in the past
    ["2026-10-22T00:00:00Z", "2026-10-23T00:00:00Z"], // 24 hours
    ["2027-12-01T00:00:00Z", "2027-12-01T01:00:00Z"], // more than a year ahead
    [undefined, undefined],
  ])("rejects %s to %s", (s, e) => {
    expect(validateSlot(s, e, now).ok).toBe(false);
  });
});

describe("validateService", () => {
  const svc = { status: "published", product_type: "service", vendor_id: "v1", vendor_profiles: { is_approved: true, is_live: true } };
  it("accepts a published service from an approved, live store", () => {
    expect(validateService(svc).ok).toBe(true);
  });
  it.each([
    ["missing", null],
    ["draft", { ...svc, status: "draft" }],
    ["a physical product", { ...svc, product_type: "physical" }],
    ["an unapproved store", { ...svc, vendor_profiles: { is_approved: false, is_live: true } }],
    ["a hidden store", { ...svc, vendor_profiles: { is_approved: true, is_live: false } }],
  ])("rejects %s", (_label, p) => {
    expect(validateService(p as any).ok).toBe(false);
  });
});

describe("overlaps", () => {
  it("detects overlapping and ignores back-to-back slots", () => {
    expect(overlaps("2026-10-22T00:00Z", "2026-10-22T01:00Z", "2026-10-22T00:30Z", "2026-10-22T01:30Z")).toBe(true);
    expect(overlaps("2026-10-22T00:00Z", "2026-10-22T01:00Z", "2026-10-22T01:00Z", "2026-10-22T02:00Z")).toBe(false);
  });
});

describe("cleanPhone", () => {
  it("keeps real numbers and rejects anything else", () => {
    expect(cleanPhone("0400 123 456")).toBe("0400 123 456");
    expect(cleanPhone("+61 (2) 9876-5432")).toBe("+61 (2) 9876-5432");
    expect(cleanPhone("call me <a href=x>")).toBeNull();
    expect(cleanPhone("123")).toBeNull();
    expect(cleanPhone("")).toBeNull();
  });
});

// Regression: the function took recipients and email text from the browser and sent them unescaped.
describe("confirm-booking source", () => {
  const src = readFileSync(path.resolve(import.meta.dirname, "../../../supabase/functions/confirm-booking/index.ts"), "utf8");
  it("does not read recipients, names or vendor from the request body", () => {
    for (const field of ["customer_email", "product_title", "vendor_name", "vendor_id", "payment_method"]) {
      expect(src).not.toMatch(new RegExp(`body\\?\\.${field}`));
    }
    expect(src).toMatch(/const customerEmail = user\.email/);
  });
  it("rate-limits, checks clashes and escapes", () => {
    expect(MAX_BOOKINGS_PER_DAY).toBeLessThanOrEqual(10);
    expect(src).toMatch(/MAX_BOOKINGS_PER_DAY/);
    expect(src).toMatch(/\.neq\("status", "cancelled"\)/);
    expect(src).toMatch(/escapeHtml\(product!\.title\)/);
  });
});
