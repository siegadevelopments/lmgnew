import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { categoryConfig } from "@/lib/category-config";
import { guideConfig } from "@/lib/guide-config";
import { WELLNESS_CATEGORY_OPTIONS, categoriesWithProducts, matchesKeywords, productInCategory } from "@/lib/wellness-categories";

const MIGRATION = path.resolve(
  import.meta.dirname,
  "../../../supabase/migrations/20261021_product_wellness_categories.sql",
);

describe("wellness category list", () => {
  it("matches the database CHECK constraint exactly", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    const block = sql.slice(sql.indexOf("ARRAY["), sql.indexOf("]::TEXT[]"));
    const allowed = [...block.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]).sort();
    expect(allowed).toEqual(Object.keys(categoryConfig).sort());
  });

  it("offers every category in the picker", () => {
    expect(WELLNESS_CATEGORY_OPTIONS.map((o) => o.slug).sort()).toEqual(Object.keys(categoryConfig).sort());
  });

  it("every guide points at a known category", () => {
    for (const g of Object.values(guideConfig)) expect(g.categorySlug in categoryConfig).toBe(true);
  });
});

describe("productInCategory", () => {
  const kws = ["menopause", "hormone"];

  it("uses explicit categories once set", () => {
    expect(productInCategory({ title: "Wild Yam Cream", wellness_categories: ["menopause-support"] }, "menopause-support", kws)).toBe(true);
    expect(productInCategory({ title: "Wild Yam Cream", wellness_categories: ["menopause-support"] }, "gut-health", ["gut"])).toBe(false);
  });

  it("ignores keyword matches when categories are set", () => {
    // Title says menopause, but a reviewer put it elsewhere: the explicit choice wins.
    expect(productInCategory({ title: "Menopause Tea", wellness_categories: ["sleep-recovery"] }, "menopause-support", kws)).toBe(false);
  });

  it("keeps a product reviewed as 'none' off every category page", () => {
    expect(productInCategory({ title: "Hormone-free dishwashing liquid", wellness_categories: [] }, "menopause-support", kws)).toBe(false);
  });

  it("falls back to keywords when not reviewed (null) or not migrated (undefined)", () => {
    expect(productInCategory({ title: "Menopause Tea", wellness_categories: null }, "menopause-support", kws)).toBe(true);
    expect(productInCategory({ title: "Menopause Tea" }, "menopause-support", kws)).toBe(true);
    expect(productInCategory({ title: "Bone Broth", wellness_categories: null }, "menopause-support", kws)).toBe(false);
  });
});

describe("matchesKeywords", () => {
  it("matches title, category or excerpt case-insensitively", () => {
    expect(matchesKeywords({ title: "Menopause Relief", category: null, excerpt: "" }, ["menopause"])).toBe(true);
    expect(matchesKeywords({ title: "Cream", category: "Herbal", excerpt: "For HOT FLASH relief" }, ["hot flash"])).toBe(true);
    expect(matchesKeywords({ title: "Cream", category: "Herbal", excerpt: "Skin care" }, ["menopause"])).toBe(false);
  });
});

describe("categoriesWithProducts", () => {
  it("lists only categories with at least one product, in config order", () => {
    const products = [
      { title: "Kava", wellness_categories: ["stress-management", "sleep-recovery"] },
      { title: "Dishwashing Liquid", wellness_categories: [] },
      { title: "Daily Probiotic", wellness_categories: null }, // unreviewed: keyword fallback
    ];
    const slugs = categoriesWithProducts(products);
    expect(slugs).toEqual(
      Object.keys(categoryConfig).filter((s) => ["stress-management", "sleep-recovery", "gut-health"].includes(s)),
    );
    expect(slugs).not.toContain("heart-health");
  });

  it("returns nothing for no products", () => {
    expect(categoriesWithProducts([])).toEqual([]);
  });
});
