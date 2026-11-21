import { describe, expect, it } from "vitest";
import { CATEGORY_MATCH_COLUMNS, LISTING_COLUMNS, slimListingProduct, variantCount } from "../product-listing";

const full = {
  id: 1,
  title: "Tea",
  price: 10,
  variants: [
    { id: "a", title: "50g", price: "63.00", sku: "X", option1: "50g", stock: 100, source_ref: "r", available: true },
    { id: "b", title: "20g", price: "39.95", sku: "X-2", option1: "20g", stock: 100, available: true },
  ],
};

describe("product listing payload", () => {
  it("keeps only the first variant's id/title/price and records the real count", () => {
    const slim = slimListingProduct(full);
    expect(slim.variants).toEqual([{ id: "a", sku: "X", title: "50g", price: "63.00" }]);
    expect(slim.variant_count).toBe(2);
    expect(slim.title).toBe("Tea");
  });

  it("handles products with no variants", () => {
    expect(slimListingProduct({ id: 2, variants: null })).toMatchObject({ variants: [], variant_count: 0 });
    expect(slimListingProduct({ id: 3 })).toMatchObject({ variants: [], variant_count: 0 });
  });

  it("variantCount prefers variant_count and falls back to variants.length", () => {
    expect(variantCount(slimListingProduct(full))).toBe(2);
    expect(variantCount({ variants: [{}, {}, {}] })).toBe(3);
    expect(variantCount({})).toBe(0);
  });

  it("does not select excerpt in the listing query", () => {
    expect(LISTING_COLUMNS).not.toMatch(/excerpt/);
  });

  it("category/menu query selects named columns, never *, and keeps what matching and cards read", () => {
    expect(CATEGORY_MATCH_COLUMNS).not.toMatch(/(^|[\s,(])\*/);
    for (const col of ["title", "category", "excerpt", "wellness_categories", "variants", "image_url", "price", "slug"]) {
      expect(CATEGORY_MATCH_COLUMNS).toContain(col);
    }
    expect(CATEGORY_MATCH_COLUMNS).not.toMatch(/\bdescription\b|\bcontent\b/);
  });
});
