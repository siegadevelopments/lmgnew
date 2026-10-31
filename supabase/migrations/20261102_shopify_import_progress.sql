-- ============================================================
-- Migration: background Shopify import progress
--
-- The import now keeps going on the server after the admin clicks Import (each batch triggers the
-- next), so progress lives on the store row and the admin screen reads it from there.
--   import_status       running | done | failed
--   import_started_at   when the current/last import began
--   import_updated_at   when the last batch finished (a running import with no update for 10
--                       minutes counts as stalled and may be started again)
--   import_summary      totals so far: imported, existing, retried, flagged, skipped, message
--
-- Run after 20261101_shopify_import.sql. Safe to run more than once.
-- ============================================================

ALTER TABLE public.vendor_shopify_stores
  ADD COLUMN IF NOT EXISTS import_status text CHECK (import_status IN ('running', 'done', 'failed'));
ALTER TABLE public.vendor_shopify_stores ADD COLUMN IF NOT EXISTS import_started_at timestamptz;
ALTER TABLE public.vendor_shopify_stores ADD COLUMN IF NOT EXISTS import_updated_at timestamptz;
ALTER TABLE public.vendor_shopify_stores ADD COLUMN IF NOT EXISTS import_summary jsonb;
