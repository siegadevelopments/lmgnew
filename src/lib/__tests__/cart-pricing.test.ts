import { describe, it, expect } from "vitest";
import { priceCart, safeRedirectUrl, variantKey, type DbProduct } from "../../../supabase/functions/_shared/cart-pricing";

const product = (over: Partial<DbProduct> = {}): DbProduct => ({
  id: 1, title: "Tonic", slug: "tonic", price: 30, image_url: "https://x/y.jpg",
  stock: 10, status: "published", vendor_id: "v1", variants: null, ...over,
});

describe("priceCart", () => {
  it("uses the database price, ignoring any client-supplied price (regression)", () => {
    const r = priceCart([{ product_id: 1, quantity: 2, price: 0.01, name: "hacked" }], [product()]);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) {
      expect(r.items[0].price).toBe(30);
      expect(r.items[0].name).toBe("Tonic");
    }
  });
  it("uses the variant price and name", () => {
    const p = product({ variants: [{ id: 5, title: "500ml", price: 45, stock: 3 }] });
    const r = priceCart([{ product_id: 1, variant_id: 5, quantity: 1 }], [p]);
    expect(r.ok && r.items[0]).toMatchObject({ price: 45, variant_id: 5, name: "Tonic - 500ml" });
  });
  it("rejects unknown variants, unpublished products, and bad quantities", () => {
    const p = product({ variants: [{ id: 5, price: 45 }] });
    expect(priceCart([{ product_id: 1, variant_id: 9, quantity: 1 }], [p]).ok).toBe(false);
    expect(priceCart([{ product_id: 1, quantity: 1 }], [product({ status: "draft" })]).ok).toBe(false);
    expect(priceCart([{ product_id: 2, quantity: 1 }], [product()]).ok).toBe(false);
    for (const quantity of [0, -1, 1.5, 100, "x"]) {
      expect(priceCart([{ product_id: 1, quantity }], [product()]).ok).toBe(false);
    }
  });
  it("rejects insufficient stock and unavailable variants", () => {
    expect(priceCart([{ product_id: 1, quantity: 11 }], [product()]).ok).toBe(false);
    const p = product({ variants: [{ id: 5, price: 45, available: false }] });
    expect(priceCart([{ product_id: 1, variant_id: 5, quantity: 1 }], [p]).ok).toBe(false);
  });
  it("rejects empty or non-array carts", () => {
    expect(priceCart([], [product()]).ok).toBe(false);
    expect(priceCart(undefined, [product()]).ok).toBe(false);
  });
});

describe("store must be approved and live", () => {
  it("refuses a product from a hidden store (regression: test order bought one)", () => {
    const r = priceCart([{ product_id: 1, quantity: 1 }], [product({ vendor_profiles: { is_approved: true, is_live: false } })]);
    expect(r.ok).toBe(false);
  });
  it("refuses a product from an unapproved store", () => {
    const r = priceCart([{ product_id: 1, quantity: 1 }], [product({ vendor_profiles: { is_approved: false, is_live: true } })]);
    expect(r.ok).toBe(false);
  });
  it("allows an approved, live store", () => {
    const r = priceCart([{ product_id: 1, quantity: 1 }], [product({ vendor_profiles: { is_approved: true, is_live: true } })]);
    expect(r.ok).toBe(true);
  });
});

describe("safeRedirectUrl", () => {
  it("keeps addresses on this site", () => {
    expect(safeRedirectUrl("https://www.lifestylemedicinegateway.com/checkout/success", "/x")).toBe(
      "https://www.lifestylemedicinegateway.com/checkout/success",
    );
    expect(safeRedirectUrl("https://lifestylemedicinegateway.com/products/abc?x=1", "/x")).toBe(
      "https://lifestylemedicinegateway.com/products/abc?x=1",
    );
  });
  it("replaces other sites and junk with the fallback (regression)", () => {
    for (const bad of ["https://evil.example/phish", "https://lifestylemedicinegateway.com.evil.example/", "javascript:alert(1)", "", null]) {
      expect(safeRedirectUrl(bad, "/checkout")).toBe("https://www.lifestylemedicinegateway.com/checkout");
    }
  });
});

describe("variant keys", () => {
  it("keeps a UUID variant id as the key (variant_id can't hold it)", () => {
    const r = priceCart([{ product_id: 1, variant_id: "3f2a9c1e-uuid", quantity: 1 }], [
      product({ variants: [{ id: "3f2a9c1e-uuid", title: "Large", price: 40, stock: "5" }] }),
    ]);
    expect(r.ok && r.items[0]).toMatchObject({ variant_id: null, variant_key: "3f2a9c1e-uuid", price: 40 });
  });
});

// Regression: 54 Founder's Formula products have variants with a sku but no id. The cart sent no
// variant, so checkout charged the base price whichever option was picked (a $200 gift card for $50).
describe("variants without an id (sku fallback)", () => {
  const giftCard = product({
    id: 685, title: "Gift Card", price: 50,
    variants: [
      { sku: "GC50", title: "$50.00", price: "50.00", stock: 100, available: true },
      { sku: "GC200", title: "$200.00", price: "200.00", stock: 100, available: true },
    ],
  });

  it("variantKey prefers id, then sku, else null", () => {
    expect(variantKey({ id: 7, sku: "A" })).toBe("7");
    expect(variantKey({ sku: "A" })).toBe("A");
    expect(variantKey({ id: "", sku: "A" })).toBe("A");
    expect(variantKey({ title: "$200.00" })).toBe("$200.00");
    expect(variantKey({})).toBeNull();
    expect(variantKey(null)).toBeNull();
  });

  it("prices the chosen variant by sku, not the base price", () => {
    const r = priceCart([{ product_id: 685, variant_id: "GC200", quantity: 1 }], [giftCard]);
    expect(r.ok && r.items[0]).toMatchObject({ price: 200, variant_id: null, variant_key: "GC200", name: "Gift Card - $200.00" });
  });

  it("prices a variant that has neither id nor sku by its title (the Gift Card)", () => {
    const gc = product({
      id: 685, title: "Gift Card", price: 50,
      variants: [{ title: "$50.00", price: "50.00" }, { title: "$200.00", price: "200.00" }],
    });
    const r = priceCart([{ product_id: 685, variant_id: "$200.00", quantity: 1 }], [gc]);
    expect(r.ok && r.items[0]).toMatchObject({ price: 200, variant_id: null, variant_key: "$200.00" });
  });

  it("does not store a numeric-looking sku as orders.variant_id", () => {
    const p = product({ variants: [{ sku: "12345", price: 20 }, { sku: "67890", price: 30 }] });
    const r = priceCart([{ product_id: 1, variant_id: "67890", quantity: 1 }], [p]);
    expect(r.ok && r.items[0]).toMatchObject({ price: 30, variant_id: null, variant_key: "67890" });
  });

  it("rejects a multi-variant product sent without a variant instead of charging the base price", () => {
    const r = priceCart([{ product_id: 685, quantity: 1 }], [giftCard]);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/choose an option/i);
  });

  it("still allows a single-variant product without a variant, at the product price", () => {
    const p = product({ price: 120, variants: [{ sku: "FF030_W", title: "Default Title", price: "120.00" }] });
    const r = priceCart([{ product_id: 1, quantity: 1 }], [p]);
    expect(r.ok && r.items[0].price).toBe(120);
  });

  it("matches a single id-less variant by sku and keeps its price", () => {
    const p = product({ price: 120, variants: [{ sku: "FF030_W", title: "Default Title", price: "120.00" }] });
    const r = priceCart([{ product_id: 1, variant_id: "FF030_W", quantity: 1 }], [p]);
    expect(r.ok && r.items[0]).toMatchObject({ price: 120, variant_key: "FF030_W", name: "Tonic" });
  });
});
