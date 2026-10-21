import { categoryConfig } from "@/lib/category-config";

// Explicit product -> category membership (products.wellness_categories). The allowed slugs are
// the keys of categoryConfig; the database CHECK constraint in
// supabase/migrations/20261021_product_wellness_categories.sql must list the same slugs
// (enforced by src/lib/__tests__/wellness-categories.test.ts).

export const WELLNESS_CATEGORY_OPTIONS = Object.entries(categoryConfig).map(([slug, c]) => ({
  slug,
  name: c.name,
}));

export function matchesKeywords(p: any, keywords: string[]) {
  const searchText = `${p.title} ${p.category || ""} ${p.excerpt || ""}`.toLowerCase();
  return keywords.some((kw) => searchText.includes(kw.toLowerCase()));
}

/**
 * Whether a product belongs on a category page or guide. A product whose categories have been
 * set (including deliberately to none) is matched by them only. A product not yet reviewed
 * (NULL, or the column not migrated yet) falls back to the old keyword matching, so pages don't
 * empty out while the catalogue is being categorised.
 */
export function productInCategory(p: any, categorySlug: string, fallbackKeywords: string[]) {
  if (Array.isArray(p.wellness_categories)) return p.wellness_categories.includes(categorySlug);
  return matchesKeywords(p, fallbackKeywords);
}
