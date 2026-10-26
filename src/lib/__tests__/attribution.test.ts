import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { attributionFromMetadata, sanitizeAttribution } from "../../../supabase/functions/_shared/attribution";
import { attributionFromUrl, ATTRIBUTION_MAX_AGE_MS, getAttribution } from "../attribution";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("attributionFromUrl", () => {
  it("reads UTM tags and click ids from a Meta ad link", () => {
    const attr = attributionFromUrl(
      "?utm_source=facebook&utm_medium=paid&utm_campaign=Nov%20Founder%27s%20Formula&utm_content=1202&fbclid=IwAR1",
      "/products/founders-formula-gift-box",
    );
    expect(attr).toEqual({
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "Nov Founder's Formula",
      utm_content: "1202",
      fbclid: "IwAR1",
      landing_path: "/products/founders-formula-gift-box",
    });
  });

  it("returns null for a URL without attribution", () => {
    expect(attributionFromUrl("?colour=green", "/products")).toBeNull();
    expect(attributionFromUrl("", "/")).toBeNull();
  });
});

describe("sanitizeAttribution", () => {
  it("keeps only known string keys, strips control characters and caps length", () => {
    const attr = sanitizeAttribution({
      utm_source: "face\nbook",
      user_id: "spoofed",
      email: "x@y.z",
      utm_term: 42,
      utm_campaign: "x".repeat(400),
    });
    expect(attr).toEqual({ utm_source: "facebook", utm_campaign: "x".repeat(150) });
  });

  it("rejects non-objects and a landing path that isn't site-relative", () => {
    expect(sanitizeAttribution("utm_source=facebook")).toBeNull();
    expect(sanitizeAttribution(["a"])).toBeNull();
    expect(sanitizeAttribution({ landing_path: "https://evil.example" })).toBeNull();
  });

  it("rebuilds attribution from Stripe metadata, ignoring the order fields", () => {
    expect(attributionFromMetadata({ user_id: "u1", email: "a@b.co", utm_source: "instagram" })).toEqual({ utm_source: "instagram" });
    expect(attributionFromMetadata({ user_id: "u1" })).toBeNull();
    expect(attributionFromMetadata(undefined)).toBeNull();
  });
});

describe("getAttribution", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  it("returns saved attribution under 30 days old, and nothing after", () => {
    const now = Date.UTC(2026, 10, 10);
    store.set("lmg_attribution", JSON.stringify({ utm_source: "facebook", captured_at: now - 1000 }));
    expect(getAttribution(now)).toEqual({ utm_source: "facebook" });
    expect(getAttribution(now + ATTRIBUTION_MAX_AGE_MS)).toBeNull();
  });

  it("survives corrupt storage", () => {
    store.set("lmg_attribution", "{not json");
    expect(getAttribution()).toBeNull();
  });
});

describe("wiring", () => {
  it("checkout sends attribution and the function sanitises it into metadata", () => {
    expect(read("app/checkout/page.tsx")).toMatch(/attribution: getAttribution\(\)/);
    const fn = read("supabase/functions/create-checkout-session/index.ts");
    expect(fn).toMatch(/const attr = sanitizeAttribution\(attribution\) \?\? \{\};/);
    // Spread first so the order's own metadata (user_id, email...) can never be overwritten.
    expect(fn).toMatch(/metadata: \{\n\s+\.\.\.attr,\n/);
    expect(fn.indexOf("...attr,")).toBeLessThan(fn.indexOf('user_id: user?.id'));
  });

  it("the webhook stores attribution and still saves the order if the column is missing", () => {
    const wh = read("supabase/functions/stripe-webhook/index.ts");
    expect(wh).toMatch(/attribution: attributionFromMetadata\(session\.metadata\)/);
    expect(wh).toMatch(/order saved without attribution/);
  });

  it("every page records attribution", () => {
    expect(read("src/components/ClientOnlyOverlays.tsx")).toMatch(/<AttributionCapture \/>/);
  });
});
