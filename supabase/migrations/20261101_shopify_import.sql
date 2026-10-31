-- ============================================================
-- Migration: Shopify catalogue import (Admin > Product Catalog > Import from Shopify)
--
-- products.source_platform / source_ref   where an imported product came from (a Shopify product
--                                         id), so re-importing a store never duplicates it.
-- products.import_issue                   set while an imported product has a problem (an image that
--                                         could not be copied to R2). A flagged product cannot be
--                                         published; re-importing clears it once the problem is fixed.
-- vendor_shopify_stores                   one row per vendor: the Shopify store link and the daily
--                                         stock sync state. Admins only.
--
-- The import-shopify-catalogue Edge Function writes these with the service role after checking the
-- caller is an admin (or holds SHOPIFY_SYNC_SECRET). Safe to run more than once.
-- ============================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS source_platform text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS source_ref text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS import_issue text;

-- One imported product per vendor and source id. Partial, so hand-made products are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS products_vendor_source_unique
  ON public.products (vendor_id, source_platform, source_ref)
  WHERE source_ref IS NOT NULL;

-- A product with an import problem stays a draft, whichever path tries to publish it.
CREATE OR REPLACE FUNCTION public.block_publishing_flagged_product()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.import_issue IS NOT NULL THEN
    RAISE EXCEPTION 'This product cannot be published until its import problem is fixed: %', NEW.import_issue;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_publishing_flagged_product ON public.products;
CREATE TRIGGER trg_block_publishing_flagged_product
  BEFORE INSERT OR UPDATE OF status, import_issue ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.block_publishing_flagged_product();

CREATE TABLE IF NOT EXISTS public.vendor_shopify_stores (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  store_url text NOT NULL,
  sync_enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_sync_status text CHECK (last_sync_status IN ('ok', 'failed')),
  last_sync_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_shopify_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage shopify stores" ON public.vendor_shopify_stores;
CREATE POLICY "Admins manage shopify stores" ON public.vendor_shopify_stores
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
