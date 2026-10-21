-- ============================================================
-- Migration: Add wellness_categories to products
-- Purpose: Explicit category membership for /categories/[slug] and the buying guides, replacing
--          keyword matching on title/category/excerpt (which put dishwashing liquid under
--          women's wellness and missed relevant products).
--
-- Semantics:
--   NULL  = not reviewed yet -> the site falls back to keyword matching for this product
--   '{}'  = reviewed, belongs in no wellness category -> never shown on a category page
--   {...} = shown on exactly these category pages
--
-- The allowed values are the slugs in src/lib/category-config.ts. A test
-- (src/lib/__tests__/wellness-categories.test.ts) fails if the two lists drift, so adding a
-- category means updating both this constraint (in a new migration) and the config.
-- ============================================================

-- 1. Add the column (nullable: NULL means "not categorised yet")
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wellness_categories TEXT[];

-- 2. Only allow known category slugs
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_wellness_categories_allowed;
ALTER TABLE public.products
  ADD CONSTRAINT products_wellness_categories_allowed CHECK (
    wellness_categories <@ ARRAY[
      'menopause-support',
      'healthy-ageing',
      'gut-health',
      'sleep-recovery',
      'stress-management',
      'weight-management',
      'heart-health',
      'brain-health',
      'womens-wellness'
    ]::TEXT[]
  );

-- 3. Index for "products in category X" lookups
CREATE INDEX IF NOT EXISTS products_wellness_categories_idx
  ON public.products USING GIN (wellness_categories);

-- No RLS change: the column inherits the existing products policies. After applying, confirm in
-- the dashboard that a vendor can only UPDATE rows where vendor_id = auth.uid().
